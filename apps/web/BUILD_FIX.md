# Fixing Build Permission Errors on Windows/OneDrive

## Problem
If you're getting `EPERM: operation not permitted` errors when building, it's likely because OneDrive is trying to sync the `.next` build directory, which causes file locking issues.

## Solution: Exclude `.next` from OneDrive Sync

### Method 1: OneDrive Settings (Recommended)
1. Right-click the OneDrive icon in the system tray
2. Click **Settings** → **Sync and backup** → **Advanced settings**
3. Click **Choose folders** or **Manage backup**
4. Find your project folder and uncheck the `.next` folder (or exclude the entire project if it's not needed in OneDrive)

### Method 2: Move Project Outside OneDrive
Move your project to a location outside OneDrive (e.g., `C:\Projects\` or `C:\dev\`)

### Method 3: Use .onedriveignore (If Available)
Create a `.onedriveignore` file in your project root with:
```
.next/
node_modules/
```

## Quick Fix: Clear Build Cache
If the build fails, try clearing the cache:
```bash
cd apps/web
rmdir /s /q .next
npm run build
```

Or use PowerShell:
```powershell
cd apps/web
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## Alternative: Disable OneDrive for This Folder
1. Right-click the project folder
2. Select **Properties** → **Attributes**
3. Check **Offline** or exclude from OneDrive sync

