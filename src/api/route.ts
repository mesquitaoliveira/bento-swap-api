import express from "express";
import { Request, Response } from "express";
import { Token } from "symbiosis-js-sdk";
import { BentoSwapService } from "../services/bentoSwapService";

const router = express.Router();
const bentoSwapService = new BentoSwapService();

/**
 * Get the swap route between two specific tokens
 */
router.post("/route", async (req: Request, res: Response) => {
  try {
    const {
      fromChainId,
      toChainId,
      tokenIn,
      tokenOut,
      amount = "1",
      from,
      to,
      slippage = 300,
      selectMode = "best_return",
      customTokenIn,
      customTokenOut,
    } = req.body;

    if (!from || !to) {
      res.status(400).json({
        error:
          "Both 'from' and 'to' addresses are required for route calculation",
        example: {
          from: "0x1234567890123456789012345678901234567890",
          to: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
        },
      });
      return;
    }

    const selectedMode = bentoSwapService.validateSelectMode(selectMode);

    let inToken: Token | undefined;
    let outToken: Token | undefined;

    if (customTokenIn) {
      inToken = bentoSwapService.createCustomToken(customTokenIn);
    } else {
      inToken = bentoSwapService.getToken(fromChainId, tokenIn);
    }

    if (customTokenOut) {
      outToken = bentoSwapService.createCustomToken(customTokenOut);
    } else {
      outToken = bentoSwapService.getToken(toChainId, tokenOut);
    }

    if (!inToken) {
      res.status(400).json({
        error: `Unknown input token ${tokenIn} on chain ${fromChainId}. You can provide a custom token definition using 'customTokenIn'.`,
        example: {
          customTokenIn: {
            address: "0x4eD141110F6EeeAbA9A1df36d8c26f684d2475Dc",
            symbol: "BRZ",
            decimals: 18,
            chainId: 137,
          },
        },
      });
      return;
    }

    if (!outToken) {
      res.status(400).json({
        error: `Unknown output token ${tokenOut} on chain ${toChainId}. You can provide a custom token definition using 'customTokenOut'.`,
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

    res.json({
      route: {
        from: {
          chainId: fromChainId,
          token: bentoSwapService.formatTokenForResponse(inToken),
        },
        to: {
          chainId: toChainId,
          token: bentoSwapService.formatTokenForResponse(outToken),
        },
        selectMode: selectedMode,
        transactionType: result.transactionType,
        routes: result.routes.map((r) => ({
          provider: r.provider,
          tokens: r.tokens.map((t) => ({
            address: t.address,
            symbol: t.symbol,
            chainId: t.chainId,
            decimals: t.decimals,
          })),
        })),
        fees: result.fees.map((f) => ({
          provider: f.provider,
          value: f.value.toSignificant(),
        })),
        priceImpact: result.priceImpact.toSignificant(),
        estimatedGas:
          (result.transactionRequest as any)?.gas ||
          (result.transactionRequest as any)?.gasLimit,
      },
    });
  } catch (err: any) {
    console.error(err);
    const errorResponse = bentoSwapService.processError(err);
    res.status(400).json({
      ...errorResponse,
      details:
        "Make sure to provide valid 'from' and 'to' addresses. For TON swaps, use a valid TON address in base64 format.",
    });
  }
});

export default router;
