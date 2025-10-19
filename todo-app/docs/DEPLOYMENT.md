# Deployment Guide

This document outlines how to build and deploy the Daily Todo application to various hosting platforms.

## Production Build

### Building for Production

```bash
# Standard build (with TypeScript type checking)
npm run build

# Production build (skip type checking, faster)
npm run build:production

# Preview production build locally
npm run preview
```

### Build Output

The production build creates optimized files in the `dist/` directory:

```
dist/
├── index.html                          # Main HTML file
├── favicon.svg                         # App icon
├── manifest.webmanifest                # PWA manifest
└── assets/
    ├── index-[hash].css                # Main CSS bundle (~20KB)
    ├── index-[hash].js                 # Main JS bundle (~46KB)
    ├── react-vendor-[hash].js          # React libraries (~140KB)
    ├── ui-vendor-[hash].js             # UI components (~50KB)
    ├── utils-vendor-[hash].js          # Utilities (~78KB)
    ├── DeleteConfirmDialog-[hash].js   # Lazy-loaded dialog (~2KB)
    └── EditTaskDialog-[hash].js        # Lazy-loaded dialog (~2KB)
```

**Total Bundle Size**:
- **Raw**: ~338 KB
- **Gzipped**: ~100 KB (faster loading)
- **Initial Load**: ~160 KB gzipped (dialogs load on demand)

### Build Optimizations

The production build includes:

✅ **Code Splitting**:
- React vendor chunk (React, React-DOM)
- UI vendor chunk (Headless UI, Heroicons)
- Utils vendor chunk (date-fns, Zustand, Zod)
- Lazy-loaded dialog components

✅ **Minification**:
- Terser minification with console.log removal
- CSS minification and purging (Tailwind)
- Dead code elimination (tree-shaking)

✅ **Performance**:
- Gzip compression
- ES2020 target (modern browsers)
- Efficient chunk splitting for caching
- Source maps disabled (faster builds)

---

## Hosting Platforms

### Vercel (Recommended)

**Why Vercel?**:
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Edge network (global CDN)
- ✅ Automatic preview deployments
- ✅ Custom domains
- ✅ Built-in analytics (optional)

**Deployment Steps**:

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via CLI**:
   ```bash
   # First time deployment
   vercel

   # Production deployment
   vercel --prod
   ```

3. **Deploy via GitHub** (recommended):
   - Push code to GitHub
   - Visit https://vercel.com/new
   - Import your GitHub repository
   - Configure settings:
     - **Framework Preset**: Vite
     - **Root Directory**: `./` (or subdirectory if needed)
     - **Build Command**: `npm run build:production`
     - **Output Directory**: `dist`
   - Click "Deploy"

**Environment Variables**: None required (local-only app)

---

### Netlify

**Why Netlify?**:
- ✅ Simple drag-and-drop deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Continuous deployment from Git
- ✅ Form handling (future features)

**Deployment Steps**:

1. **Build locally**:
   ```bash
   npm run build:production
   ```

2. **Deploy via Netlify CLI**:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login
   netlify login

   # Deploy
   netlify deploy --prod
   ```

3. **Deploy via Web UI**:
   - Visit https://app.netlify.com/
   - Drag and drop the `dist` folder
   - Or connect to GitHub repository

**netlify.toml Configuration**:
```toml
[build]
  command = "npm run build:production"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

### GitHub Pages

**Why GitHub Pages?**:
- ✅ Free hosting for public repos
- ✅ Simple setup
- ✅ Automatic HTTPS
- ✅ Custom domains supported

**Deployment Steps**:

1. **Install gh-pages**:
   ```bash
   npm install -D gh-pages
   ```

2. **Add deploy script** to `package.json`:
   ```json
   {
     "scripts": {
       "deploy": "npm run build:production && gh-pages -d dist"
     }
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Configure GitHub**:
   - Go to repository Settings → Pages
   - Source: `gh-pages` branch
   - Save

**Base URL Configuration**:

If deploying to `https://username.github.io/repo-name/`, update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/repo-name/', // Add repository name
  // ... rest of config
});
```

---

### Cloudflare Pages

**Why Cloudflare Pages?**:
- ✅ Ultra-fast global network
- ✅ Unlimited bandwidth
- ✅ DDoS protection
- ✅ Web Analytics (free)

**Deployment Steps**:

1. **Push to GitHub/GitLab**

2. **Connect to Cloudflare Pages**:
   - Visit https://pages.cloudflare.com/
   - Click "Create a project"
   - Connect Git repository
   - Configure:
     - **Framework preset**: None (or Vite)
     - **Build command**: `npm run build:production`
     - **Build output directory**: `dist`
   - Click "Save and Deploy"

**cloudflare-pages.toml** (optional):
```toml
[build]
command = "npm run build:production"
destination = "dist"

[build.environment]
NODE_VERSION = "18"
```

---

### Static Hosting (Any Server)

**Requirements**:
- Web server (Nginx, Apache, Caddy, etc.)
- HTTPS certificate (Let's Encrypt recommended)

**Deployment Steps**:

1. **Build production version**:
   ```bash
   npm run build:production
   ```

2. **Upload `dist/` contents** to web server:
   ```bash
   # Example: rsync to server
   rsync -avz dist/ user@server:/var/www/html/
   ```

3. **Configure web server**:

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # SPA routing (fallback to index.html)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Apache Configuration** (`.htaccess`):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Gzip Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>

# Cache Control
<FilesMatch "\.(js|css|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$">
  Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
```

---

## Docker Deployment

**Why Docker?**:
- ✅ Consistent environment
- ✅ Easy scaling
- ✅ Self-hosted deployment

**Dockerfile**:
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:production

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf** (for Docker):
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  todo-app:
    build: .
    ports:
      - "3000:80"
    restart: unless-stopped
```

**Build and Run**:
```bash
# Build image
docker build -t daily-todo .

# Run container
docker run -p 3000:80 daily-todo

# Or use docker-compose
docker-compose up -d
```

---

## Environment-Specific Builds

### Development
```bash
npm run dev
```
- Hot Module Replacement (HMR)
- Source maps enabled
- Development warnings
- Localhost only

### Preview (Production Simulation)
```bash
npm run build:production
npm run preview
```
- Production build
- Local preview server
- Test before deployment

### Production
```bash
npm run build:production
```
- Minified code
- Console logs removed
- Optimized assets
- Ready for deployment

---

## Custom Domain Setup

### Vercel
1. Go to project settings
2. Add custom domain
3. Configure DNS:
   - **A Record**: `76.76.21.21`
   - **CNAME**: `cname.vercel-dns.com`

### Netlify
1. Go to Domain settings
2. Add custom domain
3. Configure DNS:
   - **A Record**: `75.2.60.5`
   - **CNAME**: `[your-site].netlify.app`

### Cloudflare Pages
1. Add custom domain
2. Cloudflare auto-configures DNS

---

## CI/CD Pipelines

### GitHub Actions (Vercel)

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build:production
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### GitHub Actions (Netlify)

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build:production
      - uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-deploy: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## Post-Deployment Checklist

After deploying, verify:

- [ ] **App loads correctly** (visit production URL)
- [ ] **HTTPS is enabled** (green padlock in browser)
- [ ] **Tasks can be created, edited, deleted**
- [ ] **Data persists after reload**
- [ ] **Favicon displays correctly**
- [ ] **All pages accessible** (no 404 errors)
- [ ] **No console errors** (open DevTools)
- [ ] **Responsive on mobile** (test on phone)
- [ ] **Lighthouse scores 90+** (all categories)
- [ ] **PWA installable** (if HTTPS enabled)

**Test on multiple browsers**:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)

---

## Monitoring and Analytics

### Performance Monitoring

**Google Analytics 4** (optional):
```html
<!-- Add to index.html <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Vercel Analytics**:
- Enable in Vercel dashboard
- Tracks Core Web Vitals automatically
- No code changes needed

**Sentry Error Tracking**:
```bash
npm install @sentry/react @sentry/tracing
```

Add to `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

---

## Troubleshooting

### Build Fails

**Error**: "terser not found"
```bash
npm install -D terser
```

**Error**: TypeScript errors
```bash
# Use production build script (skips type checking)
npm run build:production

# Or fix TypeScript errors
npm run type-check
```

### Deployment Issues

**404 on routes**:
- Ensure SPA fallback configured (see platform guides above)
- Verify `dist/index.html` exists

**Assets not loading**:
- Check base URL in `vite.config.ts`
- Verify file paths in browser DevTools Network tab

**HTTPS issues**:
- Most platforms auto-provide HTTPS
- For custom domains, verify DNS configuration

**PWA not installing**:
- HTTPS required (localhost exempt)
- Check manifest.webmanifest is accessible
- Verify icons exist in `/public`

---

## Security Best Practices

### Content Security Policy (CSP)

Add to your web server configuration or via meta tag:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;">
```

**Nginx**:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';";
```

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

---

## Rollback Strategy

### Vercel/Netlify
- Use dashboard to rollback to previous deployment
- Each deployment has unique URL

### Manual Deployment
```bash
# Keep previous builds
cp -r dist dist-backup-$(date +%Y%m%d)

# Rollback if needed
rm -rf dist
mv dist-backup-YYYYMMDD dist
```

### Docker
```bash
# Tag images with versions
docker build -t daily-todo:v1.0.0 .

# Rollback to previous version
docker-compose down
docker tag daily-todo:v0.9.0 daily-todo:latest
docker-compose up -d
```

---

## Performance Tips

1. **Enable Compression**: Gzip/Brotli on web server
2. **Use CDN**: Cloudflare, Vercel Edge Network
3. **Cache Headers**: Set long expiry for static assets
4. **HTTP/2**: Enable on web server
5. **Lazy Load**: Already implemented for dialogs
6. **Preconnect**: Add hints in `index.html`

---

## Resources

- [Vite Deployment Docs](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [GitHub Pages Guide](https://pages.github.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
