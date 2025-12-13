<!-- Don't delete it -->

<div name="readme-top"></div>



<!-- Organization Logo -->

<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 16px;">

  <img alt="Stability Nexus" src="public/stability.svg" width="175">

  <img src="public/logo.png" width="175" />

</div>



&nbsp;



<!-- Organization Name -->

<div align="center">



[![Static Badge](https://img.shields.io/badge/Stability_Nexus-/Raindrop-228B22?style=for-the-badge&labelColor=FFC517)](https://raindrop.stability.nexus/)



<!-- Correct deployed url to be added -->



</div>



<!-- Organization/Project Social Handles -->

<p align="center">
<!-- Telegram -->
<a href="https://t.me/StabilityNexus">
<img src="https://img.shields.io/badge/Telegram-black?style=flat&logo=telegram&logoColor=white&logoSize=auto&color=24A1DE" alt="Telegram Badge"/></a>
&nbsp;&nbsp;
<!-- X (formerly Twitter) -->
<a href="https://x.com/StabilityNexus">
<img src="https://img.shields.io/twitter/follow/StabilityNexus" alt="X (formerly Twitter) Badge"/></a>
&nbsp;&nbsp;
<!-- Discord -->
<a href="https://discord.gg/YzDKeEfWtS">
<img src="https://img.shields.io/discord/995968619034984528?style=flat&logo=discord&logoColor=white&logoSize=auto&label=Discord&labelColor=5865F2&color=57F287" alt="Discord Badge"/></a>
&nbsp;&nbsp;
<!-- Medium -->
<a href="https://news.stability.nexus/">
  <img src="https://img.shields.io/badge/Medium-black?style=flat&logo=medium&logoColor=black&logoSize=auto&color=white" alt="Medium Badge"></a>
&nbsp;&nbsp;
<!-- LinkedIn -->
<a href="https://linkedin.com/company/stability-nexus">
  <img src="https://img.shields.io/badge/LinkedIn-black?style=flat&logo=LinkedIn&logoColor=white&logoSize=auto&color=0A66C2" alt="LinkedIn Badge"></a>
&nbsp;&nbsp;
<!-- Youtube -->
<a href="https://www.youtube.com/@StabilityNexus">
  <img src="https://img.shields.io/youtube/channel/subscribers/UCZOG4YhFQdlGaLugr_e5BKw?style=flat&logo=youtube&logoColor=white&logoSize=auto&labelColor=FF0000&color=FF0000" alt="Youtube Badge"></a>
</p>



---



<div align="center">

<h1>Raindrop</h1>

</div>



[Raindrop](https://raindrop.stability.nexus/) is a map of “self-stabilising” staking vaults. Creators deploy vaults that accept an ERC20 staking token; early exits pay a fee that is routed to vault creators and loyal stakers. The dApp lets you launch vaults, explore all vaults, favorite them with IndexedDB caching, and manage token “drops” to reward stakers—powered by the Raindrop Factory on Scroll Sepolia.



---



## Tech Stack



### Frontend



- Next.js 14 (App Router)
- TypeScript
- TailwindCSS + tailwind-merge + tailwindcss-animate
- shadcn/ui (Radix UI primitives, toast, tooltip, dialogs)
- RainbowKit + wagmi + viem + @reown/appkit for wallet connectivity
- Framer Motion and Lottie for motion/UX polish
- IndexedDB caching for vault lists and favorites

### Blockchain



- Interacts with the Raindrop Factory and Raindrop vault ERC20 contracts
- Scroll Sepolia (Chain ID 534351) factory at `0xb7564ba25889043bdd0ee8a1a3adcaf2e23e3e09`
- Supports additional chains in config (Base Sepolia, Polygon, Mainnet) for future deployments



---



## Getting Started



### Prerequisites



- Node.js 18+
- npm/yarn/pnpm
- MetaMask or another web3 wallet
- WalletConnect project ID for RainbowKit (`NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`)
- Scroll Sepolia RPC access and test funds to interact with the factory

### Installation



> The Next.js app lives at the repo root.

#### 1. Clone the Repository



```bash
git clone https://github.com/StabilityNexus/Raindrop-Frontend.git
cd Raindrop-Frontend
```



#### 2. Install Dependencies



Using your preferred package manager:



```bash
npm install
# or
yarn install
# or
pnpm install
```



#### 3. Configure Environment Variables



Create `.env.local` and set your WalletConnect project ID:

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
```



#### 4. Run the Development Server



Start the app locally:



```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```



#### 5. Open your Browser



Navigate to [http://localhost:3000](http://localhost:3000) to use Raindrop. Use Explorer to browse vaults, Create to launch new vaults, My Vaults to manage your deployments, and vault detail pages to stake/unstake and manage token drops.



---



## Contributing



We welcome contributions of all kinds! To contribute:

1. Fork the repository and create your feature branch (`git checkout -b feature/AmazingFeature`).
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
3. Run the development workflow commands to ensure code quality:
   - `npm run lint`
   - `npm run build`
4. Push your branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request for review.

If you encounter bugs, need help, or have feature requests:

- Please open an issue in this repository providing detailed information.
- Describe the problem clearly and include any relevant logs or screenshots.



We appreciate your feedback and contributions!



© 2025 The Stable Order. 
