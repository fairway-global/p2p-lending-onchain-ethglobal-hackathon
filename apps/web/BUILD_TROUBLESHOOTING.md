# Build Troubleshooting Guide

## Issue: Build Getting Stuck

If your Next.js build is hanging or getting stuck, try these solutions:

### 1. Clear Build Cache
```bash
cd apps/web
rmdir /s /q .next
npm run build
```

Or with PowerShell:
```powershell
cd apps/web
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

### 2. Check Environment Variables
Make sure your `.env.local` file has all required variables:
- `NEXT_PUBLIC_URL` (required)
- `NEXT_PUBLIC_CONTRACT_ADDRESS` (required)
- `NEXT_PUBLIC_FARCASTER_HEADER` (optional, has defaults)
- `NEXT_PUBLIC_FARCASTER_PAYLOAD` (optional, has defaults)
- `NEXT_PUBLIC_FARCASTER_SIGNATURE` (optional, has defaults)

### 3. Build with Verbose Output
```bash
cd apps/web
npm run build -- --debug
```

### 4. Skip Type Checking (if types are causing issues)
Temporarily set in `next.config.js`:
```js
typescript: {
  ignoreBuildErrors: true,
}
```

### 5. Check for OneDrive Sync Issues
If your project is in OneDrive, exclude `.next` folder from sync:
1. Right-click OneDrive icon → Settings
2. Choose folders → Uncheck `.next` folder

### 6. Build with Limited Memory (if memory is the issue)
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 7. Check for Blocking Operations
Look for:
- Synchronous file operations
- Network requests during build
- Environment variable validation issues

### 8. Use Standalone Build
If all else fails, try a standalone build:
```bash
cd apps/web
npm run build
# The .next/standalone folder will contain the optimized build
```

## Common Causes

1. **Environment Variable Validation**: The `@t3-oss/env-nextjs` package validates env vars during build
2. **Route Handler Evaluation**: Dynamic route handlers might be evaluated during build
3. **Webpack Configuration**: Complex webpack configs can cause hangs
4. **OneDrive Sync**: File locking from OneDrive can cause permission errors
5. **Memory Issues**: Large builds can run out of memory

## Quick Fix Script

Create a `build-fix.bat` file:
```batch
@echo off
cd apps\web
echo Clearing build cache...
if exist .next rmdir /s /q .next
echo Starting build...
npm run build
```

