'use client'
import React from 'react'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="fixed w-full top-0 z-30 flex justify-center items-center">
      <div className="relative w-full max-w-8xl mx-auto flex items-center justify-between px-6 py-3 mt-2 rounded-2xl shadow-xl border border-transparent bg-clip-padding backdrop-blur-md bg-[#232c3bcc]">
        {/* Animated Gradient Border/Glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#3673F5]/40 via-emerald-500/40 to-[#7ecbff]/40 blur-lg opacity-70 pointer-events-none animate-gradient-x"></div>
        {/* Logo and Title */}
        <Link href='/' className='flex items-center gap-3 z-10'>
          {/* Optionally add an icon here */}
          <span className="text-2xl md:text-3xl font-extrabold font-futuristic bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff] bg-clip-text text-transparent tracking-widest drop-shadow-lg">
            Raindrop
          </span>
        </Link>
        {/* Connect Wallet Button */}
        <div className="z-10">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}