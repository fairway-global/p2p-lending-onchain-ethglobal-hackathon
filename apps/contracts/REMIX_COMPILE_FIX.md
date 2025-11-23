# Fixing "Stack Too Deep" Error in Remix

## Problem

When compiling in Remix, you get:
```
CompilerError: Stack too deep. Try compiling with `--via-ir` (cli) or the equivalent `viaIR: true` (standard JSON) while enabling the optimizer.
```

## Solution

I've refactored the contract to reduce local variables in functions that were causing stack depth issues:

### Changes Made:

1. **`checkAndDeductPenalty` function** - Reduced from 8+ local variables to 4
   - Removed intermediate variables
   - Combined calculations inline
   - Simplified grace period logic

2. **`withdraw` function** - Extracted reward pool calculation
   - Moved reward pool share calculation to separate internal function
   - Reduced local variables in main function

## How to Compile in Remix

### Option 1: Enable viaIR in Remix Settings

1. In Remix, go to **Settings** (gear icon)
2. Under **Compiler Configuration**, enable:
   - ✅ **Enable optimization**
   - ✅ **via IR** (Intermediate Representation)
3. Set **Optimization runs** to `200`
4. Compile again

### Option 2: Use the Refactored Code

The contract has been refactored to work without `viaIR`, so it should compile in Remix with default settings.

## Compiler Settings for Remix

If you still get errors, use these settings:

- **Compiler Version**: `0.8.28`
- **Enable optimization**: ✅ Yes
- **Runs**: `200`
- **via IR**: ✅ Yes (if Option 1 doesn't work)
- **EVM Version**: `default` or `paris`

## Alternative: Use Hardhat

If Remix continues to have issues, use Hardhat which already has `viaIR: true` configured:

```bash
cd apps/contracts
npm run compile
```

The contract compiles successfully with Hardhat's configuration.

