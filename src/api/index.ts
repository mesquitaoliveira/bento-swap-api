import express from "express";
import supportedChainsRoutes from "./supported-chains";
import quoteRoutes from "./quote";
import swapRoutes from "./swap";
import routeRoutes from "./route";
import brazilianTokensRoutes from "./brazilian-tokens";

const router = express.Router();

//  routes
router.use("/", supportedChainsRoutes);
router.use("/", quoteRoutes);
router.use("/", swapRoutes);
router.use("/", routeRoutes);
router.use("/", brazilianTokensRoutes);

export default router;
