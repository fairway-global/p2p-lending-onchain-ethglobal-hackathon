# Environment Variables Setup for Deployment

## Problem

Hardhat is not finding the `PRIVATE_KEY` from your `.env` file, resulting in empty wallet clients.

## Solution

I've added `dotenv` support to load environment variables. Follow these steps:

### Step 1: Create `.env` file

Create a file named `.env` in the `apps/contracts/` directory:

```env
PRIVATE_KEY=your_private_key_without_0x_prefix
CELOSCAN_API_KEY=your_celoscan_api_key_optional
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org
```

### Step 2: Verify Private Key Format

**Important**: The private key should:
- ✅ NOT have `0x` prefix (Hardhat will add it automatically)
- ✅ Be 64 hex characters long
- ✅ Have no spaces or quotes

**Correct:**
```env
PRIVATE_KEY=abc123def4567890123456789012345678901234567890123456789012345678
```

**Wrong:**
```env
PRIVATE_KEY=0xabc123...  # Don't include 0x
PRIVATE_KEY="abc123..."  # Don't use quotes
```

### Step 3: Verify File Location

The `.env` file MUST be in:
```
apps/contracts/.env  ← Correct location
```

NOT in:
```
.env  ← Wrong (root directory)
apps/.env  ← Wrong
```

### Step 4: Test Deployment

After creating the `.env` file, try deploying:

```bash
cd apps/contracts
npm run deploy:alfajores
```

The script will now show debug information:
- Whether PRIVATE_KEY exists
- Length of the key
- Number of wallet clients found

## Troubleshooting

### Still getting "No wallet clients found"

1. **Check file location**: Make sure `.env` is in `apps/contracts/`
2. **Check file name**: Must be exactly `.env` (not `.env.txt` or `.env.local`)
3. **Check format**: No quotes, no 0x prefix, no spaces
4. **Restart terminal**: Environment variables are loaded when Hardhat starts
5. **Check file contents**: Open `.env` and verify PRIVATE_KEY is there

### Verify Environment Variable is Loaded

The deploy script now shows debug info. If you see:
- `PRIVATE_KEY exists: false` → File not found or variable not set
- `PRIVATE_KEY length: 0` → Variable is empty
- `PRIVATE_KEY length: 66` → Has 0x prefix (remove it)

### Alternative: Set Environment Variable Directly

If `.env` file doesn't work, you can set it directly in the terminal:

**Windows (CMD):**
```cmd
set PRIVATE_KEY=your_private_key_without_0x
npm run deploy:celo
```

**Windows (PowerShell):**
```powershell
$env:PRIVATE_KEY="your_private_key_without_0x"
npm run deploy:celo
```

**Mac/Linux:**
```bash
export PRIVATE_KEY=your_private_key_without_0x
npm run deploy:celo
```

## Security Note

⚠️ **Never commit your `.env` file to git!** It contains your private key.

Make sure `.env` is in `.gitignore`:
```
.env
.env.local
```



