/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Memberikan izin mesin video FFmpeg berjalan di memori browser
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;