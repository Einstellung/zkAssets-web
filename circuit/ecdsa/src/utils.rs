use ecc::{halo2::{arithmetic::CurveAffine, halo2curves::secp256k1::Secp256k1Affine}, maingate};
use libsecp256k1::{SecretKey, PublicKey};
use hex;
use maingate::big_to_fe;
use num_bigint::BigUint as big_uint;

/// Converts a hex string private key to public key in little-endian format
/// Input: Private key as hex string (big-endian)
/// Output: Public key bytes in little-endian
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
    
    // Convert to little-endian hex
    let x_le_hex = hex::encode(x_bytes.iter().rev().cloned().collect::<Vec<u8>>());
    let y_le_hex = hex::encode(y_bytes.iter().rev().cloned().collect::<Vec<u8>>());
    
    Ok((x_le_hex, y_le_hex))
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::path::Path;

    fn get_test_private_key() -> String {
        // Look for .env.local in the project root (ZK_ASSETS-WEB directory)
        let root_env_path = Path::new("../../.env.local");
        dotenv::from_path(root_env_path).ok();
        
        env::var("ECDSA_PRIVATE_KEY")
            .expect("ECDSA_PRIVATE_KEY must be set in .env.local")
    }

    #[test]
    fn test_generate_pubkey() {
        // Test private key (32 bytes in hex)
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
        let (x_le, y_le) = generate_pubkey_from_privkey(&private_key).unwrap();
        
        let result = verify_pubkey_on_curve(&x_le, &y_le);
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
}
