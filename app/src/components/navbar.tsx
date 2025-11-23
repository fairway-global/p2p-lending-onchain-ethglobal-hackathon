"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ExternalLink } from "lucide-react"
import { useAccount, useDisconnect } from "wagmi"
import { useMiniApp } from "@/contexts/miniapp-context"
import { Button } from "@/components/ui/button"
import { WalletConnector } from "@/components/wallet-connector"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Docs", href: "https://docs.celo.org", external: true },
]

export function Navbar() {
  const pathname = usePathname()
  const { address, isConnected, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const { context } = useMiniApp()
  
  // Extract user data from context
  const user = context?.user
  const walletAddress = address || user?.custody || user?.verifications?.[0] || null
  const displayName = user?.displayName || user?.username || "User"
  const pfpUrl = user?.pfpUrl
  
  // Format wallet address
  const formatAddress = (address: string | null) => {
    if (!address || address.length < 10) return "Not connected"
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-celo-light-tan">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden border-2 border-black">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 border-2 border-black bg-celo-dark-tan">
              <div className="flex items-center gap-2 mb-8">
                <span className="font-bold text-lg text-black">
                  Savelo
                </span>
              </div>
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className={`flex items-center gap-2 text-base font-medium transition-colors hover:text-celo-purple ${
                      pathname === link.href ? "text-black font-bold" : "text-celo-body-copy"
                    }`}
                  >
                    {link.name}
                    {link.external && <ExternalLink className="h-4 w-4" />}
                  </Link>
                ))}
                <div className="mt-6 pt-6 border-t-2 border-black">
                  <WalletConnector />
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="hidden font-bold text-xl sm:inline-block text-black">
              Savelo
            </span>
          </Link>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-celo-purple ${
                pathname === link.href
                  ? "text-black font-bold"
                  : "text-celo-body-copy"
              }`}
            >
              {link.name}
              {link.external && <ExternalLink className="h-4 w-4" />}
            </Link>
          ))}
          
          {/* User Info & Wallet */}
          <div className="flex items-center gap-4 pl-4 border-l-2 border-black">
            {isConnected && walletAddress ? (
              <>
                {/* User Profile */}
                <div className="flex items-center gap-3">
                  {pfpUrl && (
                    <div className="border-2 border-black">
                      <img 
                        src={pfpUrl} 
                        alt="Profile" 
                        className="w-8 h-8 object-cover"
                      />
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-body-s font-bold text-black">{displayName}</p>
                    <p className="text-eyebrow text-celo-body-copy font-inter">{formatAddress(walletAddress)}</p>
                  </div>
                </div>
                
                {/* Disconnect Button */}
                <Button
                  onClick={() => disconnect()}
                  variant="outline"
                  size="sm"
                  className="border-2 border-black"
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <WalletConnector />
            )}
          </div>
        </nav>
        
        {/* Mobile: User Info */}
        <div className="md:hidden flex items-center gap-2">
          {isConnected && walletAddress ? (
            <>
              {pfpUrl && (
                <div className="border-2 border-black">
                  <img 
                    src={pfpUrl} 
                    alt="Profile" 
                    className="w-8 h-8 object-cover"
                  />
                </div>
              )}
              <div className="text-right">
                <p className="text-body-s font-bold text-black">{displayName}</p>
                <p className="text-eyebrow text-celo-body-copy font-inter">{formatAddress(walletAddress)}</p>
              </div>
              <Button
                onClick={() => disconnect()}
                variant="outline"
                size="sm"
                className="border-2 border-black ml-2"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <WalletConnector />
          )}
        </div>
      </div>
    </header>
  )
}
