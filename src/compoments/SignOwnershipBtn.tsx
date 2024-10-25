"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useSignMessage, useSwitchChain } from "wagmi";
import { verifyMessage } from "ethers";
import { sepolia } from "wagmi/chains";

export default function SignOwnershipBtn() {
  const [isSigning, setIsSigning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(
    null,
  );
  const { address } = useAccount();
  const { data, signMessage } = useSignMessage();
  const { switchChain } = useSwitchChain();

  const handleSign = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }
    await switchChain({ chainId: sepolia.id });

    setIsSigning(true);
    try {
      const message = `I confirm that I am the owner of address ${address}`;
      const signature = await signMessage({ message });
      console.log("Signature successful:", signature);
    } catch (error) {
      console.error("Signature failed:", error);
    } finally {
      setIsSigning(false);
    }
  };

  const handleVerify = async () => {
    if (!address || !lastSignature) {
      alert("Please sign first");
      return;
    }

    setIsVerifying(true);
    try {
      const message = `I confirm that I am the owner of address ${address}`;
      const recoveredAddress = verifyMessage(message, lastSignature);
      const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();
      setVerificationResult(isValid);
      console.log("Verification result:", isValid);
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationResult(false);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (data) {
      setLastSignature(data);
    }
  }, [data]);
  console.log(58, isVerifying, lastSignature, isVerifying || !lastSignature);

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 rounded-lg shadow-md">
      <div className="flex space-x-4 mb-4">
        <button
          onClick={handleSign}
          disabled={isSigning}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isSigning ? "Signing..." : "Sign Ownership"}
        </button>
        <button
          onClick={handleVerify}
          disabled={isVerifying || !lastSignature}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md border-2 border-purple-600"
        >
          {isVerifying ? "Verifying..." : "Verify Signature"}
        </button>
      </div>
      {lastSignature && (
        <div className="text-black mt-4 p-4 bg-gray-200 rounded-lg w-full break-all">
          <p className="text-sm font-semibold mb-2">Last Signature:</p>
          <p className="text-xs">{lastSignature}</p>
        </div>
      )}
      {verificationResult !== null && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            verificationResult
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <p className="text-lg font-semibold">
            {verificationResult ? "✅ Signature Valid" : "❌ Signature Invalid"}
          </p>
        </div>
      )}
    </div>
  );
}
