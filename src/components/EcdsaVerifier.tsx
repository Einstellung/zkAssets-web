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

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">ECDSA Proof Generator</h2>
      
      {!wasmLoaded ? (
        <div className="text-center py-4">Loading WASM module...</div>
      ) : (
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