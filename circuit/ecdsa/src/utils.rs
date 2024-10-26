use ecc::{halo2::{arithmetic::CurveAffine, halo2curves::secp256k1::Secp256k1Affine}, maingate};
use libsecp256k1::{SecretKey, PublicKey};
use hex;
use maingate::big_to_fe;
use num_bigint::BigUint as big_uint;
use num_traits::Num;
use std::env;
use std::path::Path;

/// Converts a hex string private key to public key in big-endian format
/// Input: Private key as hex string (big-endian)
/// Output: Public key bytes in big-endian
pub fn generate_pubkey_from_privkey(private_key_hex: &str) -> Result<(String, String), Box<dyn std::error::Error>> {
    // Convert hex string to bytes (from big-endian)
    let private_key_bytes = hex::decode(private_key_hex)?;
    
    // Validate private key length
    if private_key_bytes.len() != 32 {
        return Err("Invalid private key length. Expected 32 bytes".into());
    }
    
    // Create SecretKey from bytes
    let secret_key = SecretKey::parse_slice(&private_key_bytes)?;
    
    // Generate public key from private key
    let public_key = PublicKey::from_secret_key(&secret_key);
    
    // Serialize public key to uncompressed format (65 bytes)
    let pubkey_serialized = public_key.serialize();
    
    // Extract x and y coordinates (32 bytes each)
    let x_bytes = &pubkey_serialized[1..33];
    let y_bytes = &pubkey_serialized[33..65];
    
    // Convert to hex directly (keeping big-endian order)
    let x_hex = hex::encode(x_bytes);
    let y_hex = hex::encode(y_bytes);
    
    Ok((x_hex, y_hex))
}

/// Verify if a point (x,y) in little-endian hex format is on secp256k1 curve
/// Input: x and y coordinates as little-endian hex strings
/// Returns: true if point is on curve, false otherwise
pub fn verify_pubkey_on_curve(x_le_hex: &str, y_le_hex: &str) -> Result<bool, Box<dyn std::error::Error>> {
    // Convert little-endian hex to big-endian bytes
    let mut x_bytes = hex::decode(x_le_hex)?;
    let mut y_bytes = hex::decode(y_le_hex)?;
    x_bytes.reverse();
    y_bytes.reverse();

    // Convert to field elements
    let x_big = big_uint::from_bytes_be(&x_bytes);
    let y_big = big_uint::from_bytes_be(&y_bytes);
    
    let x = big_to_fe(x_big);
    let y = big_to_fe(y_big);

    // Try to create point from coordinates
    let point = Secp256k1Affine::from_xy(x, y);
    
    Ok(point.is_some().into())
}

/// Convert a hex string (big-endian) to curve's ScalarExt
/// Input: hex string in big-endian format
/// Output: ScalarExt for the curve
pub fn hex_to_scalar<C: CurveAffine>(hex_str: &str) -> Result<C::ScalarExt, Box<dyn std::error::Error>> {
    // Decode hex string to bytes
    let bytes = hex::decode(hex_str)?;
    
    // Convert to BigUint (maintaining big-endian order)
    let big_num = big_uint::from_bytes_be(&bytes);
    
    // Convert to scalar field element
    let scalar: C::ScalarExt = big_to_fe(big_num);
    
    Ok(scalar)
}

pub fn get_test_private_key() -> String {
    // Look for .env.local in the project root (ZK_ASSETS-WEB directory)
    let root_env_path = Path::new("../../.env.local");
    dotenv::from_path(root_env_path).ok();
    
    env::var("ECDSA_PRIVATE_KEY")
        .expect("ECDSA_PRIVATE_KEY must be set in .env.local")
}

/// Get public key from environment and convert it to curve point format
/// The public key in .env.local is stored as "x,y" in hex format
pub fn get_test_public_key<C: CurveAffine>() -> Result<C, Box<dyn std::error::Error>> {
    // Get public key from environment
    let root_env_path = Path::new("../../.env.local");
    dotenv::from_path(root_env_path).ok();
    
    let pubkey_str = env::var("ECDSA_PUBLIC_KEY")
        .expect("ECDSA_PUBLIC_KEY must be set in .env.local");
    
    // Split the string into x and y coordinates
    let coords: Vec<&str> = pubkey_str.split(',').collect();
    if coords.len() != 2 {
        return Err("Invalid public key format. Expected 'x,y'".into());
    }

    // Convert hex strings to field elements
    let x_big = big_uint::from_str_radix(coords[0].trim(), 16)?;
    let y_big = big_uint::from_str_radix(coords[1].trim(), 16)?;
    
    let x: C::Base = big_to_fe(x_big);
    let y: C::Base = big_to_fe(y_big);

    // Create point from coordinates
    let point = C::from_xy(x, y).expect("Invalid public key coordinates - point not on curve");

    Ok(point)
}

#[cfg(test)]
mod tests {
    use ecc::halo2::halo2curves;
    use maingate::fe_to_big;
    use super::*;
    use halo2curves::group::Curve;

    #[test]
    fn test_generate_pubkey() {
        // Test private key (32 bytes in hex, big-endian)
        let private_key = get_test_private_key();
        
        let result = generate_pubkey_from_privkey(&private_key);
        assert!(result.is_ok());
        
        let pubkey = result.unwrap();
        println!("pubkey: {:?}", pubkey);
    }

    #[test]
    fn test_verify_pubkey() {
        // Test with a valid public key first
        let private_key = get_test_private_key();
        let (x_be, y_be) = generate_pubkey_from_privkey(&private_key).unwrap();
        
        // Since verify_pubkey_on_curve expects little-endian input, we need to convert
        let mut x_bytes = hex::decode(&x_be).unwrap();
        let mut y_bytes = hex::decode(&y_be).unwrap();
        x_bytes.reverse();
        y_bytes.reverse();
        let x_le = hex::encode(x_bytes);
        let y_le = hex::encode(y_bytes);
        
        let result = verify_pubkey_on_curve(&x_le, &y_le);
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_get_public_key() {
        let result = get_test_public_key::<Secp256k1Affine>();
        assert!(result.is_ok());
        
        let public_key = result.unwrap();
        
        // Verify that this public key corresponds to our private key
        let private_key = get_test_private_key();
        let sk = hex_to_scalar::<Secp256k1Affine>(&private_key).unwrap();
        let expected_pubkey = (Secp256k1Affine::generator() * sk).to_affine();
        
        assert_eq!(public_key, expected_pubkey);
    }

    #[test]
    fn test_hex_to_scalar() {
        let private_key = get_test_private_key();

        // Convert to scalar
        let scalar = hex_to_scalar::<Secp256k1Affine>(&private_key).unwrap();
        
        // Convert back to hex for verification
        let big_num = fe_to_big(scalar);
        let mut bytes = big_num.to_bytes_be();
        
        // Pad to 32 bytes if necessary
        while bytes.len() < 32 {
            bytes.insert(0, 0);
        }
        
        let hex_result = hex::encode(bytes);
        assert_eq!(hex_result, private_key.to_lowercase());
    }
}
