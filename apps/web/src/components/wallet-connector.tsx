"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function WalletConnector() {
  const [mounted, setMounted] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button disabled>
        Connect Wallet
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 border-2 border-black bg-celo-yellow text-black text-eyebrow font-bold uppercase">
          {connector?.name || "Connected"}
        </div>
        <Button
          onClick={() => disconnect()}
          variant="outline"
          size="sm"
        >
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Disconnect"}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowConnectors(!showConnectors)}
        disabled={isPending}
      >
        {isPending ? "Connecting..." : "Connect Wallet"}
      </Button>

      {showConnectors && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowConnectors(false)}
          />
          <Card className="absolute top-full mt-2 right-0 z-50 w-72 p-6 border-2 border-black bg-celo-dark-tan">
            <h3 className="text-eyebrow font-bold text-black mb-4 uppercase">Choose Wallet</h3>
            <div className="space-y-2">
              {connectors.map((connector) => {
                const connectorName = connector.name?.toLowerCase() || "";
                const connectorId = connector.id?.toLowerCase() || "";
                const isMetaMask = 
                  connectorName.includes("metamask") || 
                  connectorId.includes("metamask") ||
                  connectorId === "io.metamask" ||
                  connectorId === "metamasksdk";
                const isFarcaster = 
                  connectorName.includes("farcaster") || 
                  connectorId.includes("farcaster") ||
                  connectorId === "farcaster" ||
                  connectorId === "framewallet";
                
                return (
                  <button
                    key={connector.id}
                    onClick={() => {
                      connect({ connector });
                      setShowConnectors(false);
                    }}
                    disabled={!connector.ready || isPending}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-2 border-black ${
                      connector.ready
                        ? "bg-white hover:bg-celo-yellow hover:border-celo-purple"
                        : "bg-celo-inactive opacity-50 cursor-not-allowed"
                    } transition-all`}
                  >
                    <div className={`w-10 h-10 border-2 border-black flex items-center justify-center text-body-m font-bold ${
                      isMetaMask ? "bg-celo-orange" : isFarcaster ? "bg-celo-light-blue" : "bg-celo-pink"
                    }`}>
                      {isMetaMask ? "🦊" : isFarcaster ? "🔷" : "🔗"}
                    </div>
                    <div className="flex-1">
                      <div className="text-body-m font-bold text-black">
                        {isMetaMask
                          ? "MetaMask"
                          : isFarcaster
                          ? "Farcaster"
                          : connector.name || "Wallet"}
                      </div>
                      {!connector.ready && (
                        <div className="text-body-s text-celo-body-copy">Not available</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-body-s text-celo-body-copy">
              Don't have MetaMask?{" "}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-celo-purple hover:text-black underline font-bold"
              >
                Install it here
              </a>
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
