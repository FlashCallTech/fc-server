/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: false,

    images: {
        remotePatterns: [
            {
                hostname: 'img.clerk.com'
            },
            {
                hostname: 'www.akamai.com'
            },
            {
                hostname: 'images.unsplash.com'
            },
            {
                hostname: 'drive.google.com'
            },
            {
                protocol: 'https',
                hostname: '**', // Allow any hostname
            },
        ],
    },
};

export default nextConfig;
