import express from "express";
import { Request, Response } from "express";
import { Token } from "symbiosis-js-sdk";
import { BentoSwapService } from "../services/bentoSwapService";
import { getTokenExample } from "../config/tokenConstants";

const router = express.Router();
const bentoSwapService = new BentoSwapService();

/**
 * Compute a quote for swapping a fixed amount of tokenIn into tokenOut
 */
router.post("/quote", async (req: Request, res: Response) => {
  try {
    const {
      fromChainId,
      toChainId,
      tokenIn,
      tokenOut,
      amount,
      from,
      to,
      slippage = 300,
      selectMode = "best_return",
      customTokenIn,
      customTokenOut,
      useNativeTokenIn = false, // Novo parâmetro para usar token nativo como input
      useNativeTokenOut = false, // Novo parâmetro para usar token nativo como output
    } = req.body;

    const selectedMode = bentoSwapService.validateSelectMode(selectMode);

    let inToken: Token | undefined;
    let outToken: Token | undefined;

    // Handle input token
    if (useNativeTokenIn) {
      // Use native token for the source chain
      inToken = bentoSwapService.getToken(
        fromChainId,
        bentoSwapService.getNativeTokenSymbol(fromChainId)
      );
    } else if (customTokenIn) {
      inToken = bentoSwapService.createCustomToken(customTokenIn);
    } else {
      inToken = bentoSwapService.getToken(fromChainId, tokenIn);
    }

    // Handle output token
    if (useNativeTokenOut) {
      // Use native token for the destination chain
      outToken = bentoSwapService.getToken(
        toChainId,
        bentoSwapService.getNativeTokenSymbol(toChainId)
      );
    } else if (customTokenOut) {
      outToken = bentoSwapService.createCustomToken(customTokenOut);
    } else {
      outToken = bentoSwapService.getToken(toChainId, tokenOut);
    }

    if (!inToken) {
      const exampleToken = getTokenExample(fromChainId);
      res.status(400).json({
        error: `Unknown input token ${tokenIn} on chain ${fromChainId}. You can provide a custom token definition using 'customTokenIn'.`,
        example: {
          customTokenIn: exampleToken,
        },
        supportedBrazilianTokens: {
          BRZ: "Brazilian Digital Token - Available on Polygon, Base, Avalanche, Optimism, Ethereum",
        },
      });
      return;
    }
    if (!outToken) {
      const exampleToken = getTokenExample(toChainId);
      res.status(400).json({
        error: `Unknown output token ${tokenOut} on chain ${toChainId}. You can provide a custom token definition using 'customTokenOut'.`,
        example: {
          customTokenOut: exampleToken,
        },
        supportedBrazilianTokens: {
          BRZ: "Brazilian Digital Token - Available on Polygon, Base, Avalanche, Optimism, Ethereum",
        },
      });
      return;
    }

    const tokenAmountIn = bentoSwapService.createTokenAmount(inToken, amount);
    const params = bentoSwapService.buildSwapParams(
      tokenAmountIn,
      outToken,
      from,
      to,
      slippage,
      selectedMode
    );

    const result = await bentoSwapService.executeSwap(params);
    const formattedResult = bentoSwapService.formatSwapResult(
      result,
      selectedMode
    );

    res.json(formattedResult);
  } catch (err: any) {
    console.error(err);
    const errorResponse = bentoSwapService.processError(err);
    res.status(500).json(errorResponse);
  }
});

export default router;
