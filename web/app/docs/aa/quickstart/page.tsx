import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DocsLayout } from "@/components/docs-layout"
import { ArrowRight } from "lucide-react"
import { docsConfig } from "@/lib/docs-config"

export const metadata = {
  title: "Account Abstraction",
  description: `Build with ERC-4337 account abstraction on ${docsConfig.brandName}.`,
}

export default function AAQuickstartPage() {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">Account Abstraction (ERC-4337)</h1>
          <p className="text-lg text-muted-foreground">
            Build seamless Web3 experiences with smart accounts, gas sponsorship,
            and bundled transactions. No browser extension required.
          </p>
        </div>

        {/* What is ERC-4337 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">What is ERC-4337?</h2>
          <p className="text-muted-foreground">
            ERC-4337 introduces account abstraction to Ethereum without consensus-layer
            changes. Instead of requiring every user to have an EOA (Externally Owned
            Account) that pays gas with ETH, ERC-4337 enables smart contract wallets
            with programmable logic:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>
              <strong>Smart Accounts</strong> -- Wallets are smart contracts. They can enforce
              multi-sig, spending limits, session keys, social recovery, and any custom logic.
            </li>
            <li>
              <strong>UserOperations</strong> -- Instead of sending transactions directly, users
              submit UserOperations (UserOps) to a mempool. A bundler batches multiple UserOps
              into a single on-chain transaction.
            </li>
            <li>
              <strong>Paymasters</strong> -- Third-party contracts that sponsor gas on behalf of users.
              Your users never need to hold ETH for gas fees.
            </li>
            <li>
              <strong>Bundlers</strong> -- Specialized nodes that collect UserOps, validate them, and
              submit them on-chain via the EntryPoint contract.
            </li>
          </ul>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium">Architecture</p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100 mt-2">
                <code>{`User -> UserOperation -> Bundler -> EntryPoint -> Smart Account
                                  |
                              Paymaster (gas sponsorship)`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Step 1 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">1</Badge>
            <h2 className="text-2xl font-semibold">Create a Smart Account</h2>
          </div>
          <p className="text-muted-foreground">
            Smart accounts are counterfactually deployed -- the address is deterministic
            and can receive funds before on-chain deployment. Deployment happens
            automatically when the first UserOperation is sent.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`const BASE_URL = "${docsConfig.apiUrl}/v1";
const API_KEY = process.env.BOOTNODE_API_KEY!;

// Create a smart account
async function createSmartAccount(ownerAddress: string, chain: string) {
  const res = await fetch(\`\${BASE_URL}/wallets/create\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({
      owner: ownerAddress,
      chain,
    }),
  });

  const wallet = await res.json();
  console.log("Smart account address:", wallet.address);
  console.log("Status:", wallet.status); // "counterfactual"
  return wallet;
}

// The smart account address is deterministic:
// Same owner + same chain + same salt = same address every time.
const account = await createSmartAccount(
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "base"
);
// => { address: "0x7A0b...ABCD", status: "counterfactual", ... }`}</code>
          </pre>
        </section>

        {/* Step 2 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">2</Badge>
            <h2 className="text-2xl font-semibold">Send a UserOperation</h2>
          </div>
          <p className="text-muted-foreground">
            A UserOperation is the ERC-4337 equivalent of a transaction. Build the UserOp,
            estimate gas, sign it, and submit it to the bundler.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`import { encodeFunctionData, parseAbi } from "viem";

const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

// 1. Build the UserOperation
const callData = encodeFunctionData({
  abi: parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]),
  functionName: "transfer",
  args: [
    "0x9876543210abcdef9876543210abcdef98765432" as \`0x\${string}\`,
    1000000n, // 1 USDC
  ],
});

const userOp = {
  sender: account.address,
  nonce: "0x0",
  initCode: "0x", // Empty if already deployed
  callData,
  callGasLimit: "0x0",       // Will be estimated
  verificationGasLimit: "0x0", // Will be estimated
  preVerificationGas: "0x0",   // Will be estimated
  maxFeePerGas: "0x0",        // Will be estimated
  maxPriorityFeePerGas: "0x0", // Will be estimated
  paymasterAndData: "0x",
  signature: "0x",
};

// 2. Estimate gas via the bundler
const estimateRes = await fetch(\`\${BASE_URL}/bundler/base/mainnet\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_estimateUserOperationGas",
    params: [userOp, ENTRY_POINT],
  }),
});

const gasEstimate = await estimateRes.json();
console.log("Gas estimate:", gasEstimate.result);
// => {
//   callGasLimit: "0x30d40",
//   verificationGasLimit: "0x186a0",
//   preVerificationGas: "0xc350"
// }

// 3. Fill in gas values
userOp.callGasLimit = gasEstimate.result.callGasLimit;
userOp.verificationGasLimit = gasEstimate.result.verificationGasLimit;
userOp.preVerificationGas = gasEstimate.result.preVerificationGas;
userOp.maxFeePerGas = "0x59682f00";       // 1.5 gwei
userOp.maxPriorityFeePerGas = "0x3b9aca00"; // 1 gwei

// 4. Sign the UserOperation (using owner's private key)
// In production, use a proper signing library like viem or ethers
// userOp.signature = await signUserOp(userOp, ownerPrivateKey);

// 5. Submit to the bundler
const sendRes = await fetch(\`\${BASE_URL}/bundler/base/mainnet\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "eth_sendUserOperation",
    params: [userOp, ENTRY_POINT],
  }),
});

const sendResult = await sendRes.json();
const userOpHash = sendResult.result;
console.log("UserOp hash:", userOpHash);
// => "0x1234567890abcdef..."

// 6. Wait for receipt
const receiptRes = await fetch(\`\${BASE_URL}/bundler/base/mainnet\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 3,
    method: "eth_getUserOperationReceipt",
    params: [userOpHash],
  }),
});

const receipt = await receiptRes.json();
console.log("Receipt:", receipt.result);
// => { success: true, actualGasUsed: "0x5208", ... }`}</code>
          </pre>
        </section>

        {/* Step 3 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">3</Badge>
            <h2 className="text-2xl font-semibold">Use Paymaster for Gas Sponsorship</h2>
          </div>
          <p className="text-muted-foreground">
            Sponsor gas for your users so they never need to hold ETH. Create a gas policy,
            then request paymaster data before sending the UserOp.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`// 1. Create a gas policy (one-time setup)
const policyRes = await fetch(\`\${BASE_URL}/gas/policies\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  },
  body: JSON.stringify({
    name: "My App Free Gas",
    chain: "base",
    rules: {
      max_gas_usd: "0.50",        // Max $0.50 per operation
      max_per_user_per_day: 20,    // 20 free ops per user per day
      allowed_contracts: [         // Only these contracts
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      ],
    },
  }),
});

const policy = await policyRes.json();
console.log("Policy ID:", policy.id);
// => "gp_x1y2z3w4v5u6"

// 2. Request sponsorship for a UserOp
const sponsorRes = await fetch(\`\${BASE_URL}/gas/sponsor\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  },
  body: JSON.stringify({
    chain: "base",
    policy_id: policy.id,
    user_operation: userOp,
  }),
});

const sponsorData = await sponsorRes.json();
console.log("Sponsored gas cost:", sponsorData.sponsored_gas_usd);
// => "$0.03"

// 3. Attach paymaster data to the UserOp
userOp.paymasterAndData = sponsorData.paymasterData;

// 4. Sign and send as before
// The user's transaction is now completely gas-free.`}</code>
          </pre>
        </section>

        {/* Step 4 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">4</Badge>
            <h2 className="text-2xl font-semibold">Batch Transactions</h2>
          </div>
          <p className="text-muted-foreground">
            Smart accounts can execute multiple calls in a single UserOperation.
            This is useful for approve + swap, multi-send, or any multi-step workflow.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`import { encodeFunctionData, parseAbi, encodeAbiParameters } from "viem";

const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);

// Smart account executeBatch ABI
const executeBatchAbi = parseAbi([
  "function executeBatch(address[] targets, uint256[] values, bytes[] calldata)",
]);

// Build batch: approve + transfer in one UserOp
const targets = [
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
];

const values = [0n, 0n]; // No ETH value for ERC-20 calls

const calls = [
  // First: approve spender for 1000 USDC
  encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [
      "0xDEF1234567890abcdef1234567890abcDEF12345" as \`0x\${string}\`,
      1000000000n, // 1000 USDC
    ],
  }),
  // Second: transfer 500 USDC to recipient
  encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [
      "0x9876543210abcdef9876543210abcdef98765432" as \`0x\${string}\`,
      500000000n, // 500 USDC
    ],
  }),
];

// Encode the batch call
const batchCallData = encodeFunctionData({
  abi: executeBatchAbi,
  functionName: "executeBatch",
  args: [
    targets as readonly \`0x\${string}\`[],
    values,
    calls as readonly \`0x\${string}\`[],
  ],
});

// Use batchCallData as the callData in your UserOperation
const batchUserOp = {
  sender: account.address,
  nonce: "0x1",
  initCode: "0x",
  callData: batchCallData,
  // ... gas fields, signature, etc.
};

// Estimate, sponsor, sign, and send as before.
// Both approve + transfer execute atomically in one transaction.`}</code>
          </pre>
        </section>

        {/* Bundler Methods */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Bundler JSON-RPC Methods</h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Method</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">eth_sendUserOperation</td>
                  <td className="p-3 text-muted-foreground">Submit a UserOp to the bundler mempool</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">eth_estimateUserOperationGas</td>
                  <td className="p-3 text-muted-foreground">Estimate gas for a UserOp</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">eth_getUserOperationByHash</td>
                  <td className="p-3 text-muted-foreground">Get UserOp details by hash</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">eth_getUserOperationReceipt</td>
                  <td className="p-3 text-muted-foreground">Get execution receipt for a UserOp</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">eth_supportedEntryPoints</td>
                  <td className="p-3 text-muted-foreground">List supported EntryPoint contract addresses</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Supported Chains */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Supported Chains for ERC-4337</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {[
                  "Ethereum", "Base", "Arbitrum", "Optimism", "Polygon",
                  "Avalanche C-Chain", "BNB Smart Chain", "Lux Network",
                  "Linea", "Scroll", "zkSync Era", "Polygon zkEVM",
                ].map((chain) => (
                  <Badge key={chain} variant="secondary">{chain}</Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Testnet support available on Sepolia, Base Sepolia, Arbitrum Sepolia,
                and all major testnet networks.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Next Steps */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Next Steps</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Smart Wallets", href: "/docs/wallets/quickstart", desc: "Create and manage smart wallets" },
              { title: "API Reference", href: "/docs/api", desc: "Full bundler and gas API docs" },
              { title: "SDKs", href: "/docs/sdks", desc: "Libraries with built-in AA support" },
              { title: "Examples", href: "/docs/examples", desc: "Gasless transaction examples" },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors group"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </DocsLayout>
  )
}
