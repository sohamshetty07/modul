import path from "path";
import CopyPlugin from "copy-webpack-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. WEBPACK BUILD FIX (Forces AI models to be copied to public/models on Vercel)
    webpack: (config) => {
        config.plugins.push(
            new CopyPlugin({
                patterns: [
                    {
                        from: "node_modules/@imgly/background-removal-data/dist",
                        to: path.join(process.cwd(), "public/models"),
                    },
                ],
            })
        );
        return config;
    },

    // 2. YOUR EXISTING HEADERS (Security & Caching)
    async headers() {
        return [
            {
                // Global Security Headers (Essential for FFmpeg & SharedArrayBuffer)
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                ],
            },
            {
                // Cache Control for heavy assets
                source: '/:path*(ffmpeg|transformers.min.js)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;