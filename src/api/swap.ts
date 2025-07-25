import express, { Request, Response } from "express";
import { ChainId, Token } from "symbiosis-js-sdk";
import { BentoSwapService } from "../services/bentoSwapService";
import { getTokenExample } from "../config/tokenConstants";
import { config } from "dotenv";

// Ensure environment variables are loaded
config();

const router = express.Router();
const bentoSwapService = new BentoSwapService();

/**
 * Prepare a swap transaction
 */
router.post("/swap", async (req: Request, res: Response): Promise<void> => {
  // Declare variables at the top for access in catch block
  let fromChainId: number;
  let toChainId: number;
  let amount: string;

  try {
    const {
      fromChainId: reqFromChainId,
      toChainId: reqToChainId,
      tokenIn,
      tokenOut,
      amount: reqAmount,
      from,
      to,
      userAddress, // Adicionar suporte para userAddress
      slippage = 300, // 3.0% - valor padrão ajustado
      selectMode = "best_return",
      customTokenIn,
      customTokenOut,
    } = req.body;

    // Assign to variables accessible in catch
    fromChainId = reqFromChainId;
    toChainId = reqToChainId;
    amount = reqAmount;

    // Validate slippage - máximo 3% (300 basis points)
    if (slippage > 300) {
      res.status(400).json({
        error: "Slippage inválido",
        message: "O slippage máximo permitido é 3% (300 basis points)",
        receivedSlippage: slippage,
        maxSlippage: 300,
        slippageInPercent: `${slippage / 100}%`,
        maxSlippageInPercent: "3%",
        help: "Use valores entre 10 (0.1%) e 300 (3.0%) para slippage",
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

    // 🔧 Usar userAddress como fallback para from e to se não fornecidos
    const fromAddress = from || userAddress;
    const toAddress = to || userAddress;

    if (!fromAddress || !toAddress) {
      res.status(400).json({
        error: "Endereços from/to ou userAddress são obrigatórios",
        receivedParams: { from, to, userAddress },
      });
      return;
    }

    const params = bentoSwapService.buildSwapParams(
      tokenAmountIn,
      outToken,
      fromAddress,
      toAddress,
      slippage,
      selectedMode
    );

    // Log detalhado dos parâmetros antes de executar o swap
    console.log("📊 Parâmetros do swap:", {
      tokenIn: {
        symbol: tokenAmountIn.token.symbol,
        address: tokenAmountIn.token.address,
        amount: tokenAmountIn.toSignificant(),
        decimals: tokenAmountIn.token.decimals,
      },
      tokenOut: {
        symbol: outToken.symbol,
        address: outToken.address,
        decimals: outToken.decimals,
      },
      fromAddress,
      toAddress,
      slippage,
      selectMode: selectedMode,
      deadline: new Date(params.deadline * 1000).toISOString(),
    });

    // Verificação específica para endereços TON
    if (toChainId === 85918) {
      // TON Network
      console.log("🔍 Verificando endereço TON:", {
        toAddress,
        isValidTonFormat:
          toAddress.startsWith("UQ") || toAddress.startsWith("EQ"),
        length: toAddress.length,
      });
    }

    // 🚀 Primeiro tentar API direta da Symbiosis (como o frontend oficial)
    console.log("🔄 Tentando API direta da Symbiosis primeiro...");
    let result;

    try {
      result = await bentoSwapService.executeSwapWithDirectAPI(params);

      // ✅ API direta funcionou - retornar dados para execução via wallet
      console.log(
        "✅ API direta funcionou! Retornando dados da transação para execução via wallet..."
      );

      const formattedResult = bentoSwapService.formatSwapResult(
        result,
        selectedMode
      );

      // Adicionar instruções específicas para execução via wallet
      res.json({
        ...formattedResult,
        executionMethod: "wallet",
        instructions: {
          message:
            "Transação preparada com sucesso! Execute via sua wallet conectada.",
          steps: [
            "1. Conecte sua wallet ao frontend",
            "2. Execute a aprovação do token se necessário",
            "3. Execute a transação de swap",
            "4. Aguarde confirmação na blockchain",
          ],
        },
        apiSuccess: true,
        reason:
          "API direta funcionou perfeitamente - evitando execução backend devido a problemas OpenOcean",
      });
      return;
    } catch (directApiError: any) {
      console.log(
        "❌ API direta falhou, tentando SDK local:",
        directApiError.message
      );

      // Fallback para método SDK local se API direta falhar
      result = await bentoSwapService.executeSwapWithFullFallback(params);
    }

    // Log do resultado do SDK antes de retornar
    console.log("📦 Resultado do SDK:", {
      transactionType: result.transactionType,
      approveTo: result.approveTo,
      tokenAmountOut: result.tokenAmountOut?.toSignificant(),
      transactionRequest:
        JSON.stringify(result.transactionRequest, null, 2).substring(0, 500) +
        "...",
    });

    // ✅ Retornar dados da transação para execução via wallet conectada
    const formattedResult = bentoSwapService.formatSwapResult(
      result,
      selectedMode
    );

    res.json({
      ...formattedResult,
      executionMethod: "wallet",
      instructions: {
        message:
          "Transação preparada com sucesso! Execute via sua wallet conectada.",
        steps: [
          "1. Conecte sua wallet ao frontend",
          "2. Execute a aprovação do token se necessário (se approveTo estiver presente)",
          "3. Execute a transação de swap usando os dados retornados",
          "4. Aguarde confirmação na blockchain",
        ],
      },
      apiSuccess: true,
      reason:
        "Transação preparada para execução via wallet - mais seguro que execução backend",
    });
  } catch (err: any) {
    console.error(err);

    // Parse de erros específicos para tornar mais legível
    if (err.code === "INSUFFICIENT_FUNDS") {
      const walletAddress = err.transaction?.from || "Unknown";
      const networkUrl = err.error?.url || err.url || "";
      const network = networkUrl.includes("base")
        ? "Base"
        : networkUrl.includes("polygon")
        ? "Polygon"
        : networkUrl.includes("ethereum")
        ? "Ethereum"
        : networkUrl.includes("mainnet")
        ? "Ethereum"
        : "Unknown";

      // Tentar obter informações detalhadas da carteira
      let ethBalance = "Unable to fetch";
      let tokenBalance = "Unable to fetch";
      let chainIdForBalance = 8453; // Default to Base for this case

      // Try to detect chainId from network URL
      if (networkUrl.includes("polygon")) chainIdForBalance = 137;
      else if (
        networkUrl.includes("ethereum") ||
        networkUrl.includes("mainnet")
      )
        chainIdForBalance = 1;
      else if (networkUrl.includes("base")) chainIdForBalance = 8453;

      try {
        if (walletAddress !== "Unknown") {
          // Note: Balance checking would require a wallet connection
          // Since we removed private key support, we'll provide generic advice
          ethBalance = "Not available (wallet required)";
          tokenBalance = "Not available (wallet required)";
        }
      } catch (balanceErr) {
        console.warn("Could not fetch balances:", balanceErr);
        ethBalance = "Unable to fetch";
      }

      res.status(400).json({
        error: "Fundos insuficientes",
        type: "INSUFFICIENT_FUNDS",
        details: {
          message:
            "A carteira não possui fundos suficientes para executar a transação",
          wallet: walletAddress,
          network: network,
          networkUrl: networkUrl,
          balances: {
            eth: `${ethBalance} ETH`,
            token:
              tokenBalance !== "Unable to fetch"
                ? `${tokenBalance} BRZ`
                : "Unable to fetch BRZ balance",
          },
          possibleCauses: [
            "Saldo insuficiente de ETH para pagar as taxas de gas",
            "Saldo insuficiente do token BRZ para fazer o swap",
            "Token não aprovado para o contrato de swap",
          ],
          suggestedActions: [
            `Adicione ETH à sua carteira na rede ${network} para pagar as taxas`,
            "Verifique se você tem BRZ suficiente para o swap",
            "Aguarde algumas transações anteriores serem confirmadas",
          ],
          swapDetails: {
            from: "BRZ (Base Network)",
            to: "USDT (TON Network)",
            amount: "12 BRZ",
          },
        },
        originalError: {
          code: err.code,
          reason: err.reason,
        },
      });
      return;
    }

    // Parse de erros específicos de swap/roteamento
    if (
      err.code === "UNPREDICTABLE_GAS_LIMIT" ||
      err.reason?.includes("OpenOcean external call failed") ||
      err.message?.includes("Todos os agregadores falharam")
    ) {
      res.status(400).json({
        error: "Falha na execução do swap",
        type: "SWAP_ROUTING_FAILED",
        details: {
          message: "Não foi possível executar o swap cross-chain no momento",
          reason: err.message?.includes("Todos os agregadores falharam")
            ? "Todos os agregadores (best_return, fastest, cheapest, best_price) falharam após múltiplas tentativas"
            : "Falha na chamada externa do agregador OpenOcean",
          possibleCauses: [
            "Rota de swap indisponível temporariamente em todos os agregadores",
            "Liquidez insuficiente para BRZ → USDT (Base → TON)",
            "Problemas temporários com os protocolos de bridge",
            "Condições de mercado desfavoráveis",
            "Sobrecarga nos serviços de agregação",
          ],
          suggestedActions: [
            "Aguarde 5-10 minutos e tente novamente",
            "Reduza a quantidade do swap para testar a conectividade",
            "Verifique o status dos protocolos cross-chain",
            "Considere fazer o swap em duas etapas: BRZ→USDC na Base, depois USDC→USDT no TON",
            "Tente novamente em horários de menor movimento do mercado",
          ],
          swapDetails: {
            from: "BRZ (Base Network)",
            to: "USDT (TON Network)",
            amount: "Swap amount",
            currentSlippage: "200 (2.0%)",
            aggregatorsAttempted: "best_return, fastest, cheapest, best_price",
          },
          technicalDetails: {
            errorCode: err.code,
            errorReason: err.reason || err.message,
            failedAt: err.message?.includes("Todos os agregadores falharam")
              ? "Todos os agregadores disponíveis"
              : "OpenOcean aggregator call",
            networkDetected: "Base (Chain ID: 8453)",
            retryStrategy:
              "Tentativas automáticas com múltiplos agregadores já executadas",
          },
        },
        originalError: {
          code: err.code,
          reason: err.reason || err.message,
          method: err.error?.method || "estimateGas",
        },
      });
      return;
    }

    // Outros erros processados pelo serviço
    const errorResponse = bentoSwapService.processError(err);
    res.status(500).json({
      ...errorResponse,
      additionalInfo: {
        timestamp: new Date().toISOString(),
        type: "swap_execution_error",
      },
    });
  }
});

export default router;
