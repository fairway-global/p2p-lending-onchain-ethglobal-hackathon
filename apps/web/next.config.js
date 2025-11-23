const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Warning: This allows production builds to successfully complete even if
        // your project has type errors.
        ignoreBuildErrors: false,
    },
    // Optimize build performance
    swcMinify: true,
    webpack: (config, { isServer, dev }) => {
        // Optimize build performance
        if (!dev) {
            config.optimization = {
                ...config.optimization,
                moduleIds: 'deterministic',
            };
        }
        config.externals.push('pino-pretty', 'lokijs', 'encoding')

        // Ignore React Native modules that are imported by @metamask/sdk
        if (!isServer) {
            // Use alias to point to our stub module
            config.resolve.alias = {
                ...config.resolve.alias,
                '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/lib/stubs/async-storage.js'),
            };
            
            // Suppress warnings for React Native modules
            config.resolve.fallback = {
                ...config.resolve.fallback,
                '@react-native-async-storage/async-storage': false,
            };
        }

        return config
    },
};

module.exports = nextConfig;