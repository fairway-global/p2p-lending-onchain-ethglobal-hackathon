"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function WalletConnector() {
  const [mounted, setMounted] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
    // Debug: Log available connectors
    if (connectors.length > 0) {
      console.log("Available connectors:", connectors.map(c => ({
        id: c.id,
        name: c.name,
        ready: c.ready,
      })));
    } else {
      console.warn("No connectors available");
    }
  }, [connectors]);

  useEffect(() => {
    if (connectError) {
      setError(connectError.message);
    }
  }, [connectError]);

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
              {connectors.length === 0 ? (
                <div className="p-4 border-2 border-black bg-celo-inactive">
                  <p className="text-body-s text-black font-bold">No wallets detected</p>
                  <p className="text-body-s text-celo-body-copy mt-1">
                    Install MetaMask or use Farcaster to connect
                  </p>
                </div>
              ) : (
                connectors.map((connector) => {
                  const connectorName = connector.name?.toLowerCase() || "";
                  const connectorId = connector.id?.toLowerCase() || "";
                  
                  const isMetaMask = 
                    connectorName.includes("metamask") || 
                    connectorId.includes("metamask") ||
                    connectorId === "io.metamask" ||
                    connectorId === "metamasksdk" ||
                    connectorId === "injected";
                  const isFarcaster = 
                    connectorName.includes("farcaster") || 
                    connectorId.includes("farcaster") ||
                    connectorId === "farcaster" ||
                    connectorId === "framewallet" ||
                    connectorId === "farcasterminiapp";
                
                return (
                  <button
                    key={connector.id}
                    onClick={async () => {
                      if (!connector.ready && connector.id !== "injected") {
                        setError("This wallet is not available. Please install MetaMask or use Farcaster.");
                        return;
                      }
                      try {
                        setError(null);
                        await connect({ connector });
                        setShowConnectors(false);
                      } catch (err: any) {
                        console.error("Failed to connect:", err);
                        setError(err?.message || "Failed to connect wallet");
                      }
                    }}
                    disabled={isPending}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-2 border-black ${
                      connector.ready || connector.id === "injected"
                        ? "bg-white hover:bg-celo-yellow hover:border-celo-purple cursor-pointer"
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
              }))}
            </div>
            {error && (
              <div className="mt-4 p-3 border-2 border-celo-error bg-black">
                <p className="text-body-s text-celo-error font-bold">{error}</p>
              </div>
            )}
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
            {connectors.length === 0 && (
              <p className="mt-2 text-body-s text-celo-body-copy">
                No wallets detected. Make sure MetaMask is installed.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
