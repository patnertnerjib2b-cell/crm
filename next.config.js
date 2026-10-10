/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pustimo privzete nastavitve, da je projekt brez sprememb pripravljen
  // na objavo v oblak (npr. Vercel) - glej README.md za navodila.
  eslint: {
    // ESLint ni vključen med odvisnostmi (projekt je namenoma minimalen),
    // zato med `next build` preskočimo lint korak.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
