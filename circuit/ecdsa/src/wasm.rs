// wasm config reference by this link: https://medium.com/@yujiangtham/building-a-zero-knowledge-web-app-with-halo-2-and-wasm-part-2-379477444dc3

use crate::ecdsa::TestCircuitEcdsaVerify;
use crate::halo2;
use crate::utils::hex_to_scalar;
use ecc::halo2::halo2curves::bn256::Bn256;
use ecc::halo2::plonk::{create_proof, keygen_pk, keygen_vk};
use ecc::halo2::poly::commitment::Params;
use ecc::halo2::poly::kzg::commitment::{KZGCommitmentScheme, ParamsKZG};
use ecc::halo2::poly::kzg::multiopen::ProverGWC;
use ecc::halo2::transcript::{Blake2bWrite, Challenge255, TranscriptWriterBuffer};
use ecc::maingate::big_to_fe;
use halo2::halo2curves::bn256::G1Affine;
use halo2::halo2curves::group::{Curve, Group};
use halo2::arithmetic::CurveAffine;
use halo2::circuit::Value;
use halo2::halo2curves::secp256k1::Secp256k1Affine;
use halo2::halo2curves::bn256::Fr as BnScalar;
use js_sys::Uint8Array;
use num_bigint::BigUint as big_uint;
use num_traits::Num;
use rand_core::OsRng;
use std::io::BufReader;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

fn copy_to_u8array(v: &Vec<u8>) -> Uint8Array {
    let u8_arr = Uint8Array::new_with_length(v.len() as u32);
    u8_arr.copy_from(v);
    u8_arr
}

fn normalize_hex_string(input: &str) -> Result<String, String> {
    let normalized = input
        .trim()                    // 移除两端空白
        .to_lowercase()            // 转换为小写
        .trim_start_matches("0x")  // 移除可能的 0x 前缀
        .replace(" ", "");         // 移除所有空格

    // 确保长度是 64
    if normalized.len() != 64 {
        return Err(format!(
            "Invalid hex string length: expected 64, got {}",
            normalized.len()
        ));
    }

    // 验证是否都是有效的十六进制字符
    if !normalized.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("Invalid hex characters found".to_string());
    }

    Ok(normalized)
}

/// 从外部输入的大端序 hex 字符串转换为曲线上的点
fn parse_public_key<C: CurveAffine>(pubkey_x: &str, pubkey_y: &str) -> Result<C, JsValue> {
    let x_str = normalize_hex_string(pubkey_x)
        .map_err(|e| JsValue::from_str(&format!("Invalid x coordinate: {}", e)))?;
    let y_str = normalize_hex_string(pubkey_y)
        .map_err(|e| JsValue::from_str(&format!("Invalid y coordinate: {}", e)))?;

    let x_big = big_uint::from_str_radix(&x_str, 16)
        .map_err(|e| JsValue::from_str(&format!("Invalid x coordinate: {}", e)))?;
    let y_big = big_uint::from_str_radix(&y_str, 16)
        .map_err(|e| JsValue::from_str(&format!("Invalid y coordinate: {}", e)))?;

    let x: C::Base = big_to_fe(x_big);
    let y: C::Base = big_to_fe(y_big);

    // Create point from coordinates
    let point = C::from_xy(x, y);
    // is_some return `Choice` type, so we need to convert it to bool (use into() to convert Choice to bool)
    if point.is_some().into() {
        Ok(point.unwrap())
    } else {
        Err(JsValue::from_str("Invalid public key coordinates - point not on curve"))
    }
}

#[wasm_bindgen]
pub fn generate_proof(
    message_hash: String,
    signature_r: String,
    signature_s: String,
    pubkey_x: String,
    pubkey_y: String,
) -> Result<Uint8Array, JsValue> {
    log("Starting proof generation...");

    let msg_hash = hex_to_scalar::<Secp256k1Affine>(&message_hash)
        .map_err(|e| JsValue::from_str(&format!("Message hash conversion failed: {}", e)))?;
    
    let r = hex_to_scalar::<Secp256k1Affine>(&signature_r)
        .map_err(|e| JsValue::from_str(&format!("Signature R conversion failed: {}", e)))?;
    
    let s = hex_to_scalar::<Secp256k1Affine>(&signature_s)
        .map_err(|e| JsValue::from_str(&format!("Signature S conversion failed: {}", e)))?;
    
    let public_key = parse_public_key::<Secp256k1Affine>(&pubkey_x, &pubkey_y)?;
    log("✅ Input parameters successfully parsed and validated");

    let aux_generator = <Secp256k1Affine as CurveAffine>::CurveExt::random(OsRng).to_affine();
    let circuit = TestCircuitEcdsaVerify::<Secp256k1Affine, BnScalar> {
        public_key: Value::known(public_key),
        signature: Value::known((r, s)),
        msg_hash: Value::known(msg_hash),
        aux_generator,
        window_size: 4,
        ..Default::default()
    };
    log("✅ Circuit successfully constructed");

    let params_bytes = include_bytes!("kzg_bn254_18.srs");
    log(&format!("Loading KZG parameters (size: {} bytes)...", params_bytes.len()));
    
    let params = ParamsKZG::<Bn256>::read(&mut BufReader::new(&params_bytes[..]))
        .map_err(|e| JsValue::from_str(&format!(
            "Failed to read KZG parameters (size: {} bytes): {}", 
            params_bytes.len(), 
            e
        )))?;
    log("✅ KZG parameters successfully loaded");

    let vk = keygen_vk(&params, &circuit)
        .map_err(|e| JsValue::from_str(&format!("Failed to generate verification key: {}", e)))?;
    log("✅ Verification key generated");
    
    let pk = keygen_pk(&params, vk, &circuit)
        .map_err(|e| JsValue::from_str(&format!("Failed to generate proving key: {}", e)))?;
    log("✅ Proving key generated");

    let mut transcript = Blake2bWrite::<_, G1Affine, Challenge255<G1Affine>>::init(vec![]);
    create_proof::<
        KZGCommitmentScheme<Bn256>,
        ProverGWC<'_, Bn256>,
        Challenge255<G1Affine>,
        OsRng,
        Blake2bWrite<Vec<u8>, G1Affine, Challenge255<G1Affine>>,
        TestCircuitEcdsaVerify<Secp256k1Affine, BnScalar>
    >(
        &params,
        &pk,
        &[circuit],
        &[&[]], 
        OsRng,
        &mut transcript,
    )
    .map_err(|e| JsValue::from_str(&format!("Failed to create proof: {}", e)))?;
    log("✅ Proof successfully created");

    let proof = transcript.finalize();
    log(&format!("✅ Final proof size: {} bytes", proof.len()));
    
    Ok(copy_to_u8array(&proof))
}

// #[wasm_bindgen]
// pub fn verify_proof(
//     proof: &[u8],
//     public_inputs: &[u8], // 如果有的话
// ) -> Result<bool, JsValue> {
//     log("Verifying proof...");

//     // 只需要 verifying key
//     let vk_bytes = include_bytes!("../ecdsa_vk.bin");
//     let vk = VerifyingKey::read(&mut BufReader::new(&vk_bytes[..]))
//         .map_err(|e| JsValue::from_str(&e.to_string()))?;

//     // 验证证明
//     let result =
//         verify_proof(&vk, proof, public_inputs).map_err(|e| JsValue::from_str(&e.to_string()))?;

//     Ok(result)
// }
