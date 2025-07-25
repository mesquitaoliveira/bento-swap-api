# 🌉 API Swap Bridge - Cross-Chain Token Bridge

Uma API robusta para realizar swaps cross-chain de stablecoins brasileiras (BRZ) e outros tokens entre diferentes blockchains. Esta API facilita a ponte entre redes como Ethereum, Polygon, Base, Avalanche, Optimism e TON Network.

## 🚀 Características Principais

- **Cross-Chain Swaps**: Suporte para swaps entre múltiplas blockchains
- **Stablecoin BRZ**: Foco especial na stablecoin brasileira BRZ
- **Múltiplos Agregadores**: Suporte a diferentes estratégias de roteamento (melhor retorno, mais rápido, mais barato)
- **Execução via Wallet**: Transações preparadas para execução segura via wallet conectada
- **API RESTful**: Endpoints simples e intuitivos
- **Tratamento de Erros**: Mensagens de erro detalhadas e sugestões de solução

## 🚀 **Diferencial Competitivo**

### **Para o Mercado Brasileiro:**
1. **Especialização em BRL**: Foco específico em stablecoins brasileiras
2. **Cross-Chain Nativo**: Seamless entre Base e Polygon
3. **API Simples**: Integração fácil para fintechs e exchanges
4. **Custos Otimizados**: Rotas automáticas para menor gas fee

### **Vantagens Técnicas:**
- **Modularidade**: Fácil adição de novas redes
- **Escalabilidade**: Arquitetura preparada para crescimento
- **Confiabilidade**: Protocol Symbiosis battle-tested
- **Flexibilidade**: Suporte a tokens customizados

## 📈 **Potencial de Mercado**

### **Casos de Uso:**
1. **Exchanges**: Arbitragem automática entre redes
2. **Fintechs**: Facilitação de pagamentos cross-chain
3. **DeFi Brasileiro**: Yield farming otimizado
4. **Usuários**: Transferências baratas entre ecosistemas

### **Roadmap Sugerido:**
- ✅ **Fase 1**: Base + Polygon (atual)
- 🔄 **Fase 2**: Arbitrum + Optimism
- 📋 **Fase 3**: Solana + Binance Smart Chain
- 🎯 **Fase 4**: Layer 2s brasileiras futuras

## 🛡️ **Segurança e Confiabilidade**

- **Protocol Symbiosis**: Auditado e seguro
- **Ethers.js**: Biblioteca padrão da indústria
- **TypeScript**: Type safety para reduzir bugs
- **Modular Design**: Isolamento de responsabilidades

## 🏗️ Arquitetura

```
📁 src/
├── 📁 api/           # Endpoints da API
├── 📁 services/      # Lógica de negócio
└── 📁 config/        # Configurações e constantes
```

## 🌐 Redes Suportadas

| Rede        | Chain ID | Tokens Principais      |
| ----------- | -------- | ---------------------- |
| Ethereum    | 1        | ETH, USDT, USDC, BRZ   |
| Polygon     | 137      | MATIC, USDT, USDC, BRZ |
| Base        | 8453     | ETH, USDT, USDC, BRZ   |
| Avalanche   | 43114    | AVAX, USDT, USDC, BRZ  |
| Optimism    | 10       | ETH, USDT, USDC, BRZ   |
| TON Network | 85918    | TON, USDT              |

## 📋 Endpoints da API

### 🔄 Swap de Tokens

**POST** `/swap`

Prepara uma transação de swap cross-chain entre dois tokens.

#### Request Body:

```json
{
  "fromChainId": 8453,
  "toChainId": 85918,
  "tokenIn": "BRZ",
  "tokenOut": "USDT",
  "amount": "100",
  "userAddress": "0x742d35Cc6589C4532CE1b0c2Bf52c6E6f2BE1dA4",
  "slippage": 200,
  "selectMode": "best_return"
}
```

#### Parâmetros:

- `fromChainId`: ID da rede de origem
- `toChainId`: ID da rede de destino
- `tokenIn`: Símbolo do token de entrada
- `tokenOut`: Símbolo do token de saída
- `amount`: Quantidade a ser trocada
- `userAddress`: Endereço da carteira do usuário
- `slippage`: Tolerância de slippage em basis points (padrão: 300 = 3%)
- `selectMode`: Estratégia de roteamento (`best_return`, `fastest`, `cheapest`, `best_price`)

#### Resposta:

```json
{
  "transactionType": "evm",
  "transactionRequest": {
    "to": "0x...",
    "data": "0x...",
    "value": "0x0",
    "gasLimit": "500000"
  },
  "tokenAmountOut": "99.85",
  "executionMethod": "wallet",
  "instructions": {
    "message": "Transação preparada com sucesso! Execute via sua wallet conectada.",
    "steps": ["1. Conecte sua wallet...", "..."]
  }
}
```

### 💰 Cotação de Preços

**POST** `/quote`

Obtém uma cotação para um swap sem preparar a transação.

#### Request Body:

```json
{
  "fromChainId": 137,
  "toChainId": 8453,
  "tokenIn": "BRZ",
  "tokenOut": "USDC",
  "amount": "50",
  "from": "0x742d35Cc6589C4532CE1b0c2Bf52c6E6f2BE1dA4",
  "to": "0x742d35Cc6589C4532CE1b0c2Bf52c6E6f2BE1dA4"
}
```

### 🗺️ Rota de Swap

**POST** `/route`

Mostra a rota detalhada que será utilizada para um swap cross-chain.

#### Request Body:

```json
{
  "fromChainId": 1,
  "toChainId": 137,
  "tokenIn": "BRZ",
  "tokenOut": "USDT",
  "amount": "25",
  "from": "0x742d35Cc6589C4532CE1b0c2Bf52c6E6f2BE1dA4",
  "to": "0x742d35Cc6589C4532CE1b0c2Bf52c6E6f2BE1dA4"
}
```

### 🏛️ Informações das Redes

**GET** `/supported-chains`

Lista todas as redes blockchain suportadas.

**GET** `/tokens/{chainId}`

Lista todos os tokens disponíveis em uma rede específica.

Exemplo: `GET /tokens/137` (tokens da Polygon)

### 🇧🇷 Tokens Brasileiros

**GET** `/brazilian-tokens`

Lista todos os tokens brasileiros suportados (BRZ e outros).

#### Resposta:

```json
{
  "description": "Brazilian stablecoins supported for cross-chain swaps",
  "tokens": {
    "BRZ": {
      "name": "Brazilian Digital Token",
      "chains": {
        "1": "0x420412E765BFa6d85aaaC94b4f7b708C89be2e2B",
        "137": "0x491a4eB4f1FC3BfF8E1d2FC856a6A46663aD556f",
        "8453": "0x420412E765BFa6d85aaaC94b4f7b708C89be2e2B"
      }
    }
  }
}
```

**GET** `/brazilian-tokens/{symbol}`

Obtém informações detalhadas de um token brasileiro específico.

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 16+
- NPM ou Yarn

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd api-swap-bridge

# Instale as dependências
npm install

# Configure as variáveis de ambiente (se necessário)
cp .env.example .env
```

### Executar em Desenvolvimento

```bash
npm start
```

O servidor será iniciado em `http://localhost:3000`

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
NODE_ENV=development
```

## 📝 Exemplos de Uso

### Swap BRZ → USDT (Base → TON)

```javascript
const swapData = {
  fromChainId: 8453, // Base Network
  toChainId: 85918, // TON Network
  tokenIn: "BRZ",
  tokenOut: "USDT",
  amount: "100",
  userAddress: "0x742d35Cc6589C4532CE1b0c2Bf52c6E6f2BE1dA4",
  slippage: 200, // 2%
  selectMode: "best_return",
};

fetch("/swap", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(swapData),
})
  .then((response) => response.json())
  .then((data) => {
    console.log("Swap preparado:", data);
    // Execute a transação via sua wallet conectada
  });
```

### Obter Cotação

```javascript
const quoteData = {
  fromChainId: 137, // Polygon
  toChainId: 8453, // Base
  tokenIn: "BRZ",
  tokenOut: "USDC",
  amount: "50",
  from: "0x...",
  to: "0x...",
};

fetch("/quote", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(quoteData),
})
  .then((response) => response.json())
  .then((data) => {
    console.log("Cotação:", data);
  });
```

## ⚠️ Tratamento de Erros

A API fornece mensagens de erro detalhadas para facilitar a depuração:

### Fundos Insuficientes

```json
{
  "error": "Fundos insuficientes",
  "type": "INSUFFICIENT_FUNDS",
  "details": {
    "possibleCauses": [
      "Saldo insuficiente de ETH para pagar as taxas de gas",
      "Saldo insuficiente do token BRZ para fazer o swap"
    ],
    "suggestedActions": [
      "Adicione ETH à sua carteira na rede Base para pagar as taxas",
      "Verifique se você tem BRZ suficiente para o swap"
    ]
  }
}
```

### Falha no Roteamento

```json
{
  "error": "Falha na execução do swap",
  "type": "SWAP_ROUTING_FAILED",
  "details": {
    "possibleCauses": [
      "Rota de swap indisponível temporariamente",
      "Liquidez insuficiente para o par de tokens"
    ],
    "suggestedActions": [
      "Aguarde 5-10 minutos e tente novamente",
      "Reduza a quantidade do swap para testar"
    ]
  }
}
```

## 🔒 Segurança

- **Sem Chaves Privadas**: A API não armazena nem manipula chaves privadas
- **Execução via Wallet**: Todas as transações são preparadas para execução via wallet conectada
- **Validação de Parâmetros**: Validação rigorosa de todos os parâmetros de entrada
- **Limite de Slippage**: Slippage máximo de 3% para proteção do usuário

**⚡ Desenvolvido para facilitar swaps cross-chain de stablecoins brasileiras de forma segura e eficiente.**
