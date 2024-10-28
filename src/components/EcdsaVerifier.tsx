import { generate_proof } from '@/lib/ecdsa-wasm/ecdsa';
import { useState } from 'react'

interface EcdsaVerifierProps {
  wasmLoaded: boolean;
}

export default function EcdsaVerifier({ wasmLoaded }: EcdsaVerifierProps) {
  const [inputs, setInputs] = useState({
    messageHash: '',
    signatureR: '',
    signatureS: '',
    pubkeyX: '',
    pubkeyY: ''
  });
  const [proof, setProof] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const proof = await generate_proof(
        inputs.messageHash,
        inputs.signatureR,
        inputs.signatureS,
        inputs.pubkeyX,
        inputs.pubkeyY
      );
      setProof(proof);
    } catch (err:any) {
    //   setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setError(err.toString());
    }
  };

  const testData = {
    messageHash: "3dce4c209ac60432a2ea09df4f6ebbea491a6cbbf1119c1e27ca8e9b5a1d7fc5",
    signatureR: "c48fbc06d80bdc4a04ede1bb9365fd08f4b5067147233284e3bd89242be47fb0",
    signatureS: "591e1fa44b00de3b04296b1ee8b6513b562f410cad76c21c57c8525afffab430",
    pubkeyX: "b4adfc73ebf5417832d640dc8a37e200bc0296fba2235c730753e56c3b1d08f9",
    pubkeyY: "ffd89be8528b8e610aabe19e3be7e0b92f426f6f12979fa129f262c7e02e2ab5"
  };

  const fillTestData = () => {
    setInputs(testData);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">ECDSA Proof Generator</h2>
      
      {!wasmLoaded ? (
        <div className="text-center py-4">Loading WASM module...</div>
      ) : (
        <>
          <button
            type="button"
            onClick={fillTestData}
            className="mb-4 px-4 py-2 bg-gray-200 rounded"
          >
            Fill Test Data
          </button>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Message Hash</label>
              <input
                type="text"
                name="messageHash"
                value={inputs.messageHash}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="Enter message hash (hex)"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Signature R</label>
                <input
                  type="text"
                  name="signatureR"
                  value={inputs.signatureR}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Signature R (hex)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Signature S</label>
                <input
                  type="text"
                  name="signatureS"
                  value={inputs.signatureS}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Signature S (hex)"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Public Key X</label>
                <input
                  type="text"
                  name="pubkeyX"
                  value={inputs.pubkeyX}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Public Key X (hex)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Public Key Y</label>
                <input
                  type="text"
                  name="pubkeyY"
                  value={inputs.pubkeyY}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Public Key Y (hex)"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Generate Proof
            </button>
          </form>
        </>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {proof && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Generated Proof:</h3>
          <div className="bg-gray-100 p-4 rounded break-all font-mono text-sm">
            {Array.from(proof).map(b => b.toString(16).padStart(2, '0')).join('')}
          </div>
        </div>
      )}
    </div>
  );
}
