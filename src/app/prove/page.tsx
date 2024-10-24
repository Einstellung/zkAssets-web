"use client";

import ConnectBtn from "@/compoments/ConnectButton";

export default function Prove() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="w-fit border border-white rounded-xl py-2 px-4">
          <ConnectBtn />
        </div>
      </div>
    </main>
  );
}
