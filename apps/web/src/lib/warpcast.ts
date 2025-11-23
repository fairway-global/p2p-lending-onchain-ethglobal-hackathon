import { env } from "@/lib/env";

/**
 * Get the farcaster manifest for the frame, generate yours from Warpcast Mobile
 *  On your phone to Settings > Developer > Domains > insert website hostname > Generate domain manifest
 * @returns The farcaster manifest for the frame
 */
export async function getFarcasterManifest() {
  const frameName = "Savelo";
  const appUrl = env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const noindex = appUrl.includes("localhost") || appUrl.includes("ngrok") || appUrl.includes("https://dev.");

  // Check if account association is properly configured
  const hasValidAccountAssociation = 
    env.NEXT_PUBLIC_FARCASTER_HEADER !== "build-time-placeholder" &&
    env.NEXT_PUBLIC_FARCASTER_PAYLOAD !== "build-time-placeholder" &&
    env.NEXT_PUBLIC_FARCASTER_SIGNATURE !== "build-time-placeholder";

  // In development mode, allow placeholder values for testing
  const isDevelopment = env.NEXT_PUBLIC_APP_ENV === "development" || appUrl.includes("localhost");
  
  // Safely get hostname for error message
  let hostname = "localhost";
  try {
    hostname = new URL(appUrl).hostname;
  } catch {
    // If URL parsing fails, use default
    hostname = "localhost";
  }

  if (!hasValidAccountAssociation && !isDevelopment) {
    throw new Error(
      "Account association not configured. Please generate your account association at: https://farcaster.xyz/~/developers/mini-apps/manifest?domain=" + 
      hostname + 
      " and set the NEXT_PUBLIC_FARCASTER_HEADER, NEXT_PUBLIC_FARCASTER_PAYLOAD, and NEXT_PUBLIC_FARCASTER_SIGNATURE environment variables."
    );
  }

  // Use the actual Farcaster account association values
  const accountAssociation = {
    header: "eyJmaWQiOjE1MDYxMTYsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhmNjEzZDBDMzhjMGM4Njg0MzY3Y2M1MkU0MkNFNTVmMzIwZTllRDgzIn0",
    payload: "eyJkb21haW4iOiJzYXZlbG8uZmFpcndheS5nbG9iYWwifQ",
    signature: "oF9bbjnCTjot2lz0U3uLUuzZ1RKwx91+/sWLXqhy0zJ/lj09Bs25B2FSoBNQU4Lxm+EQuKetItydNofzzgjI3Bw="
  };

  return {
    accountAssociation,
    miniapp: {
      version: "1",
      name: "savelo",
      iconUrl: "https://i.imgur.com/xyjR004.png",
      homeUrl: appUrl,
      imageUrl: "https://i.imgur.com/xyjR004.png",
      buttonTitle: "🚩 Start",
      splashImageUrl: "https://i.imgur.com/BVMfOWP.png",
      splashBackgroundColor: "#f5f0ec",
      webhookUrl: `${appUrl}/api/webhook`,
      // Metadata https://github.com/farcasterxyz/miniapps/discussions/191
      subtitle: "Savelo", // 30 characters, no emojis or special characters, short description under app name
      description: "Savelo", // 170 characters, no emojis or special characters, promotional message displayed on Mini App Page
      primaryCategory: "social",
      tags: ["mini-app", "celo"], // up to 5 tags, filtering/search tags
      tagline: "Built on Celo", // 30 characters, marketing tagline should be punchy and descriptive
      ogTitle: `${frameName}`, // 30 characters, app name + short tag, Title case, no emojis
      ogDescription: "Savelo", // 100 characters, summarize core benefits in 1-2 lines
      screenshotUrls: [
        // 1284 x 2778, visual previews of the app, max 3 screenshots
        `${appUrl}/opengraph-image.png`,
      ],
      heroImageUrl: `${appUrl}/opengraph-image.png`, // 1200 x 630px (1.91:1), promotional display image on top of the mini app store
      requiredChains: [
        "eip155:8453"
      ],
      requiredCapabilities: [
        "actions.signIn",
        "wallet.getEthereumProvider",
        "actions.swapToken"
      ],
      noindex,
    },
  };
}
