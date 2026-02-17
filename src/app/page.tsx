"use client";

import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, PlusCircle } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import StarBorder from '@/components/ui/StarBorder';

export default function HomePage() {
  const router = useRouter();

  // Generate positions for the falling drops just once per render
  const drops = React.useMemo(() => {
    // 4 green on left side (0-49%), 4 blue on right side (50-99%)
    return [
      ...[...Array(4)].map(() => ({
        leftPercent: Math.random() * 49,
        color: 'green',
      })),
      ...[...Array(4)].map(() => ({
        leftPercent: 50 + Math.random() * 49,
        color: 'blue',
      })),
    ];
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0D0F14]">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#131822] via-[#0D0F14] to-[#0B0D12] opacity-90" />

      {/* Decorative blurred circles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#3673F5]/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-emerald-500/20 blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/3 w-44 h-44 rounded-full bg-[#7ecbff]/15 blur-2xl animate-pulse animation-delay-4000" />
      </div>

      {/* Rain animation overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {drops.map((drop, i) => {
          const left = `${drop.leftPercent}%`;
          const delay = `${Math.random() * 3}s`;
          const duration = `${3 + Math.random() * 2}s`;
          const dropClass =
            drop.color === 'green'
              ? 'bg-gradient-to-b from-green-400 to-emerald-500'
              : 'bg-gradient-to-b from-[#7ecbff] to-[#3673F5]';
          return (
            <div
              key={i}
              className="absolute top-0 animate-rain"
              style={{ left, animationDelay: delay, animationDuration: duration }}
            >
              <div className={`w-[2px] h-8 ${dropClass} rounded-full shadow-lg opacity-90`} />
            </div>
          );
        })}
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-6">
        <h1 className="font-futuristic text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff] animate-fade-in">
          Raindrop
        </h1>
        <p className="max-w-2xl text-lg md:text-xl text-blue-300 font-futuristic leading-relaxed animate-slide-in">
          Stake confidently in self-stabilising vaults where every withdrawal fuels those who stay. Launch a vault, earn from fees, and watch your community grow.
        </p>
      </section>

      {/* Feature Cards */}
      <section className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 pb-32 max-w-4xl mx-auto">
        {/* Vaults Card */}
        <StarBorder
          as="div"
          className="w-full h-full"
          color="#7ecbff"
          speed="10s"
          thickness={2}
        >
          <div className="group relative p-8 flex flex-col h-[320px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3673F5]/20 to-[#7ecbff]/20 opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="flex items-center justify-center gap-3 mb-4 z-10">
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#3673F5] to-[#7ecbff]">
                <Sparkles className="text-white" size={24} />
              </div>
              <h3 className="font-futuristic text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-[#7ecbff] font-bold">Vaults</h3>
            </div>
            <p className="text-blue-300 font-futuristic mb-6 text-center z-10">
              View and manage your existing vaults with ease.
            </p>
            <Button
              onClick={() => router.push('/myVaults')}
              className="mt-auto w-full h-12 bg-gradient-to-r from-[#3673F5] to-[#7ecbff] text-white font-bold gap-2 shadow-neon z-10"
            >
              View My Vaults <ArrowRight size={20} />
            </Button>
          </div>
        </StarBorder>

        {/* Create Vault Card */}
        <StarBorder
          as="div"
          className="w-full h-full"
          color="#10b981"
          speed="10s"
          thickness={2}
        >
          <div className="group relative p-8 flex flex-col h-[320px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-400/20 opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="flex items-center justify-center gap-3 mb-4 z-10">
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400">
                <PlusCircle className="text-white" size={24} />
              </div>
              <h3 className="font-futuristic text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 font-bold">Create Vault</h3>
            </div>
            <p className="text-emerald-300 font-futuristic mb-6 text-center z-10">
              Launch a new vault for your community and start distributing rewards.
            </p>
            <Button
              onClick={() => router.push('/createVault')}
              className="mt-auto w-full h-12 bg-gradient-to-r from-emerald-500 to-green-400 text-white font-bold gap-2 shadow-neon z-10"
            >
              Create New Vault <PlusCircle size={20} />
            </Button>
          </div>
        </StarBorder>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-32 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="font-futuristic text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff]">
            How It Works
          </h2>
          <p className="text-blue-300 max-w-2xl mx-auto">
            Raindrop aligns incentives between vault creators and stakers using a simple but powerful fee mechanism.
          </p>
        </div>
        <ul className="grid md:grid-cols-2 gap-8">
          <li className="space-y-3">
            <h3 className="font-semibold text-white">Create a Vault</h3>
            <p className="text-blue-300 text-sm">Define token, fee and reward parameters, then deploy with one click.</p>
          </li>
          <li className="space-y-3">
            <h3 className="font-semibold text-white">Stake &amp; Earn</h3>
            <p className="text-blue-300 text-sm">Users deposit tokens and receive vault shares that appreciate over time.</p>
          </li>
          <li className="space-y-3">
            <h3 className="font-semibold text-white">Withdrawal Fees</h3>
            <p className="text-blue-300 text-sm">Early exits pay a fee that is distributed between the vault creator and loyal stakers.</p>
          </li>
          <li className="space-y-3">
            <h3 className="font-semibold text-white">Distribute Rewards</h3>
            <p className="text-blue-300 text-sm">Anyone can top-up the vault, boosting yields for all current stakeholders.</p>
          </li>
        </ul>
      </section>
    </main>
  );
} 