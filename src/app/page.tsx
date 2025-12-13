"use client";

import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, PlusCircle } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

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
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-8">
        {/* Main Title */}
        <div className="space-y-4">
          <h1 className="font-futuristic text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff] drop-shadow-2xl">
            Raindrop
          </h1>
          <div className="relative mx-auto w-48 h-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#7ecbff] to-transparent rounded-full blur-sm opacity-60"></div>
          </div>
        </div>

        {/* Subtitle */}
        <p className="max-w-3xl text-lg md:text-xl lg:text-2xl text-gray-300 font-futuristic leading-relaxed px-4">
          Stake confidently in self-stabilising vaults where every withdrawal fuels those who stay. 
          <span className="block mt-2 text-emerald-400">Launch a vault, earn from fees, and watch your community grow.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
          <Button
            onClick={() => router.push('/explorer')}
            className="group relative px-8 py-4 bg-gradient-to-r from-[#3673F5] to-[#7ecbff] text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-[#7ecbff]/50 transition-all duration-300 transform hover:scale-105 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore Vaults <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </Button>
          
          <Button
            onClick={() => router.push('/createVault')}
            className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-400 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <PlusCircle size={20} /> Create Vault
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </Button>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-8 px-4 pb-20 max-w-5xl mx-auto">
        {/* Vaults Card */}
        <div className="group relative bg-gradient-to-br from-[#1A1F2B] to-[#141820] rounded-2xl p-8 flex flex-col min-h-[340px] overflow-hidden shadow-2xl border border-[#3673F5]/30 hover:border-[#3673F5]/60 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3673F5]/10 to-[#7ecbff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#3673F5]/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="flex flex-col items-center text-center gap-4 z-10">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#3673F5] to-[#7ecbff] shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="text-white" size={32} />
            </div>
            <h3 className="font-futuristic text-3xl text-transparent bg-clip-text bg-gradient-to-r from-white to-[#7ecbff] font-bold">
              My Vaults
            </h3>
            <p className="text-gray-300 font-futuristic text-base leading-relaxed">
              View and manage your existing vaults with ease. Track performance, manage stakes, and monitor your rewards in real-time.
            </p>
          </div>
          
          <Button
            onClick={() => router.push('/myVaults')}
            className="mt-auto w-full h-14 bg-gradient-to-r from-[#3673F5] to-[#7ecbff] hover:from-[#2563eb] hover:to-[#5ebdff] text-white font-bold text-base gap-2 shadow-lg hover:shadow-[#7ecbff]/30 z-10 transition-all duration-300 transform hover:scale-105"
          >
            View My Vaults <ArrowRight size={20} />
          </Button>
        </div>

        {/* Create Vault Card */}
        <div className="group relative bg-gradient-to-br from-[#1A1F2B] to-[#141820] rounded-2xl p-8 flex flex-col min-h-[340px] overflow-hidden shadow-2xl border border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="flex flex-col items-center text-center gap-4 z-10">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <PlusCircle className="text-white" size={32} />
            </div>
            <h3 className="font-futuristic text-3xl text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 font-bold">
              Create Vault
            </h3>
            <p className="text-gray-300 font-futuristic text-base leading-relaxed">
              Launch a new vault for your community and start distributing rewards. Set custom fees and build your ecosystem.
            </p>
          </div>
          
          <Button
            onClick={() => router.push('/createVault')}
            className="mt-auto w-full h-14 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-white font-bold text-base gap-2 shadow-lg hover:shadow-emerald-500/30 z-10 transition-all duration-300 transform hover:scale-105"
          >
            Create New Vault <PlusCircle size={20} />
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-24 space-y-12">
        <div className="text-center space-y-6">
          <h2 className="font-futuristic text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-400 to-[#7ecbff]">
            How It Works
          </h2>
          <div className="relative mx-auto w-32 h-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#7ecbff] to-transparent rounded-full blur-sm opacity-60"></div>
          </div>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Raindrop aligns incentives between vault creators and stakers using a simple but powerful fee mechanism.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {[
            {
              title: 'Create a Vault',
              description: 'Define token, fee and reward parameters, then deploy with one click.',
              gradient: 'from-blue-500 to-cyan-400',
              icon: '🎯'
            },
            {
              title: 'Stake & Earn',
              description: 'Users deposit tokens and receive vault shares that appreciate over time.',
              gradient: 'from-emerald-500 to-green-400',
              icon: '💰'
            },
            {
              title: 'Withdrawal Fees',
              description: 'Early exits pay a fee that is distributed between the vault creator and loyal stakers.',
              gradient: 'from-purple-500 to-pink-400',
              icon: '🔒'
            },
            {
              title: 'Distribute Rewards',
              description: 'Anyone can top-up the vault, boosting yields for all current stakeholders.',
              gradient: 'from-orange-500 to-red-400',
              icon: '🎁'
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="group relative bg-gradient-to-br from-[#1A1F2B] to-[#141820] rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{item.icon}</span>
                  <h3 className="font-semibold text-xl text-white">{item.title}</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
} 