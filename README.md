# 💧 RainDrop Frontend

A decentralized token distribution platform built with Next.js, enabling seamless airdrops and token claims on blockchain networks. RainDrop provides an intuitive interface for both distributors and recipients to manage token distributions efficiently.

[![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ Features

- 🔗 **Multi-Wallet Support** - Connect with MetaMask, WalletConnect, and other popular wallets via RainbowKit
- 🎨 **Modern UI/UX** - Clean, responsive interface built with Radix UI components and Tailwind CSS
- 🌓 **Dark Mode** - Seamless theme switching with next-themes
- 🔐 **Secure Transactions** - Built on ethers.js and wagmi for secure blockchain interactions
- ⚡ **Fast & Optimized** - Leveraging Next.js 14 App Router and React 18 features
- 🎭 **Animations** - Smooth interactions powered by Framer Motion and Lottie
- 📱 **Responsive Design** - Works seamlessly across desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **npm** or **yarn** or **pnpm**
- A **crypto wallet** (e.g., MetaMask) for testing

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/StabilityNexus/RainDrop-Frontend.git
   cd RainDrop-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory (or use the existing `.env` file):
   ```bash
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
   ```
   
   > 💡 Get your WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
RainDrop-Frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utility libraries
│   ├── providers/        # Context providers (wagmi, theme, etc.)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── public/               # Static assets
├── .github/              # GitHub workflows (CI/CD)
├── next.config.mjs       # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## 🛠️ Tech Stack

### Core Framework
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[React 18](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

### Blockchain & Web3
- **[wagmi](https://wagmi.sh/)** - React Hooks for Ethereum
- **[viem](https://viem.sh/)** - TypeScript Interface for Ethereum
- **[ethers.js](https://docs.ethers.org/)** - Ethereum library
- **[RainbowKit](https://www.rainbowkit.com/)** - Wallet connection UI
- **[@reown/appkit](https://reown.com/)** - Web3 modal and wallet management

### UI & Styling
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[Lottie](https://airbnb.io/lottie/)** - Animation player
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme management
- **[Lucide React](https://lucide.dev/)** - Icon library

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[PostCSS](https://postcss.org/)** - CSS processing
- **[Autoprefixer](https://github.com/postcss/autoprefixer)** - CSS vendor prefixing

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server at http://localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint to check code quality
```

## 🌐 Deployment

### Vercel (Recommended)

The easiest way to deploy RainDrop is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository on Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/StabilityNexus/RainDrop-Frontend)

### Other Platforms

RainDrop can be deployed on any platform that supports Next.js:
- **Netlify** - [Deployment guide](https://docs.netlify.com/integrations/frameworks/next-js/)
- **AWS Amplify** - [Deployment guide](https://docs.amplify.aws/react/start/quickstart/)
- **Docker** - Build with `npm run build` and deploy the `.next` folder
- **GitHub Pages** - Configure with `gh-pages` package (already included)

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. **Fork the repository**
   
   Click the "Fork" button at the top right of this page.

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/RainDrop-Frontend.git
   cd RainDrop-Frontend
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes**
   
   - Write clean, maintainable code
   - Follow the existing code style
   - Add comments where necessary
   - Update documentation if needed

5. **Test your changes**
   ```bash
   npm run dev
   npm run lint
   npm run build
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

7. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

8. **Open a Pull Request**
   
   Go to the original repository and click "New Pull Request"

### Development Guidelines

- **Code Style**: Follow TypeScript and React best practices
- **Components**: Use functional components with hooks
- **Styling**: Use Tailwind CSS utility classes
- **Types**: Ensure all components are properly typed
- **Accessibility**: Maintain WCAG 2.1 AA compliance
- **Performance**: Optimize images and lazy load components where appropriate

### Reporting Issues

Found a bug or have a suggestion? Please [open an issue](https://github.com/StabilityNexus/RainDrop-Frontend/issues/new) with:
- Clear title and description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser, etc.)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) by Vercel
- UI components from [Radix UI](https://www.radix-ui.com/)
- Wallet integration by [RainbowKit](https://www.rainbowkit.com/)
- Icons by [Lucide](https://lucide.dev/)
- Animations by [Framer Motion](https://www.framer.com/motion/)

## 📞 Contact & Support

- **Website**: [https://stability.nexus](https://stability.nexus)
- **Issues**: [GitHub Issues](https://github.com/StabilityNexus/RainDrop-Frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/StabilityNexus/RainDrop-Frontend/discussions)

---

<p align="center">Made with 💧 by the Stability Nexus Team</p>