import express from "express";
import { Request, Response } from "express";
import { ChainId, Token } from "symbiosis-js-sdk";
import { BentoSwapService } from "../services/bentoSwapService";
import { SUPPORTED_CHAINS } from "../config/symbiosis";

const router = express.Router();
const bentoSwapService = new BentoSwapService();

/**
 * Helper to get all supported tokens for specific networks
 */
function getTokensByNetwork() {
  const polygonTokens = bentoSwapService.getTokensByChain(
    SUPPORTED_CHAINS.POLYGON
  );
  const tonTokens = bentoSwapService.getTokensByChain(SUPPORTED_CHAINS.TON);

  return {
    polygon: polygonTokens,
    ton: tonTokens,
  };
}

/**
 * Endpoint to list all known tokens on a given chain
 */
router.get("/tokens/:chainId", (req: Request, res: Response) => {
  try {
    const chainId = Number(req.params.chainId) as ChainId;
    const tokens = bentoSwapService
      .getTokensByChain(chainId)
      .map((t: Token) => bentoSwapService.formatTokenForResponse(t));

    res.json(tokens);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Endpoint to get supported chains
 */
router.get("/supported-chains", (req: Request, res: Response) => {
  try {
    res.json({
      supportedChains: SUPPORTED_CHAINS,
      message: "All supported blockchain networks",
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Endpoint to get supported tokens for Polygon and TON networks
 */
router.get("/supported-networks", (req: Request, res: Response) => {
  try {
    const networkTokens = getTokensByNetwork();

    res.json({
      polygon: {
        chainId: SUPPORTED_CHAINS.POLYGON,
        tokens: networkTokens.polygon.map((t: Token) => ({
          address: t.address,
          symbol: t.symbol,
          decimals: t.decimals,
          isNative: t.isNative ?? false,
          isSynthetic: t.isSynthetic ?? false,
        })),
      },
      ton: {
        chainId: SUPPORTED_CHAINS.TON,
        tokens: networkTokens.ton.map((t: Token) => ({
          address: t.address,
          symbol: t.symbol,
          decimals: t.decimals,
          isNative: t.isNative ?? false,
          isSynthetic: t.isSynthetic ?? false,
          tonAddress: (t as any).tonAddress ?? (t as any).attributes?.ton,
        })),
      },
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
