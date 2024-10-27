// download from https://github.com/han0110/halo2-kzg-srs instead, won't compile by myself.
use std::marker::PhantomData;
use std::fs::File;
use ecc::halo2;
use ecc::halo2::arithmetic::CurveAffine;
use ecc::halo2::circuit::Value;
use ecc::halo2::halo2curves::bn256::Fr as BnScalar;
use ecc::halo2::halo2curves::secp256k1::Secp256k1Affine;
use ecc::halo2::poly::commitment::{Params, ParamsProver};
use ecc::halo2::poly::ipa::commitment::ParamsIPA;
use ecc::maingate::DimensionMeasurement;
use ecc::halo2::halo2curves::group::{Group, Curve};
use halo2::halo2curves::bn256::G1Affine as EqAffine;
use rand_core::OsRng;

use crate::ecdsa::TestCircuitEcdsaVerify;

pub fn generate_params() -> Result<(), Box<dyn std::error::Error>> {
    println!("Generating parameters...");
    // 创建一个示例电路来计算所需的 k 值
    let aux_generator = <Secp256k1Affine as CurveAffine>::CurveExt::random(OsRng).to_affine();
    let circuit = TestCircuitEcdsaVerify::<Secp256k1Affine, BnScalar> {
        public_key: Value::unknown(),  // 使用 unknown 值，因为我们只需要电路结构
        signature: Value::unknown(),
        msg_hash: Value::unknown(),
        aux_generator,
        window_size: 4,
        _marker: PhantomData,
    };

    // 计算所需的 k 值
    let dimension = DimensionMeasurement::measure(&circuit)?;
    let k = dimension.k();
    println!("Required k = {}", k);

    // 生成参数
    let params: ParamsIPA<EqAffine> = ParamsProver::<EqAffine>::new(k);

    // 保存参数到文件
    let mut file = File::create("ecdsa_params.bin")?;
    params.write(&mut file)?;
    println!("Parameters written to ecdsa_params.bin");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_params() {
        generate_params().expect("Failed to generate parameters");
    }
}