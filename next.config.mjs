import withPWA from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/(?:fonts\.(?:googleapis|gstatic)\.com|cdnjs\.cloudflare\.com)\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "external-static-libs",
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:wasm|onnx|js)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "local-wasm-core",
          expiration: { maxEntries: 10, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

const nextConfig = {
    async headers() {
        return [
            {
                // Global Security Headers (Essential for FFmpeg/WASM)
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
                // Cache Control for WASM/ONNX files
                source: '/:path*(.*\\.(?:wasm|onnx|js)|ffmpeg)',
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

export default pwaConfig(nextConfig);