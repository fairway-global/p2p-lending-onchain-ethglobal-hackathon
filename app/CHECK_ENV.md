# Environment Variables Setup - Troubleshooting

## Quick Fix Steps

1. **Create `.env.local` file in `apps/web/` directory** (NOT in root)

   File location: `apps/web/.env.local`
   
   Content:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   NEXT_PUBLIC_TOKEN_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
   ```

2. **IMPORTANT: Restart your dev server**
   - Stop the server (press `Ctrl+C` in the terminal)
   - Start it again: `npm run dev`
   - Next.js only loads `.env.local` on server startup

3. **Check browser console**
   - Open browser DevTools (F12)
   - Look for "Environment Variables Debug" logs
   - Verify the token address is showing correctly

## Verify File Location

The `.env.local` file MUST be in:
```
apps/web/.env.local  ← Correct location
```

NOT in:
```
.env.local  ← Wrong (root directory)
apps/.env.local  ← Wrong
```

## Common Issues

### Issue: "Token address still shows as zero address"
**Solution**: 
- Make sure file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- Restart the dev server completely
- Check browser console for debug logs

### Issue: "File exists but not being read"
**Solution**:
- Verify file is in `apps/web/` directory
- Check for typos in variable names (must be `NEXT_PUBLIC_TOKEN_ADDRESS`)
- Make sure there are no spaces around the `=` sign
- Restart dev server

### Issue: "Works in .env but not .env.local"
**Solution**:
- `.env.local` takes precedence over `.env`
- Make sure `.env.local` has the correct values
- Restart dev server

## Test Token Addresses

### Celo Alfajores Testnet (for testing)
- **cUSD**: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
- **cEUR**: `0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F`

### Celo Mainnet (for production)
- **cUSD**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- **cEUR**: `0xD8763CBa276a3738E6D85e4F2dC36Fd3C3e5E3C1`

## Still Not Working?

1. Check the browser console for debug logs
2. Verify the file exists: `dir apps\web\.env.local` (Windows) or `ls apps/web/.env.local` (Mac/Linux)
3. Try hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
4. Clear Next.js cache: Delete `.next` folder and restart

