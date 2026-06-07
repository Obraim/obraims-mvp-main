import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: This is a Next.js App Router application.
  // Next.js does not use React Router's BrowserRouter or HashRouter.
  // Routing is file-system based via the App Router.
  // For static hosting (Netlify/Vercel/S3), Next.js handles deep-link
  // stability natively. If deploying as a fully static export (output: 'export'),
  // the app will serve from hash-friendly paths via the file structure.
  // For server-side deployments (recommended), routes are resolved server-side.
  trailingSlash: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  }
};

export default withNextIntl(nextConfig);
