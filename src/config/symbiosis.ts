import { ChainId } from "symbiosis-js-sdk";

export const SYMBIOSIS_CONFIG = {
  APP_NAME: "api-swap-bridge",
  NETWORK: "mainnet" as const,
  DEFAULT_SLIPPAGE: 200, // 2.0%
  DEFAULT_DEADLINE_MINUTES: 20,
  DEFAULT_SELECT_MODE: "best_return" as const,
};

export const SUPPORTED_CHAINS = {
  ETHEREUM: ChainId.ETH_MAINNET,
  POLYGON: ChainId.MATIC_MAINNET,
  TON: ChainId.TON_MAINNET,
  ARBITRUM: ChainId.ARBITRUM_MAINNET,
  OPTIMISM: ChainId.OPTIMISM_MAINNET,
  AVALANCHE: ChainId.AVAX_MAINNET,
  BASE: ChainId.BASE_MAINNET,
} as const;

export const VALID_SELECT_MODES = [
  "best_return",
  "best_price",
  "fastest",
  "cheapest",
] as const;

export type SelectMode = (typeof VALID_SELECT_MODES)[number];

export const CHAIN_NAMES: Record<number, string> = {
  [ChainId.MATIC_MAINNET]: "Polygon",
  [ChainId.TON_MAINNET]: "TON",
  [ChainId.ETH_MAINNET]: "Ethereum",
  [ChainId.BSC_MAINNET]: "BSC",
  [ChainId.ARBITRUM_MAINNET]: "Arbitrum",
  [ChainId.OPTIMISM_MAINNET]: "Optimism",
  [ChainId.AVAX_MAINNET]: "Avalanche",
  [ChainId.BASE_MAINNET]: "Base",
};

export const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
] as const;
