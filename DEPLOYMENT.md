# Obraims MVP — Deployment Guide

## Prerequisites
- Node.js >= 20
- PostgreSQL database (local or hosted)
- Supabase project (for authentication + storage)

---

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Edit `.env.local` and fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — your Supabase anon/publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key
- `OBRAIMS_ADMIN_EMAILS` — comma-separated admin email addresses

### 3. Run database migrations
```bash
# Prisma schema (PostgreSQL via Prisma)
npx prisma migrate dev

# Optional: seed demo data
npm run prisma:seed
```

### 4. Run Supabase migrations (if using Supabase storage)
```bash
supabase db push
```

### 5. Start development server
```bash
npm run dev
```
Open http://localhost:3000

---

## Production Deployment

### Option A — Vercel (Recommended)

1. Push your code to GitHub/GitLab.
2. Import the repo in [vercel.com](https://vercel.com).
3. Set all environment variables from `.env.production.example` in the Vercel dashboard.
4. Vercel auto-detects Next.js and deploys.
5. Run migrations post-deploy:
   ```bash
   npx prisma migrate deploy
   ```

### Option B — Netlify

1. Push to Git.
2. Connect repo in Netlify. Set build command: `npm run build`, publish dir: `.next`.
3. Add environment variables in Netlify dashboard.
4. Install [Netlify Next.js plugin](https://github.com/netlify/netlify-plugin-nextjs).

### Option C — AWS (EC2 / ECS)

```bash
# Build
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "obraims" -- start
pm2 save
```

Configure Nginx as a reverse proxy:
```nginx
server {
  listen 80;
  server_name your-domain.com;
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### Option D — Docker

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t obraims-mvp .
docker run -p 3000:3000 --env-file .env.production obraims-mvp
```

---

## Database Migrations

```bash
# Development
npm run prisma:migrate

# Production
npm run prisma:deploy

# Generate client after schema changes
npm run prisma:generate

# Seed database
npm run prisma:seed
```

---

## Security Checklist

- [ ] Set `OBRAIMS_ADMIN_EMAILS` to real admin emails only
- [ ] Set `NEXT_PUBLIC_ENABLE_DEMO_AUTH=false` in production
- [ ] Use strong, unique database passwords
- [ ] Enable SSL on database connection (`?sslmode=require`)
- [ ] Rotate Supabase service role key periodically
- [ ] Enable Supabase Row Level Security (RLS) policies
- [ ] Review and restrict Supabase storage bucket policies

---

## Routing Notes

This application uses **Next.js App Router** (file-system based routing) with `next-intl` for internationalization. Routes are prefixed with a locale segment (`/en/...`).

- Default locale: `en` (English)
- Supported locales: `en`
- The middleware in `middleware.ts` handles locale routing.
- **There is no React Router** (no BrowserRouter/HashRouter) — Next.js App Router handles all navigation natively.
- Deep linking and page refresh work out of the box on server deployments (Vercel, Netlify, AWS).

