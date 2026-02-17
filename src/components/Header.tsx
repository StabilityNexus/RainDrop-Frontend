'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/explorer', label: 'Explorer' },
  { href: '/createVault', label: 'Create' },
  { href: '/myVaults', label: 'My Vaults' },
]

export function Header() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 16 })
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef && mobileMenuOpen) {
        const rect = buttonRef.getBoundingClientRect()
        setMenuPosition({
          top: rect.bottom + 8,
          right: 16
        })
      }
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, { passive: true })
    return () => window.removeEventListener('scroll', updatePosition)
  }, [buttonRef, mobileMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef && !buttonRef.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [mobileMenuOpen, buttonRef])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > 100) {
        setIsScrolled(true)
      } else if (currentScrollY < 50) {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <motion.header
      className="fixed z-50 w-full px-2 pointer-events-auto"
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Desktop Navigation */}
      <motion.div
        className={cn(
          'hidden md:block mx-auto mt-2 px-6 lg:px-12',
          isScrolled && 'backdrop-blur-[60px]'
        )}
        style={{
          backdropFilter: isScrolled ? 'blur(60px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(60px) saturate(180%)' : 'none',
        }}
        animate={{
          maxWidth: isScrolled ? '64rem' : '90rem',
          backgroundColor: isScrolled 
            ? (isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)')
            : 'rgba(0, 0, 0, 0)',
          borderRadius: isScrolled ? '16px' : '0px',
          border: isScrolled 
            ? (isDark ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)')
            : '1px solid rgba(255, 255, 255, 0)',
          boxShadow: isScrolled 
            ? (isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0 8px 32px 0 rgba(0, 0, 0, 0.1)')
            : 'none',
          paddingLeft: isScrolled ? '20px' : '48px',
          paddingRight: isScrolled ? '20px' : '48px',
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 30, duration: 0.8 }}
      >
        <motion.div
          className="relative flex items-center justify-between py-3 lg:py-4"
          animate={{
            paddingTop: isScrolled ? '12px' : '16px',
            paddingBottom: isScrolled ? '12px' : '16px',
          }}
          transition={{ type: 'spring', stiffness: 150, damping: 30, duration: 0.8 }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group z-[1002] flex-shrink-0">
            <motion.span 
              className="font-bold text-xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-cyan-300 transition-colors"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              Raindrop
            </motion.span>
          </Link>

          {/* Centered Navigation */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <AnimatePresence>
              {!isScrolled && (
                <motion.nav
                  key="centered-nav"
                  initial={{ opacity: 0, scale: 0.97, y: -2 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.6 }}
                  className="flex items-center gap-6"
                >
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <motion.span
                        className={cn(
                          'text-sm font-medium transition-colors px-3 py-2 rounded-lg',
                          pathname === item.href 
                            ? 'text-emerald-400 bg-emerald-400/10' 
                            : 'text-foreground/70 hover:text-emerald-400 hover:bg-emerald-400/5'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {item.label}
                      </motion.span>
                    </Link>
                  ))}
                </motion.nav>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2 z-[1001] flex-shrink-0">
            <AnimatePresence>
              {isScrolled && (
                <motion.div
                  key="dropdown-nav"
                  initial={{ opacity: 0, x: 15, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 15, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.6 }}
                >
                  <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-emerald-400 transition-colors rounded-md hover:bg-emerald-400/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onMouseEnter={() => setIsDropdownOpen(true)}
                        onMouseLeave={() => setIsDropdownOpen(false)}
                      >
                        <span>Quick Links</span>
                        <ChevronDown className="h-4 w-4" />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="min-w-[150px] bg-background/95 backdrop-blur-xl border border-foreground/10 rounded-lg p-1 z-50"
                      onMouseEnter={() => setIsDropdownOpen(true)}
                      onMouseLeave={() => setIsDropdownOpen(false)}
                    >
                      {navItems.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              'block px-3 py-2 text-sm rounded-md cursor-pointer transition-colors',
                              pathname === item.href 
                                ? 'bg-emerald-400/20 text-emerald-400' 
                                : 'text-foreground/70 hover:text-emerald-400 hover:bg-emerald-400/10'
                            )}
                          >
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex items-center gap-1">
              <ConnectButton.Custom>
                {({ account, chain, openConnectModal, openAccountModal, mounted: btnMounted }) => {
                  const connected = btnMounted && account && chain
                  return (
                    <motion.button
                      onClick={connected ? openAccountModal : openConnectModal}
                      className="px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/25"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      {connected ? `${account.displayName}` : 'Connect Wallet'}
                    </motion.button>
                  )
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Mobile Navigation */}
      <motion.div
        className={cn(
          'md:hidden mx-auto mt-2 max-w-full px-4 relative',
          isScrolled && 'backdrop-blur-[60px]'
        )}
        style={{
          backdropFilter: isScrolled ? 'blur(60px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(60px) saturate(180%)' : 'none',
        }}
        animate={{
          backgroundColor: isScrolled 
            ? (isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)')
            : 'rgba(0, 0, 0, 0)',
          borderRadius: isScrolled ? '16px' : '0px',
          border: isScrolled 
            ? (isDark ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)')
            : '1px solid rgba(255, 255, 255, 0)',
          boxShadow: isScrolled 
            ? (isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0 8px 32px 0 rgba(0, 0, 0, 0.1)')
            : 'none',
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 30, duration: 0.8 }}
      >
        <div className="flex items-center justify-between py-3 relative z-50">
          <Link href="/" className="flex items-center gap-2 group z-[1002]">
            <motion.span 
              className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              Raindrop
            </motion.span>
          </Link>

          <div className="flex items-center gap-2 z-[1001]">
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, openAccountModal, mounted: btnMounted }) => {
                const connected = btnMounted && account && chain
                return (
                  <motion.button
                    onClick={connected ? openAccountModal : openConnectModal}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 transition-opacity"
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    {connected ? `${account.displayName}` : 'Connect'}
                  </motion.button>
                )
              }}
            </ConnectButton.Custom>

            <motion.button
              ref={setButtonRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5"
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <motion.div
                animate={{
                  rotate: mobileMenuOpen ? 180 : 0,
                  scale: mobileMenuOpen ? 0 : 1,
                  opacity: mobileMenuOpen ? 0 : 1
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="m-auto size-6 text-foreground"
              >
                <Menu className="size-6" />
              </motion.div>
              <motion.div
                animate={{
                  rotate: mobileMenuOpen ? 0 : -180,
                  scale: mobileMenuOpen ? 1 : 0,
                  opacity: mobileMenuOpen ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 m-auto size-6 text-foreground"
              >
                <X className="size-6" />
              </motion.div>
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && buttonRef && (
            <motion.div
              className="fixed z-50 w-48 bg-background/95 backdrop-blur-xl border border-emerald-400/20 rounded-lg md:hidden overflow-hidden pointer-events-auto"
              style={{
                top: menuPosition.top + 'px',
                right: menuPosition.right + 'px'
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ul className="flex flex-col gap-0 px-0 py-2">
                {navItems.map((item) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block px-4 py-2 text-sm font-medium transition-colors',
                        pathname === item.href 
                          ? 'text-emerald-400 bg-emerald-400/20' 
                          : 'text-foreground/70 hover:text-emerald-400 hover:bg-emerald-400/10'
                      )}
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </AnimatePresence>
    </motion.header>
  )
}