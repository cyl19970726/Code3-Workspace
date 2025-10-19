# App Icons and Favicon Guide

This directory contains the app icons and favicon for Daily Todo.

## Available Icons

### ✅ Created
- `favicon.svg` - Vector favicon (scalable, works in modern browsers)
- `manifest.webmanifest` - PWA manifest file

### 📝 To Generate
The following icon files are referenced but need to be generated from `favicon.svg`:

**Standard Icons**:
- `favicon.ico` - 32x32 ICO format (for older browsers)
- `apple-touch-icon.png` - 180x180 PNG (for iOS home screen)

**PWA Icons**:
- `icon-192.png` - 192x192 PNG
- `icon-512.png` - 512x512 PNG
- `icon-maskable-192.png` - 192x192 PNG with safe zone
- `icon-maskable-512.png` - 512x512 PNG with safe zone

**Optional Screenshots** (for PWA install prompt):
- `screenshot-mobile.png` - 540x720 PNG
- `screenshot-desktop.png` - 1280x720 PNG

---

## How to Generate Icon Files

### Option 1: Online Tools (Easiest)

**RealFaviconGenerator** (Recommended):
1. Visit https://realfavicongenerator.net/
2. Upload `favicon.svg`
3. Configure settings:
   - iOS: 180x180 with background color #3b82f6
   - Android: 192x192 and 512x512
   - Windows: Optional (skip for now)
4. Download generated package
5. Extract files to `/public` directory

**Favicon.io**:
1. Visit https://favicon.io/
2. Upload `favicon.svg`
3. Generate all sizes
4. Download and extract to `/public`

### Option 2: ImageMagick (Command Line)

```bash
# Install ImageMagick
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Navigate to public directory
cd public

# Generate standard favicon
convert favicon.svg -resize 32x32 -background none favicon.ico

# Generate Apple touch icon
convert favicon.svg -resize 180x180 -background none apple-touch-icon.png

# Generate PWA icons
convert favicon.svg -resize 192x192 -background none icon-192.png
convert favicon.svg -resize 512x512 -background none icon-512.png

# Generate maskable icons (with padding for safe zone)
convert favicon.svg -resize 192x192 -background none -gravity center -extent 192x192 icon-maskable-192.png
convert favicon.svg -resize 512x512 -background none -gravity center -extent 512x512 icon-maskable-512.png
```

### Option 3: Node.js Script

Create `scripts/generate-icons.js`:

```javascript
import sharp from 'sharp';
import fs from 'fs';

const sizes = [
  { name: 'favicon.ico', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
];

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/favicon.svg');

  for (const { name, size, maskable } of sizes) {
    const image = sharp(svgBuffer).resize(size, size);

    if (maskable) {
      // Add padding for safe zone (20% on each side)
      const padding = Math.floor(size * 0.1);
      await image
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 59, g: 130, b: 246, alpha: 1 }, // #3b82f6
        })
        .resize(size, size)
        .toFile(`public/${name}`);
    } else {
      await image.toFile(`public/${name}`);
    }

    console.log(`✅ Generated ${name}`);
  }
}

generateIcons();
```

Install dependencies and run:
```bash
npm install sharp
node scripts/generate-icons.js
```

---

## Icon Design Guidelines

### SVG Favicon (Current)
- **Size**: Scalable (defined as 100x100 viewBox)
- **Colors**: Primary blue (#3b82f6), white
- **Elements**:
  - Background circle (blue)
  - Checkmark (white)
  - List lines (white, semi-transparent)
- **Purpose**: Modern browsers, high-DPI displays

### Maskable Icons
Maskable icons need a **safe zone** to prevent clipping:
- **Safe zone**: 40% (20% padding on each side)
- **Background**: Must fill entire icon (no transparency)
- **Critical content**: Keep within safe zone circle

Example:
```
┌─────────────────┐
│                 │  ← 20% padding
│   ┌─────────┐   │
│   │ Content │   │  ← Safe zone (60% of icon)
│   └─────────┘   │
│                 │  ← 20% padding
└─────────────────┘
```

### Color Palette

**Primary Colors**:
- Brand Blue: `#3b82f6` (RGB: 59, 130, 246)
- Dark Blue: `#1e40af` (RGB: 30, 64, 175)
- White: `#ffffff` (RGB: 255, 255, 255)

**Background Colors**:
- Light: `#f9fafb` (for app background)
- Blue: `#3b82f6` (for icon backgrounds)

---

## Testing Icons

### Browser Testing

**Favicon**:
1. Run dev server: `npm run dev`
2. Open http://localhost:5173
3. Check browser tab for favicon
4. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

**Apple Touch Icon** (iOS):
1. Open on iOS Safari
2. Tap "Share" → "Add to Home Screen"
3. Verify icon appears correctly

**PWA Icons**:
1. Deploy to HTTPS server
2. Open in Chrome
3. Check "Install App" prompt
4. Verify icon in app drawer

### Online Validators

**Favicon Checker**:
- https://realfavicongenerator.net/favicon_checker

**PWA Manifest Validator**:
- https://manifest-validator.appspot.com/

**Web App Manifest**:
1. Open Chrome DevTools
2. Go to "Application" tab
3. Click "Manifest" in sidebar
4. Verify all icons load correctly

---

## Screenshots for PWA

To improve the PWA install experience, add screenshots:

**Mobile Screenshot** (540x720):
1. Open app on mobile device
2. Take screenshot of main view with tasks
3. Crop to 540x720 (3:4 aspect ratio)
4. Save as `screenshot-mobile.png`

**Desktop Screenshot** (1280x720):
1. Open app on desktop at 1280x720 resolution
2. Capture main view with tasks
3. Save as `screenshot-desktop.png`

**Automated Screenshot** (Playwright):
```javascript
import { test } from '@playwright/test';

test('generate screenshots', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Mobile
  await page.setViewportSize({ width: 540, height: 720 });
  await page.screenshot({ path: 'public/screenshot-mobile.png' });

  // Desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: 'public/screenshot-desktop.png' });
});
```

---

## Manifest File Customization

Edit `manifest.webmanifest` to customize:

**Display Modes**:
- `standalone` - App looks like native app (no browser UI)
- `fullscreen` - Fullscreen mode
- `minimal-ui` - Minimal browser UI
- `browser` - Standard browser view

**Orientation**:
- `portrait-primary` - Portrait mode only
- `landscape-primary` - Landscape mode only
- `any` - Any orientation

**Categories**:
- Current: `productivity`, `utilities`
- Other: `lifestyle`, `business`, `tools`

---

## Troubleshooting

### Favicon Not Showing
1. Hard refresh browser: Ctrl+Shift+R
2. Clear browser cache
3. Verify file path: `/public/favicon.svg`
4. Check browser DevTools Network tab
5. Try different browser

### Manifest Errors
1. Validate JSON syntax
2. Check all icon paths exist
3. Verify MIME type: `application/manifest+json`
4. Must be served over HTTPS (production)

### Icons Not Generating
1. Verify ImageMagick installed: `convert --version`
2. Check SVG file is valid
3. Ensure write permissions on `/public` directory
4. Try online tool as fallback

---

## File Checklist

After generating all icons:

- [x] `favicon.svg` - Vector favicon
- [ ] `favicon.ico` - Legacy favicon (32x32)
- [ ] `apple-touch-icon.png` - iOS icon (180x180)
- [ ] `icon-192.png` - Android icon (192x192)
- [ ] `icon-512.png` - Android icon (512x512)
- [ ] `icon-maskable-192.png` - Maskable icon (192x192)
- [ ] `icon-maskable-512.png` - Maskable icon (512x512)
- [x] `manifest.webmanifest` - PWA manifest
- [ ] `screenshot-mobile.png` - PWA screenshot (540x720)
- [ ] `screenshot-desktop.png` - PWA screenshot (1280x720)

**Recommended**: Use RealFaviconGenerator.net for the easiest setup.

---

## References

- [Web App Manifest Specification](https://w3c.github.io/manifest/)
- [Favicon Best Practices](https://github.com/audreyfeldroy/favicon-cheat-sheet)
- [Maskable Icons](https://web.dev/maskable-icon/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)
- [PWA Icons Guidelines](https://web.dev/add-manifest/)
