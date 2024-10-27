"use client"
import { useEffect, useState } from "react";
import init from "@/lib/ecdsa-wasm/ecdsa";
import EcdsaVerifier from "@/components/EcdsaVerifier";

export default function Home() {
  const [wasmLoaded, setWasmLoaded] = useState(false);

  useEffect(() => {
    init()
      .then(() => {
        setWasmLoaded(true);
        console.log('WASM module loaded');
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        ECDSA ZK Proof Demo
      </h1>
      <EcdsaVerifier wasmLoaded={wasmLoaded} />
    </div>
  );
}