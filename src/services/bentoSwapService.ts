import {
  ChainId,
  Symbiosis,
  Token,
  TokenAmount,
  SwapExactInParams,
  SwapExactInResult,
} from "symbiosis-js-sdk";
import {
  SYMBIOSIS_CONFIG,
  VALID_SELECT_MODES,
  SelectMode,
  ERC20_ABI,
} from "../config/symbiosis";
import {
  getBrazilianToken,
  isBrazilianToken,
  getNativeToken,
  isNativeToken,
} from "../config/tokenConstants";

/**
 * Service class to manage Bento Swap operations using Symbiosis SDK
 */
export class BentoSwapService {
  private symbiosis: Symbiosis;

  constructor() {
    this.symbiosis = new Symbiosis(
      SYMBIOSIS_CONFIG.NETWORK,
      SYMBIOSIS_CONFIG.APP_NAME
    );

    // 🔍 Diagnóstico de agregadores disponíveis
    this.logAggregatorAvailability();
  }

  /**
   * Log diagnostic information about aggregator availability
   */
  private logAggregatorAvailability() {
    try {
      const clientId = (this.symbiosis as any).clientId;
      console.log("🔍 Symbiosis clientId:", clientId);
      console.log("🔍 Symbiosis config:", {
        network: SYMBIOSIS_CONFIG.NETWORK,
        appName: SYMBIOSIS_CONFIG.APP_NAME,
      });

      // Verificar disponibilidade de agregadores para BSC (56)
      const chainId = 56; // BSC
      console.log(`🔍 Agregadores disponíveis para ChainId ${chainId}:`);

      // Simular verificações do SDK
      console.log("  - OneInch disponível:", this.isOneInchAvailable(chainId));
      console.log(
        "  - OpenOcean disponível:",
        this.isOpenOceanAvailable(chainId)
      );
    } catch (error) {
      console.log("❌ Erro no diagnóstico de agregadores:", error);
    }
  }

  /**
   * Check if OneInch is available for a chainId (based on SDK logic)
   */
  private isOneInchAvailable(chainId: number): boolean {
    const ONE_INCH_CHAINS = [1, 56, 137, 10, 42161, 43114, 324, 8453, 100]; // Principais chains
    return ONE_INCH_CHAINS.includes(chainId);
  }

  /**
   * Check if OpenOcean is available for a chainId (based on SDK logic)
   */
  private isOpenOceanAvailable(chainId: number): boolean {
    const OPEN_OCEAN_CHAINS = [1, 56, 137, 10, 42161, 43114, 324, 8453, 100]; // Principais chains
    return OPEN_OCEAN_CHAINS.includes(chainId);
  }

  /**
   * Get the Symbiosis instance
   */
  getSymbiosis(): Symbiosis {
    return this.symbiosis;
  }

  /**
   * Helper to look up a token by address or symbol on a specific chain
   * Now includes support for Brazilian tokens and native tokens
   */
  getToken(chainId: ChainId, id: string): Token | undefined {
    // Verificar se id é válido
    console.log(
      `🔍 getToken called with chainId: ${chainId}, id: ${id}, type: ${typeof id}`
    );
    if (!id || typeof id !== "string") {
      console.warn(`Invalid token id provided: ${id}`);
      return undefined;
    }

    // Check if it's a native token by symbol
    if (isNativeToken(id, chainId)) {
      const nativeToken = getNativeToken(chainId);
      if (nativeToken) {
        return new Token({
          chainId: nativeToken.chainId as ChainId,
          address: nativeToken.address, // Empty string for native tokens
          decimals: nativeToken.decimals,
          symbol: nativeToken.symbol,
          name: nativeToken.name,
          isNative: true,
        });
      }
    }

    // Try exact address match first (skip for native tokens with empty address)
    if (id !== "") {
      const byAddress = this.symbiosis.findToken(id, chainId);
      if (byAddress) return byAddress;
    }

    // Check if it's a Brazilian token
    if (isBrazilianToken(id)) {
      const brazilianToken = getBrazilianToken(id, chainId);
      if (brazilianToken) {
        return new Token({
          chainId: brazilianToken.chainId as ChainId,
          address: brazilianToken.address,
          decimals: brazilianToken.decimals,
          symbol: brazilianToken.symbol,
          name: brazilianToken.name,
        });
      }
    }

    // Otherwise fall back to symbol lookup in symbiosis token list
    try {
      const lower = id.toLowerCase();
      return this.symbiosis
        .tokens()
        .find(
          (t) => t.chainId === chainId && t.symbol?.toLowerCase() === lower
        );
    } catch (error) {
      console.error(
        `Error in token symbol lookup: ${error}, id: ${id}, chainId: ${chainId}`
      );
      return undefined;
    }
  }

  /**
   * Get native token symbol for a specific chain
   */
  getNativeTokenSymbol(chainId: number): string {
    const nativeToken = getNativeToken(chainId);
    return nativeToken?.symbol || "ETH"; // Default to ETH
  }

  /**
   * Create a custom token
   */
  createCustomToken(tokenData: {
    address: string;
    symbol: string;
    decimals: number;
    chainId: number;
  }): Token {
    return new Token({
      address: tokenData.address,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      chainId: tokenData.chainId as ChainId,
    });
  }

  /**
   * Get all tokens for a specific chain
   */
  getTokensByChain(chainId: ChainId): Token[] {
    return this.symbiosis.tokens().filter((t) => t.chainId === chainId);
  }

  /**
   * Get tokens for multiple specific chains
   */
  getTokensByChains(chainIds: ChainId[]): Record<number, Token[]> {
    const result: Record<number, Token[]> = {};

    chainIds.forEach((chainId) => {
      result[chainId] = this.getTokensByChain(chainId);
    });

    return result;
  }

  /**
   * Validate select mode
   */
  validateSelectMode(selectMode: string): SelectMode {
    return VALID_SELECT_MODES.includes(selectMode as SelectMode)
      ? (selectMode as SelectMode)
      : SYMBIOSIS_CONFIG.DEFAULT_SELECT_MODE;
  }

  /**
   * Convert human-readable amount to token amount
   */
  createTokenAmount(token: Token, amount: string): TokenAmount {
    const rawAmount = BigInt(
      Math.round(Number(amount) * 10 ** token.decimals)
    ).toString();
    return new TokenAmount(token, rawAmount);
  }

  /**
   * Build swap parameters
   */
  buildSwapParams(
    tokenAmountIn: TokenAmount,
    tokenOut: Token,
    from: string,
    to: string,
    slippage: number = SYMBIOSIS_CONFIG.DEFAULT_SLIPPAGE,
    selectMode: SelectMode = SYMBIOSIS_CONFIG.DEFAULT_SELECT_MODE
  ): SwapExactInParams {
    return {
      symbiosis: this.symbiosis,
      tokenAmountIn,
      tokenOut,
      from,
      to,
      slippage,
      deadline:
        Math.floor(Date.now() / 1000) +
        SYMBIOSIS_CONFIG.DEFAULT_DEADLINE_MINUTES * 60,
      selectMode: selectMode as any,
    };
  }

  /**
   * Execute swap calculation
   */
  async executeSwap(params: SwapExactInParams): Promise<SwapExactInResult> {
    return await this.symbiosis.swapExactIn(params);
  }

  /**
   * Execute swap using direct API call (like Symbiosis frontend)
   * This method replicates the exact API call structure used by the official frontend
   */
  async executeSwapWithDirectAPI(
    params: SwapExactInParams
  ): Promise<SwapExactInResult> {
    try {
      console.log("🌐 Usando API direta da Symbiosis (como o frontend)...");

      // Construir payload exatamente como o frontend
      const apiPayload = {
        tokenAmountIn: {
          chainId: params.tokenAmountIn.token.chainId,
          address: params.tokenAmountIn.token.address,
          symbol: params.tokenAmountIn.token.symbol,
          decimals: params.tokenAmountIn.token.decimals,
          icon: "", // Removido logoURI que não existe
          amount: params.tokenAmountIn.raw.toString(),
        },
        tokenOut: {
          chainId: params.tokenOut.chainId,
          address: params.tokenOut.address,
          symbol: params.tokenOut.symbol,
          decimals: params.tokenOut.decimals,
          icon: "", // Removido logoURI que não existe
          ...(params.tokenOut.chainId === 85918
            ? {
                attributes: {
                  ton: params.to, // TON address for TON network
                },
              }
            : {}),
        },
        from: params.from,
        to: params.to,
        slippage: params.slippage,
        selectMode: params.selectMode,
        refundAddress: "", // Empty as per frontend example
      };

      console.log(
        "📦 API Payload (formato frontend):",
        JSON.stringify(apiPayload, null, 2)
      );

      // API direta removida - usar fallback SDK diretamente
      throw new Error("API direta desabilitada - usando SDK local");
    } catch (error: any) {
      console.error(
        "❌ Erro na API direta:",
        error.response?.data || error.message
      );
      throw new Error(
        `API direta falhou: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Convert API response to SDK format
   */
  private convertApiResponseToSDKResult(
    apiResult: any,
    originalParams: SwapExactInParams
  ): SwapExactInResult {
    // Criar TokenAmount para o token de saída usando a resposta da API
    const tokenAmountOut = new TokenAmount(
      originalParams.tokenOut,
      apiResult.tokenAmountOut.amount
    );

    return {
      tokenAmountOut,
      transactionRequest: apiResult.tx,
      approveTo: apiResult.approveTo,
      routes: apiResult.routes,
      transactionType: apiResult.type || "evm",
    } as SwapExactInResult;
  }

  /**
   * Execute swap with fallback aggregators and retry logic
   * Enhanced version that handles clientId limitations
   */
  async executeSwapWithFallback(
    params: SwapExactInParams,
    maxRetries: number = 3,
    retryDelayMs: number = 2000
  ): Promise<SwapExactInResult> {
    const aggregators: SelectMode[] = [
      "best_return",
      "fastest",
      "cheapest",
      "best_price",
    ];
    const originalSelectMode = params.selectMode;

    // Começar com o agregador solicitado
    let currentSelectMode: SelectMode = originalSelectMode as SelectMode;
    let aggregatorIndex = aggregators.indexOf(currentSelectMode);
    if (aggregatorIndex === -1) {
      aggregatorIndex = 0; // Default para best_return se não encontrar
      currentSelectMode = aggregators[0];
    }

    // 🔍 Log detalhado dos parâmetros iniciais
    console.log("🚀 Iniciando executeSwapWithFallback com parâmetros:", {
      clientId: (this.symbiosis as any).clientId,
      originalSelectMode,
      fromChain: params.tokenAmountIn.token.chainId,
      toChain: params.tokenOut.chainId,
      amount: params.tokenAmountIn.toSignificant(),
      slippage: params.slippage,
      deadline: new Date(params.deadline * 1000).toISOString(),
    });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      for (let i = 0; i < aggregators.length; i++) {
        // Calcular qual agregador usar (rotacionar se necessário)
        const aggIndex = (aggregatorIndex + i) % aggregators.length;
        currentSelectMode = aggregators[aggIndex];

        console.log(
          `🔄 Tentativa ${attempt}/${maxRetries} - Agregador: ${currentSelectMode}`
        );

        try {
          const modifiedParams = {
            ...params,
            selectMode: currentSelectMode as any,
          };

          // Se não é a primeira tentativa, aumentar slippage gradualmente
          if (attempt > 1) {
            const increasedSlippage = params.slippage + (attempt - 1) * 100; // Aumenta 1% a cada tentativa
            modifiedParams.slippage = Math.min(increasedSlippage, 300); // Aumentado para 3% máximo
            console.log(
              `⚡ Aumentando slippage para ${modifiedParams.slippage} (${
                modifiedParams.slippage / 100
              }%) na tentativa ${attempt}`
            );
          }

          console.log(`📦 Parâmetros enviados para SDK:`, {
            tokenIn: modifiedParams.tokenAmountIn.token.symbol,
            tokenOut: modifiedParams.tokenOut.symbol,
            amount: modifiedParams.tokenAmountIn.toSignificant(),
            from: modifiedParams.from,
            to: modifiedParams.to,
            slippage: modifiedParams.slippage,
            selectMode: modifiedParams.selectMode,
            deadline: new Date(modifiedParams.deadline * 1000).toISOString(),
          });

          // 🎯 Chamada principal do SDK
          const result = await this.symbiosis.swapExactIn(modifiedParams);

          // 🎉 Log de sucesso detalhado
          console.log(
            `✅ Swap bem-sucedido com agregador: ${currentSelectMode}`,
            {
              amountOut: result.tokenAmountOut.toSignificant(),
              priceImpact: result.priceImpact.toSignificant(),
              routes: result.routes.map((r) => r.provider),
            }
          );

          if (currentSelectMode !== originalSelectMode) {
            console.log(
              `🔄 Sucesso com agregador alternativo: ${originalSelectMode} → ${currentSelectMode}`
            );
          }

          return result;
        } catch (error: any) {
          console.log(`❌ Falha com agregador ${currentSelectMode}:`, {
            message: error.message || error,
            reason: error.reason,
            code: error.code,
            type: typeof error,
          });

          // Log específico para diferentes tipos de erro
          if (error.message?.includes("OpenOcean")) {
            console.log(`🌊 OpenOcean específico - erro:`, error.message);
          }

          if (
            error.message?.includes("1inch") ||
            error.message?.includes("OneInch")
          ) {
            console.log(`🥇 1inch específico - erro:`, error.message);
          }

          if (error.message?.includes("Unknown()")) {
            console.log(
              `❓ Erro Unknown() detectado - provável problema de dados complexos`
            );
          }

          // Se é o último agregador desta tentativa, continua para próxima tentativa
          if (i === aggregators.length - 1) {
            console.log(
              `⏱️ Todos os agregadores falharam na tentativa ${attempt}, aguardando ${retryDelayMs}ms antes da próxima tentativa`
            );

            if (attempt < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
            }
          }
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    throw new Error(
      `Todos os agregadores falharam após ${maxRetries} tentativas. Agregadores testados: ${aggregators.join(
        ", "
      )}`
    );
  }

  /**
   * Force 1inch aggregator specifically
   */
  async executeSwapWith1inch(
    params: SwapExactInParams
  ): Promise<SwapExactInResult> {
    console.log("🥇 Forçando especificamente o agregador 1inch...");

    try {
      // Tentar criar nova instância do Symbiosis com configuração limpa para 1inch
      const cleanSymbiosis = new Symbiosis(
        SYMBIOSIS_CONFIG.NETWORK,
        "" // clientId vazio para permitir todos os agregadores
      );

      // Usar deadline estendido para 1inch (30 minutos = 1800 segundos)
      const extendedDeadline = Math.floor(Date.now() / 1000) + 30 * 60;
      console.log(
        `⏰ Usando deadline estendido para 1inch: ${new Date(
          extendedDeadline * 1000
        ).toISOString()}`
      );

      // Tentar com diferentes modos que podem favorecer 1inch
      const oneInchModes = ["best_return", "fastest", "cheapest"];

      for (const mode of oneInchModes) {
        try {
          console.log(`🔄 Tentando 1inch com modo: ${mode}`);

          const modifiedParams = {
            ...params,
            symbiosis: cleanSymbiosis,
            selectMode: mode as any,
            deadline: extendedDeadline, // Deadline estendido
          };

          const result = await cleanSymbiosis.swapExactIn(modifiedParams);

          // Verificar se a rota usa 1inch (não OpenOcean)
          const routes = result.routes?.map((r) => r.provider) || [];
          console.log(`📊 Rotas obtidas com ${mode}:`, routes);

          // Se a rota não contém open-ocean, provavelmente é 1inch ou outro
          if (!routes.some((route) => route.includes("open-ocean"))) {
            console.log(`✅ Sucesso com 1inch (modo ${mode}):`, {
              amountOut: result.tokenAmountOut.toSignificant(),
              routes: routes,
            });
            return result;
          } else {
            console.log(
              `⚠️ Modo ${mode} ainda retornou OpenOcean, tentando próximo...`
            );
          }
        } catch (modeError: any) {
          console.log(`❌ Modo ${mode} falhou:`, modeError.message);
        }
      }

      throw new Error("Nenhum modo conseguiu evitar OpenOcean");
    } catch (error: any) {
      console.log("❌ Falha ao forçar 1inch:", error.message);
      throw new Error(`1inch forçado falhou: ${error.message}`);
    }
  }

  /**
   * Alternative method to force multiple aggregators by bypassing clientId limitations
   */
  async executeSwapWithForcedAggregators(
    params: SwapExactInParams
  ): Promise<SwapExactInResult> {
    const aggregators = ["best_return", "fastest", "cheapest", "best_price"];

    console.log("🔧 Tentando forçar múltiplos agregadores...");

    for (const aggregator of aggregators) {
      try {
        console.log(`🧪 Testando agregador forçado: ${aggregator}`);

        // Tentar criar nova instância do Symbiosis com configuração limpa
        const cleanSymbiosis = new Symbiosis(
          SYMBIOSIS_CONFIG.NETWORK,
          "" // clientId vazio para permitir todos os agregadores
        );

        const modifiedParams = {
          ...params,
          symbiosis: cleanSymbiosis,
          selectMode: aggregator as any,
        };

        const result = await cleanSymbiosis.swapExactIn(modifiedParams);

        console.log(`✅ Sucesso com agregador forçado: ${aggregator}`, {
          amountOut: result.tokenAmountOut.toSignificant(),
          routes: result.routes.map((r) => r.provider),
        });

        return result;
      } catch (error: any) {
        console.log(
          `❌ Agregador forçado ${aggregator} falhou:`,
          error.message
        );
      }
    }

    throw new Error("Todos os agregadores forçados falharam");
  }

  /**
   * Enhanced execute swap that tries normal flow first, then forced aggregators
   */
  async executeSwapWithFullFallback(
    params: SwapExactInParams
  ): Promise<SwapExactInResult> {
    try {
      // Primeira tentativa: fluxo normal com fallback
      console.log("🎯 Tentativa 1: Fluxo normal com fallback");
      return await this.executeSwapWithFallback(params);
    } catch (normalError: any) {
      console.log("❌ Fluxo normal falhou, tentando agregadores forçados...");

      try {
        // Segunda tentativa: forçar agregadores
        console.log("🎯 Tentativa 2: Agregadores forçados");
        return await this.executeSwapWithForcedAggregators(params);
      } catch (forcedError: any) {
        console.log("💥 Ambas as tentativas falharam");

        // Retornar erro mais descritivo
        throw new Error(`
          Falha completa no swap:
          1. Fluxo normal: ${normalError?.message || normalError}
          2. Agregadores forçados: ${forcedError?.message || forcedError}
          
          Possíveis causas:
          - ClientId limitando agregadores
          - Transação muito complexa para OpenOcean
          - Liquidez insuficiente
          - Problemas de rede
        `);
      }
    }
  }

  /**
   * Get provider for a specific chain
   */
  getProvider(chainId: ChainId) {
    return this.symbiosis.getProvider(chainId);
  }

  /**
   * Format token for API response
   */
  formatTokenForResponse(token: Token) {
    try {
      return {
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        isNative: token.isNative ?? false,
        isSynthetic: token.isSynthetic ?? false,
        tonAddress:
          (token as any).tonAddress ?? (token as any).attributes?.ton ?? null,
      };
    } catch (err) {
      return {
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        isNative: token.isNative ?? false,
        isSynthetic: token.isSynthetic ?? false,
        tonAddress: null,
      };
    }
  }

  /**
   * Format swap result for API response
   */
  formatSwapResult(result: SwapExactInResult, selectMode: SelectMode) {
    return {
      selectMode,
      transactionType: result.transactionType,
      tokenAmountOut: result.tokenAmountOut.toSignificant(),
      tokenAmountOutMin: result.tokenAmountOutMin.toSignificant(),
      priceImpact: result.priceImpact.toSignificant(),
      approveTo: result.approveTo,
      // Incluir estimatedTime se disponível no resultado do SDK
      ...((result as any).estimatedTime !== undefined && {
        estimatedTime: (result as any).estimatedTime,
      }),
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
      transactionRequest: result.transactionRequest,
    };
  }

  /**
   * Approve token spending (for EVM chains)
   */
  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    wallet: any,
    amount?: string
  ) {
    const { ethers } = await import("ethers");

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    const approveAmount = amount || ethers.constants.MaxUint256;
    const approveTx = await tokenContract.approve(
      spenderAddress,
      approveAmount
    );

    return await approveTx.wait(1);
  }

  /**
   * Check token allowance
   */
  async checkAllowance(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string,
    provider: any
  ): Promise<string> {
    const { ethers } = await import("ethers");

    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );

    const allowance = await tokenContract.allowance(
      ownerAddress,
      spenderAddress
    );
    return allowance.toString();
  }

  /**
   * Get token balance
   */
  async getTokenBalance(
    tokenAddress: string,
    ownerAddress: string,
    provider: any
  ): Promise<string> {
    const { ethers } = await import("ethers");

    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );

    const balance = await tokenContract.balanceOf(ownerAddress);
    return balance.toString();
  }

  /**
   * Process error messages for API responses
   */
  processError(err: any) {
    let errorMessage = err.message;
    let specificErrors = [];

    if (err.errors && Array.isArray(err.errors)) {
      specificErrors = err.errors.map((e: any) => ({
        code: e.code || "unknown",
        message: e.message || "Unknown error",
      }));

      if (specificErrors.length > 0) {
        errorMessage = specificErrors[0].message;
      }
    }

    const suggestion =
      errorMessage.includes("Amount") && errorMessage.includes("less than fee")
        ? "Try increasing the swap amount. The amount after conversion is less than the required fee."
        : "Check token addresses, amounts, and network connectivity.";

    return {
      error: errorMessage,
      specificErrors: specificErrors.length > 0 ? specificErrors : undefined,
      suggestion,
      availableSelectModes: VALID_SELECT_MODES,
    };
  }
}
