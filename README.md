# 🌧️ RainDrop Frontend

A decentralized vault management system built on blockchain technology. RainDrop allows users to create, manage, and interact with secure vaults for storing and managing digital assets.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Smart Contract Integration](#smart-contract-integration)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

RainDrop Frontend is a modern Web3 application that provides a user-friendly interface for interacting with RainDrop smart contracts. Users can create vaults, explore available vaults, manage favorites, and perform various vault operations in a secure, decentralized manner.

## ✨ Features

- 🔐 **Wallet Integration**: Connect with multiple wallet providers using RainbowKit
- 🏦 **Vault Management**: Create and manage your own vaults
- 🔍 **Vault Explorer**: Browse and discover available vaults
- ⭐ **Favorites System**: Save and quick-access your favorite vaults
- 🌐 **Multi-Chain Support**: Works on Scroll Sepolia, Base Sepolia, Polygon, and Ethereum Mainnet
- 🎨 **Modern UI**: Beautiful, responsive design with dark theme support
- 💾 **Local Storage**: IndexedDB integration for offline data persistence
- ⚡ **Real-time Updates**: Live blockchain data synchronization

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Web3 Integration**: 
  - [Wagmi](https://wagmi.sh/)
  - [RainbowKit](https://www.rainbowkit.com/)
  - [Viem](https://viem.sh/)
  - [Ethers.js](https://docs.ethers.org/)
- **UI Components**: 
  - [Radix UI](https://www.radix-ui.com/)
  - [Lucide Icons](https://lucide.dev/)
  - [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [TanStack Query](https://tanstack.com/query/)

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** or **pnpm**
- A Web3 wallet (e.g., MetaMask, Rainbow Wallet, Coinbase Wallet)

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd RainDrop-Frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

## ⚙️ Configuration

1. **Create a `.env.local` file** in the root directory:
   ```env
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
   ```

2. **Get a WalletConnect Project ID**:
   - Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy your Project ID and paste it in `.env.local`

3. **Configure Smart Contract Addresses** (if needed):
   - Update contract addresses in `src/utils/contractAddress.ts`
   - Update ABIs in `src/utils/contractABI/` if contracts have changed

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
# or
yarn build
yarn start
# or
pnpm build
pnpm start
```

### Linting

```bash
npm run lint
# or
yarn lint
# or
pnpm lint
```

## 📁 Project Structure

```
RainDrop-Frontend/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── [vault]/           # Dynamic vault page
│   │   ├── createVault/       # Vault creation page
│   │   ├── explorer/          # Vault explorer page
│   │   ├── favorites/         # Favorites page
│   │   ├── myVaults/          # User's vaults page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable React components
│   │   ├── ui/                # UI component library
│   │   ├── ChainSelector.tsx  # Chain selection component
│   │   ├── Footer.tsx         # Footer component
│   │   ├── Header.tsx         # Header component
│   │   └── VaultCard.tsx      # Vault display card
│   ├── lib/                   # Utility libraries
│   │   └── utils.ts           # Helper functions
│   ├── providers/             # React context providers
│   │   ├── ThemeProvider.tsx  # Theme management
│   │   ├── WalletProvider.tsx # Wallet connection
│   │   └── web3-provider.js   # Web3 configuration
│   ├── types/                 # TypeScript type definitions
│   │   └── jsx.d.ts          # JSX type declarations
│   └── utils/                 # Utility functions
│       ├── config.ts          # App configuration
│       ├── contractAddress.ts # Contract addresses
│       ├── indexedDB.ts       # IndexedDB utilities
│       ├── props.ts           # Prop type definitions
│       └── contractABI/       # Smart contract ABIs
├── public/                    # Static assets
├── eslint.config.mjs         # ESLint configuration
├── next.config.mjs           # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project dependencies
```

## 📖 Usage

### Connecting Your Wallet

1. Click the "Connect Wallet" button in the header
2. Select your preferred wallet provider
3. Approve the connection request in your wallet

### Creating a Vault

1. Navigate to the "Create Vault" page
2. Fill in the required vault details
3. Confirm the transaction in your wallet
4. Wait for the transaction to be confirmed

### Exploring Vaults

1. Visit the "Explorer" page to browse all available vaults
2. Use filters and search to find specific vaults
3. Click on a vault card to view detailed information

### Managing Favorites

1. Click the star icon on any vault card to add it to favorites
2. Access your favorites from the "Favorites" page
3. Click the star again to remove from favorites

### Interacting with Vaults

1. Navigate to a specific vault page
2. View vault details, balance, and transaction history
3. Perform vault operations (deposit, withdraw, etc.)
4. All transactions require wallet confirmation

## 🔗 Smart Contract Integration

RainDrop Frontend interacts with three main smart contracts:

- **RaindropFactory**: Creates and manages vault instances
- **Raindrop**: Individual vault contract
- **ERC20**: Standard token interface for asset management

Contract ABIs are located in `src/utils/contractABI/`.

### Supported Networks

- Scroll Sepolia (Testnet)
- Base Sepolia (Testnet)
- Polygon (Mainnet)
- Ethereum Mainnet

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and commit:
   ```bash
   git commit -m "Add: your feature description"
   ```
4. **Push to your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**

### Coding Standards

- Follow the existing code style
- Use TypeScript for type safety
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes before submitting

### Reporting Issues

If you find a bug or have a feature request, please open an issue on the repository with:
- Clear description of the problem/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)

## 📄 License

This project is part of the Unstoppable Hackathon submission.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Wallet integration powered by [RainbowKit](https://www.rainbowkit.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Made with ❤️ for the Unstoppable Hackathon**