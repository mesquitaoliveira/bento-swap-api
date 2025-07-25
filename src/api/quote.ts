import express from "express";
import { Request, Response } from "express";
import { BentoSwapService } from "../services/bentoSwapService";

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
    } = req.body;

    const selectedMode = bentoSwapService.validateSelectMode(selectMode);

    const inToken = bentoSwapService.getToken(fromChainId, tokenIn);
    const outToken = bentoSwapService.getToken(toChainId, tokenOut);

    if (!inToken) {
      res.status(400).json({
        error: `Unknown input token ${tokenIn} on chain ${fromChainId}`,
      });
      return;
    }
    if (!outToken) {
      res.status(400).json({
        error: `Unknown output token ${tokenOut} on chain ${toChainId}`,
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
