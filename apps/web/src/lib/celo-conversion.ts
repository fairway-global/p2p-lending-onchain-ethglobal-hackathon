/**
 * CELO to USD conversion utilities
 * 1 CELO = $0.16
 */

export const CELO_TO_USD_RATE = 0.16;

/**
 * Convert CELO amount to USD
 */
export function celoToUsd(celoAmount: number): number {
  return celoAmount * CELO_TO_USD_RATE;
}

/**
 * Convert USD amount to CELO
 */
export function usdToCelo(usdAmount: number): number {
  return usdAmount / CELO_TO_USD_RATE;
}

/**
 * Format CELO amount with USD equivalent
 */
export function formatCeloWithUsd(celoAmount: number | string): string {
  const celo = typeof celoAmount === 'string' ? parseFloat(celoAmount) : celoAmount;
  const usd = celoToUsd(celo);
  return `${celo.toFixed(4)} CELO ($${usd.toFixed(2)} USD)`;
}

/**
 * Format USD amount with CELO equivalent
 */
export function formatUsdWithCelo(usdAmount: number | string): string {
  const usd = typeof usdAmount === 'string' ? parseFloat(usdAmount) : usdAmount;
  const celo = usdToCelo(usd);
  return `$${usd.toFixed(2)} USD (${celo.toFixed(4)} CELO)`;
}

/**
 * Demo mode: Scale down amounts for POC
 * Divides by 1000 to make amounts very small for testing
 */
export const DEMO_SCALE_FACTOR = 1000;

export function scaleForDemo(amount: bigint): bigint {
  return amount / BigInt(DEMO_SCALE_FACTOR);
}

export function scaleForDemoNumber(amount: number): number {
  return amount / DEMO_SCALE_FACTOR;
}


