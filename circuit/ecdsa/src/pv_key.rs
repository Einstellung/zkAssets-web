// just write here won't be used in the future
use ecc::halo2::{self, SerdeFormat};
use ecc::halo2::arithmetic::CurveAffine;
use ecc::halo2::circuit::Value;
use ecc::halo2::halo2curves::secp256k1::Secp256k1Affine;
use halo2::halo2curves::group::{Curve, Group};
use ecc::halo2::plonk::{keygen_pk, keygen_vk};
use ecc::halo2::poly::commitment::Params;
use ecc::halo2::poly::kzg::commitment::ParamsKZG;
use ecc::halo2::halo2curves::bn256::{Bn256, Fr as BnScalar};
use rand_core::OsRng;
use std::fs::File;
use std::io::{BufReader, BufWriter};
use std::marker::PhantomData;

use crate::ecdsa::TestCircuitEcdsaVerify;

pub fn generate_keys() -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting key generation process...");
    
    // 创建示例电路
    let aux_generator = <Secp256k1Affine as CurveAffine>::CurveExt::random(OsRng).to_affine();
    let circuit = TestCircuitEcdsaVerify::<Secp256k1Affine, BnScalar> {
        public_key: Value::unknown(),
        signature: Value::unknown(),
        msg_hash: Value::unknown(),
        aux_generator,
        window_size: 4,
        _marker: PhantomData,
    };

    // 加载 KZG 参数
    println!("Loading KZG parameters...");
    let params_bytes = include_bytes!("kzg_bn254_18.srs");
    let params = ParamsKZG::<Bn256>::read(&mut BufReader::new(&params_bytes[..]))
        .map_err(|e| format!("Failed to read KZG parameters: {}", e))?;
    println!("✅ KZG parameters loaded successfully");

    // 生成 vk
    println!("Generating verification key...");
    let vk = keygen_vk(&params, &circuit)
        .map_err(|e| format!("Failed to generate verification key: {}", e))?;
    println!("✅ Verification key generated successfully");

    // 生成 pk
    println!("Generating proving key...");
    let pk = keygen_pk(&params, vk.clone(), &circuit)
        .map_err(|e| format!("Failed to generate proving key: {}", e))?;
    println!("✅ Proving key generated successfully");

    // 保存 vk
    println!("Saving verification key...");
    let vk_path = "../pkg/ecdsa_vk.bin";
    let mut vk_file = BufWriter::new(File::create(vk_path)?);
    vk.write(&mut vk_file, SerdeFormat::Processed)
        .map_err(|e| format!("Failed to write verification key: {}", e))?;
    println!("✅ Verification key saved to {}", vk_path);

    // 保存 pk
    println!("Saving proving key...");
    let pk_path = "../pkg/ecdsa_pk.bin";
    let mut pk_file = BufWriter::new(File::create(pk_path)?);
    pk.write(&mut pk_file, SerdeFormat::Processed)
        .map_err(|e| format!("Failed to write proving key: {}", e))?;
    println!("✅ Proving key saved to {}", pk_path);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_keys() {
        // 确保目标目录存在
        std::fs::create_dir_all("../pkg").expect("Failed to create pkg directory");
        
        // 生成密钥
        generate_keys().expect("Failed to generate keys");
        
        // 验证文件是否生成
        assert!(std::path::Path::new("../pkg/ecdsa_vk.bin").exists(), "Verification key file not found");
        assert!(std::path::Path::new("../pkg/ecdsa_pk.bin").exists(), "Proving key file not found");
        
        // 验证文件大小不为0
        let vk_size = std::fs::metadata("../pkg/ecdsa_vk.bin").unwrap().len();
        let pk_size = std::fs::metadata("../pkg/ecdsa_pk.bin").unwrap().len();
        assert!(vk_size > 0, "Verification key file is empty");
        assert!(pk_size > 0, "Proving key file is empty");
        
        println!("✅ Keys generated and saved successfully");
        println!("   Verification key size: {} bytes", vk_size);
        println!("   Proving key size: {} bytes", pk_size);
    }
}