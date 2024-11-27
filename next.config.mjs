import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';
import path from 'path';

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

    async headers() {
        return [
            {
                source: '/(.*).(js|css|svg|png|jpg|jpeg|woff|woff2|ttf)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=86400, must-revalidate',
                    },

                ],
            },
        ];
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
            include: [
                path.resolve(process.cwd(), 'public'),
                path.resolve(process.cwd(), 'public/icons'),
            ],
            use: [
                {
                    loader: '@svgr/webpack',
                    options: {
                        icons: true,
                        svgo: true,
                        svgoConfig: {
                            plugins: [
                                { removeViewBox: false },
                                { cleanupIDs: true },
                            ],
                        },
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
