/**
 * Brazilian Stablecoins Token Constants
 * Endereços dos principais tokens brasileiros em diferentes redes
 */

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  name: string;
  icon: string;
}

// URLs dos ícones dos tokens brasileiros
export const TOKEN_ICONS = {
  BRZ: "https://assets.coingecko.com/coins/images/8472/standard/MicrosoftTeams-image_%286%29.png?1696508657",
  // Adicionar outros ícones conforme necessário
  // BRLA: "https://assets.coingecko.com/coins/images/xxxx/standard/brla.png",
  // PIX: "https://assets.coingecko.com/coins/images/yyyy/standard/pix.png"
} as const;

// Nomes completos dos tokens brasileiros
export const TOKEN_NAMES = {
  BRZ: "Brazilian Digital Token",
  // BRLA: "BRL Anchor Token",
  // PIX: "PIX Token"
} as const;

export const BRAZILIAN_TOKENS: Record<string, Record<number, TokenInfo>> = {
  BRZ: {
    // Polygon
    137: {
      address: "0x4eD141110F6EeeAbA9A1df36d8c26f684d2475Dc",
      symbol: "BRZ",
      decimals: 18,
      chainId: 137,
      name: TOKEN_NAMES.BRZ,
      icon: TOKEN_ICONS.BRZ,
    },
    // Base
    8453: {
      address: "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4",
      symbol: "BRZ",
      decimals: 18,
      chainId: 8453,
      name: TOKEN_NAMES.BRZ,
      icon: TOKEN_ICONS.BRZ,
    },
    // Avalanche
    43114: {
      address: "0x05539F021b66Fd01d1FB1ff8E167CdD09bf7c2D0",
      symbol: "BRZ",
      decimals: 18,
      chainId: 43114,
      name: TOKEN_NAMES.BRZ,
      icon: TOKEN_ICONS.BRZ,
    },
    // Optimism
    10: {
      address: "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4",
      symbol: "BRZ",
      decimals: 18,
      chainId: 10,
      name: TOKEN_NAMES.BRZ,
      icon: TOKEN_ICONS.BRZ,
    },
    // Ethereum
    1: {
      address: "0x01d33fd36ec67c6ada32cf36b31e88ee190b1839",
      symbol: "BRZ",
      decimals: 18,
      chainId: 1,
      name: TOKEN_NAMES.BRZ,
      icon: TOKEN_ICONS.BRZ,
    },
  },

  // Adicionar outros tokens brasileiros no futuro:
  // BRLA: { ... } - BRL Anchor Token
  // PIX: { ... } - PIX Token (se/quando disponível)
  // USDBRL: { ... } - USD-BRL synthetic tokens
};

/**
 * Obter informações de um token brasileiro
 */
export function getBrazilianToken(
  symbol: string,
  chainId: number
): TokenInfo | undefined {
  return BRAZILIAN_TOKENS[symbol.toUpperCase()]?.[chainId];
}

/**
 * Verificar se um token é brasileiro suportado
 */
export function isBrazilianToken(symbol: string): boolean {
  return symbol.toUpperCase() in BRAZILIAN_TOKENS;
}

/**
 * Listar todas as redes onde um token brasileiro está disponível
 */
export function getTokenChains(symbol: string): number[] {
  const token = BRAZILIAN_TOKENS[symbol.toUpperCase()];
  return token ? Object.keys(token).map(Number) : [];
}

/**
 * Obter exemplo de token para documentação da API
 */
export function getTokenExample(chainId: number = 137): TokenInfo {
  // Retorna BRZ como exemplo padrão
  return getBrazilianToken("BRZ", chainId) || BRAZILIAN_TOKENS.BRZ[137];
}

/**
 * Obter informações completas do token com ícone
 */
export function getTokenWithIcon(
  symbol: string,
  chainId: number
): TokenInfo | undefined {
  return getBrazilianToken(symbol, chainId);
}

/**
 * Obter apenas a URL do ícone de um token
 */
export function getTokenIcon(symbol: string): string | undefined {
  const upperSymbol = symbol.toUpperCase() as keyof typeof TOKEN_ICONS;
  return TOKEN_ICONS[upperSymbol];
}

/**
 * Obter apenas o nome completo de um token
 */
export function getTokenName(symbol: string): string | undefined {
  const upperSymbol = symbol.toUpperCase() as keyof typeof TOKEN_NAMES;
  return TOKEN_NAMES[upperSymbol];
}

/**
 * Listar todos os tokens brasileiros disponíveis
 */
export function getAllBrazilianTokens(): Record<
  string,
  Record<number, TokenInfo>
> {
  return BRAZILIAN_TOKENS;
}
