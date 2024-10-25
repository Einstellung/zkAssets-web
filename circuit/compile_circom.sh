#!/bin/bash

# This is a basic shell script skeleton, gradually adding requirements to compile circom code

# Exit immediately if a command exits with a non-zero status
set -e

# Define directory structure
GENERATOR_DIR="generator"
PUBLIC_DIR="../public"

# Create generator directory if it does not exist
mkdir -p "$GENERATOR_DIR"

# Check if snarkjs is installed, if not, install it automatically
if ! pnpm list snarkjs &> /dev/null; then
  echo "snarkjs is not installed. Installing snarkjs using pnpm..."
  pnpm install snarkjs
fi

# Prompt the user to input the circom file name to compile
read -p "Please enter the name of the circom file to compile (without extension): " CIRCUIT_FILE

# Step 1: Compile the specified circom file to the generator directory
circom "${CIRCUIT_FILE}.circom" --r1cs --wasm --sym -o "$GENERATOR_DIR"

# Step 2: Generate the witness.wtns file
node "$GENERATOR_DIR/${CIRCUIT_FILE}_js/generate_witness.js" "$GENERATOR_DIR/${CIRCUIT_FILE}_js/${CIRCUIT_FILE}.wasm" "./input.json" "$GENERATOR_DIR/witness.wtns"

# Step 3: Perform Groth16 setup
pnpm exec snarkjs groth16 setup "$GENERATOR_DIR/${CIRCUIT_FILE}.r1cs" "./final_21.ptau" "$GENERATOR_DIR/${CIRCUIT_FILE}_0000.zkey"

# Step 4: Contribute to the zkey
pnpm exec snarkjs zkey contribute "$GENERATOR_DIR/${CIRCUIT_FILE}_0000.zkey" "$GENERATOR_DIR/circuit_final.zkey" --name="1st Contributor Name" -v

# Step 5: Export the verification key
pnpm exec snarkjs zkey export verificationkey "$GENERATOR_DIR/circuit_final.zkey" "$GENERATOR_DIR/verification_key.json"

# Step 6: Generate the proof
pnpm exec snarkjs groth16 prove "$GENERATOR_DIR/circuit_final.zkey" "$GENERATOR_DIR/witness.wtns" "$GENERATOR_DIR/proof.json" "$GENERATOR_DIR/public.json"

# Step 7: Verify the proof
pnpm exec snarkjs groth16 verify "$GENERATOR_DIR/verification_key.json" "$GENERATOR_DIR/public.json" "$GENERATOR_DIR/proof.json"

# Step 8: Copy verification related files to the public directory
mkdir -p "$PUBLIC_DIR"
cp "$GENERATOR_DIR/circuit_final.zkey" "$PUBLIC_DIR/"
cp "$GENERATOR_DIR/${CIRCUIT_FILE}_js/${CIRCUIT_FILE}.wasm" "$PUBLIC_DIR/circuit.wasm"
cp "$GENERATOR_DIR/verification_key.json" "$PUBLIC_DIR/"
