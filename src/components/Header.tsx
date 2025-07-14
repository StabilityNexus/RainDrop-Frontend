'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Droplets, Sparkles, Target, PlusCircle, Home, Menu, ChevronDown, Star } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/explorer', label: 'Explorer', icon: Target },
    { href: '/myVaults', label: 'My Vaults', icon: Sparkles },
    { href: '/favorites', label: 'Favorites', icon: Star },
    { href: '/createVault', label: 'Create', icon: PlusCircle },
  ]

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleNavClick = (href: string) => {
    router.push(href)
    setIsDropdownOpen(false)
  }

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
      `}</style>
      <header className="fixed w-full top-0 z-50 flex justify-center items-center">
        <div className="relative w-full flex items-center justify-between px-4 sm:px-6 py-4 mt-3 rounded-2xl mx-4 glass-shine">
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
          
          {/* Logo Section with left padding */}
          <div className="flex-1 pl-8 relative z-10">
            <Link href='/' className='flex items-center gap-3 group w-fit'>
              <span className="text-2xl md:text-3xl font-extrabold font-futuristic bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent tracking-widest drop-shadow-2xl group-hover:from-gray-50 group-hover:via-white group-hover:to-gray-200 transition-all duration-300">
                Raindrop
              </span>
            </Link>
          </div>

          {/* Right Side - Connect Button and Dropdown */}
          <div className="flex items-center gap-4 relative z-10">
            {/* Navigation Dropdown */}
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-futuristic font-medium transition-all duration-200 text-gray-200 hover:text-white hover:bg-white/20 hover:shadow-xl hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/20"
              >
                <Menu size={16} />
                <span className="hidden sm:inline">Menu</span>
                <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 overflow-visible z-[100] dropdown-enter">
                  {/* Glass Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/15 to-white/10 backdrop-blur-2xl rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 rounded-xl"></div>
                  <div className="absolute inset-0 border border-white/30 rounded-xl shadow-2xl"></div>
                  
                  {/* Top Highlight */}
                  <div className="absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full"></div>
                  
                  <div className="relative py-2">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleNavClick(item.href)}
                          className={`w-full text-left flex items-center gap-3 px-4 py-3 font-futuristic font-medium transition-all duration-200 group relative ${
                            isActive
                              ? 'text-gray-900 bg-white/40 shadow-lg backdrop-blur-sm border-l-2 border-white/60'
                              : 'text-gray-200 hover:text-white hover:bg-white/30 hover:shadow-lg'
                          }`}
                        >
                          <Icon size={16} className="transition-transform duration-200 group-hover:scale-110" />
                          <span className="group-hover:translate-x-1 transition-transform duration-200">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Connect Wallet Button */}
            <div className="relative">
              <ConnectButton />
            </div>
          </div>
        </div>

        {/* Backdrop to close dropdown when clicking outside */}
        {isDropdownOpen && (
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </header>
    </>
  )
}