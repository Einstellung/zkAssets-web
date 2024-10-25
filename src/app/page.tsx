"use client";
import React from "react";
import ConnectBtn from "@/compoments/ConnectButton";
import SignOwnershipBtn from "@/compoments/SignOwnershipBtn";
import FileUploader from "@/compoments/FileUploader";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="w-fit border border-white rounded-xl py-2 px-4">
          <ConnectBtn />
          <SignOwnershipBtn />
          <FileUploader />
        </div>
      </div>
    </main>
  );
}
