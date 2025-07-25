import express from "express";
import { Request, Response } from "express";
import { SUPPORTED_CHAINS } from "../config/symbiosis";

const router = express.Router();

router.get("/supported-networks", (req: Request, res: Response) => {
  try {
    res.json({
      message: "Supported networks endpoint",
      polygon: { chainId: SUPPORTED_CHAINS.POLYGON },
      ton: { chainId: SUPPORTED_CHAINS.TON },
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
