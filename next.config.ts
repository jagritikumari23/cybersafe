
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: [
    '@opentelemetry/sdk-node',
    '@opentelemetry/exporter-jaeger',
    'genkit',
    '@genkit-ai/core',
    '@genkit-ai/ai',
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        { '@opentelemetry/exporter-jaeger': 'commonjs @opentelemetry/exporter-jaeger' },
      ];
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.mos.cms.futurecdn.net',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
