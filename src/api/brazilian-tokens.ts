import express from "express";
import { Request, Response } from "express";
import {
  getAllBrazilianTokens,
  getBrazilianToken,
  getTokenChains,
  isBrazilianToken,
} from "../config/tokenConstants";

const router = express.Router();

/**
 * Listar todos os tokens brasileiros suportados
 */
router.get("/brazilian-tokens", (req: Request, res: Response) => {
  try {
    const allTokens = getAllBrazilianTokens();

    const formattedResponse = {
      description: "Brazilian stablecoins supported for cross-chain swaps",
      tokens: allTokens,
      usage: {
        example:
          "Use these token addresses in 'customTokenIn' or 'customTokenOut' fields",
        tip: "BRZ is available across multiple chains for optimal cross-chain routing",
      },
    };

    res.json(formattedResponse);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Brazilian tokens",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Obter informações de um token específico
 */
router.get("/brazilian-tokens/:symbol", (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { chainId } = req.query;

    if (!isBrazilianToken(symbol)) {
      res.status(404).json({
        error: `Token ${symbol} is not a supported Brazilian token`,
        supportedTokens: Object.keys(getAllBrazilianTokens()),
      });
      return;
    }

    if (chainId) {
      // Retornar token específico da chain
      const token = getBrazilianToken(symbol, Number(chainId));
      if (!token) {
        res.status(404).json({
          error: `Token ${symbol} not available on chain ${chainId}`,
          availableChains: getTokenChains(symbol),
        });
        return;
      }
      res.json(token);
    } else {
      // Retornar token em todas as chains disponíveis
      const availableChains = getTokenChains(symbol);
      const tokenData = availableChains.reduce((acc, chain) => {
        const token = getBrazilianToken(symbol, chain);
        if (token) {
          acc[chain] = token;
        }
        return acc;
      }, {} as Record<number, any>);

      res.json({
        symbol: symbol.toUpperCase(),
        availableChains,
        networks: tokenData,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch token information",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
