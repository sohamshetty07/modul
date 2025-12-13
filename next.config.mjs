/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                // 1. GLOBAL SECURITY HEADERS (Essential for FFmpeg & SharedArrayBuffer)
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
                // 2. CACHE CONTROL (For your heavy AI & Video engines)
                // This targets all files inside the /ffmpeg folder and your new transformers file
                source: '/:path*(ffmpeg|transformers.min.js)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable', // Cache for 1 Year
                    },
                ],
            },
        ];
    },
};

export default nextConfig;