const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    esmExternals: 'loose'
  },
  basePath: process.env.NODE_ENV === 'production' ? '/RainDrop-Frontend' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/RainDrop-Frontend/' : '',
};

export default nextConfig;
