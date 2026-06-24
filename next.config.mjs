/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Bundle the locked SKILL.md spec with the serverless function so the
  // /api/generate route can fs.read it at runtime on Vercel (Next 14.2).
  experimental: {
    outputFileTracingIncludes: {
      "/api/generate": ["./skills/meepo-head-sticker/SKILL.md"],
      "/api/generate-v2": ["./public/refs/bgn-head-ref.png"],
    },
  },
};

export default nextConfig;
