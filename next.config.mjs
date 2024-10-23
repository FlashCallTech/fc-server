import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,

    images: {
        remotePatterns: [
            {
                hostname: 'img.clerk.com',
            },
            {
                hostname: 'www.akamai.com',
            },
            {
                hostname: 'images.unsplash.com',
            },
            {
                hostname: 'drive.google.com',
            },
            {
                hostname: 'localhost',
                port: '5000',
                protocol: 'http',
            },
            {
                protocol: 'https',
                hostname: '**', // Allow any hostname
            },
        ],
    },

    webpack(config, options) {
        const fileLoaderRule = config.module.rules.find((rule) =>
            rule.test?.test?.('.svg')
        );

        if (fileLoaderRule) {
            fileLoaderRule.exclude = /\.svg$/;
        }

        config.module.rules.push({
            test: /\.svg$/,
            use: [
                {
                    loader: '@svgr/webpack',
                    options: {
                        icon: true,
                    },
                },
            ],
        });

        return config;
    },
};

// Sentry configuration
const sentryConfig = {
    org: "flashcallme",
    project: "javascript-nextjs",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    reactComponentAnnotation: {
        enabled: true,
    },
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
};

// Bundle Analyzer configuration
const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
});

// Combine both configurations (Sentry + Bundle Analyzer)
const combinedConfig = withBundleAnalyzer(withSentryConfig(nextConfig, sentryConfig));

export default combinedConfig;
