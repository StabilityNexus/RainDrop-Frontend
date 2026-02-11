'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Droplets, Sparkles, Target, PlusCircle, Home, Menu, ChevronDown, Star } from 'lucide-react'

/**
 * Header component with navigation menu and wallet connection
 * 
 * @component
 * @returns {JSX.Element} The application header with responsive navigation
 * 
 * @description
 * Features:
 * - Responsive design with mobile dropdown menu
 * - Active route highlighting
 * - Glass morphism design with shimmer effects
 * - Wallet connection integration via RainbowKit
 * - Accessible keyboard navigation
 * - Auto-close dropdown on route change and Escape key
 * 
 * Navigation items:
 * - Home (/)
 * - Explorer (/explorer)
 * - Favorites (/favorites)
 * - My Vaults (/myVaults)
 * - Create Vault (/createVault)
 * 
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);

  /** 
   * Navigation menu items configuration
   * @type {Array<{name: string, href: string, icon: React.ComponentType}>}
   */
  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Explorer', href: '/explorer', icon: Target },
    { name: 'Favorites', href: '/favorites', icon: Star },
    { name: 'My Vaults', href: '/myVaults', icon: Sparkles },
    { name: 'Create Vault', href: '/createVault', icon: PlusCircle },
  ];

  /**
   * Checks if the current route matches the provided href
   * @param {string} href - The route path to check
   * @returns {boolean} True if the current pathname matches the href
   */
  const isActive = (href: string) => pathname === href;

  /**
   * Auto-close dropdown when route changes
   * @effect Closes dropdown menu whenever pathname changes
   */
  useEffect(() => {
    setShowDropdown(false);
  }, [pathname]);

  /**
   * Handle Escape key to close dropdown
   * @effect Adds and removes keydown event listener for Escape key
   */
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [showDropdown]);

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
              <span className="text-2xl md:text-3xl font-extrabold font-futuristic bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff] bg-clip-text text-transparent tracking-widest drop-shadow-2xl group-hover:from-gray-50 group-hover:via-white group-hover:to-gray-200 transition-all duration-300">
                Raindrop
              </span>
            </Link>
          </div>

          {/* Center - Navigation Menu */}
          <div className="hidden lg:flex items-center gap-2 relative z-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white/20 text-white border border-white/30 shadow-lg'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Mobile Menu + Connect Button */}
          <div className="flex items-center gap-4 relative z-10">
            {/* Mobile Dropdown Menu */}
            <div className="lg:hidden relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowDropdown(!showDropdown);
                  }
                }}
                aria-haspopup="menu"
                aria-expanded={showDropdown}
                aria-controls="mobile-nav-menu"
                aria-label="Toggle navigation menu"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium transition-all duration-200"
              >
                <Menu size={20} />
                <ChevronDown size={16} className={`transform transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div 
                  id="mobile-nav-menu"
                  role="menu"
                  aria-hidden={!showDropdown}
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden dropdown-enter"
                >
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors ${
                          active ? 'bg-white/15 text-white' : 'text-gray-300'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Connect Wallet Button */}
            <div className="relative">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}