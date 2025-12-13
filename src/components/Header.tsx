'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Droplets, Sparkles, Target, PlusCircle, Home, Menu, X, Star } from 'lucide-react'

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Favorites', href: '/favorites' },
    { name: 'Create', href: '/createVault' },
    { name: 'Explorer', href: '/explorer' },
  ]

  return (
    <>
      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .dropdown-enter {
          animation: fadeInScale 0.15s ease-out forwards;
        }
        .glass-shine {
          position: relative;
          overflow: hidden;
        }
        .glass-shine::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          animation: shimmer 3s infinite;
        }
        /* Custom styles for RainbowKit button hover */
        :global([data-rk] button:hover) {
          background: linear-gradient(to right, #ffffff, #34d399, #7ecbff) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
        }
      `}</style>
      <header className="fixed w-full top-0 z-50 flex justify-center items-center">
        <div className="relative w-full flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 mt-2 sm:mt-3 rounded-2xl mx-2 sm:mx-4 glass-shine">
          {/* Main Glass Container */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-2xl"></div>

          {/* Inner Glass Layer */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>

          {/* Border Glass Effect */}
          <div className="absolute inset-0 rounded-2xl border border-white/30 shadow-2xl"></div>

          {/* Top Highlight */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"></div>

          {/* Bottom Subtle Shadow */}
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent rounded-full"></div>

          {/* Outer Glow */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-white/20 via-gray-200/20 to-white/20 blur-xl opacity-60 pointer-events-none"></div>

          {/* Logo Section */}
          <div className="flex-1 pl-2 sm:pl-4 md:pl-8 relative z-10">
            <Link href='/' className='flex items-center gap-2 sm:gap-3 group w-fit'>
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold font-futuristic bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff] bg-clip-text text-transparent tracking-widest drop-shadow-2xl group-hover:from-gray-50 group-hover:via-white group-hover:to-gray-200 transition-all duration-300">
                Raindrop
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 md:gap-4 z-10">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`
                    relative px-3 md:px-4 py-1.5 sm:py-2 rounded-xl text-sm md:text-base font-bold transition-all duration-300
                    ${isActive
                      ? 'text-white bg-white/10 shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-white/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-emerald-500/20 blur-sm -z-10"></span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right Side - Mobile Menu Button & Connect Button */}
          <div className="flex items-center gap-2 sm:gap-4 relative z-10">
            {/* Mobile Menu Button - Only visible on mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>

            {/* Connect Wallet Button */}
            <div className="relative scale-75 sm:scale-90 md:scale-100 origin-right">
              <ConnectButton />
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-2 sm:mx-4 z-40 dropdown-enter">
            <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-2xl p-4">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        relative px-4 py-3 rounded-xl text-base font-bold transition-all duration-300
                        ${isActive
                          ? 'text-white bg-white/10 shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-white/20'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      {link.name}
                      {isActive && (
                        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-emerald-500/20 blur-sm -z-10"></span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}