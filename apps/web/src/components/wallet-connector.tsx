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
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
          {connector?.name || "Connected"}
        </div>
        <Button
          onClick={() => disconnect()}
          variant="outline"
          className="text-sm"
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
          <Card className="absolute top-full mt-2 right-0 z-50 w-64 p-4 shadow-lg">
            <h3 className="text-sm font-semibold mb-3">Choose Wallet</h3>
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
                    className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {isMetaMask ? "🦊" : isFarcaster ? "🔷" : "🔗"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {isMetaMask
                          ? "MetaMask"
                          : isFarcaster
                          ? "Farcaster"
                          : connector.name || "Wallet"}
                      </div>
                      {!connector.ready && (
                        <div className="text-xs text-gray-500">Not available</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Don't have MetaMask?{" "}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
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

