import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ConnectButtonRain() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        const ButtonWallet = ({
          text,
          fun,
        }: {
          text: string;
          fun: () => void;
        }) => {
          return (
            <div className="relative cursor-pointer" onClick={fun}>
              <div className="top-1/4 left-2 absolute font-black text-white">
                {text}
              </div>
            </div>
          );
        };
        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <ButtonWallet
                    text={"Connect Wallet"}
                    fun={openConnectModal}
                  />
                );
              }
              if (chain.unsupported) {
                return (
                  <ButtonWallet text={"Wrong network"} fun={openChainModal} />
                );
              }
              return (
                <ButtonWallet
                  text={account.displayName}
                  fun={openAccountModal}
                />
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
