/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable automatic compression of HTML/JSON responses (faster transfers, esp. on slow networks)
  compress: true,
  // Cache static assets aggressively
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      // Aggressive caching for static fonts, icons, and images
      {
        source: "/:path*\\.(css|js|woff|woff2|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  // Optimize image loading
  images: {
    formats: ["image/webp"],
  },
  // Reduce JavaScript bundle size in production
  swcMinify: true,
};
module.exports = nextConfig;
