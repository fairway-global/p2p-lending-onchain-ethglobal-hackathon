const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
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