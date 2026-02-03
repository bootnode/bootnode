import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DocsLayout } from "@/components/docs-layout"
import { ArrowRight } from "lucide-react"

export const metadata = {
  title: "Smart Wallets Quickstart",
  description: "Create and use ERC-4337 smart wallets with Bootnode.",
}

export default function WalletsQuickstartPage() {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">Smart Wallets Quickstart</h1>
          <p className="text-lg text-muted-foreground">
            Create ERC-4337 smart wallets and send gasless transactions in a Next.js app.
            Smart wallets are counterfactually deployed -- they exist at a deterministic address
            before any on-chain deployment, and are deployed automatically when the first
            transaction is sent.
          </p>
        </div>

        {/* Prerequisites */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Prerequisites</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>A Bootnode API key (get one at <Link href="https://dashboard.bootnode.dev" className="text-primary underline underline-offset-4">dashboard.bootnode.dev</Link>)</li>
            <li>Node.js 18+ installed</li>
            <li>Basic familiarity with Next.js and TypeScript</li>
          </ul>
        </section>

        {/* Step 1 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">1</Badge>
            <h2 className="text-2xl font-semibold">Create a Smart Wallet</h2>
          </div>
          <p className="text-muted-foreground">
            Call the wallet creation endpoint. You provide an owner address (the EOA that
            controls this smart wallet), and Bootnode returns the deterministic smart wallet
            address.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`// lib/bootnode.ts
const BOOTNODE_API_KEY = process.env.BOOTNODE_API_KEY!;
const BASE_URL = "https://api.bootnode.dev/v1";

export async function createSmartWallet(ownerAddress: string, chain: string) {
  const res = await fetch(\`\${BASE_URL}/wallets/create\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": BOOTNODE_API_KEY,
    },
    body: JSON.stringify({
      owner: ownerAddress,
      chain: chain,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(\`Failed to create wallet: \${error.error.message}\`);
  }

  return res.json();
}

// Usage:
// const wallet = await createSmartWallet(
//   "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
//   "base"
// );
// console.log(wallet.address);
// => "0x7A0b3e4C5F1234567890abcdef1234567890ABCD"`}</code>
          </pre>
        </section>

        {/* Step 2 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">2</Badge>
            <h2 className="text-2xl font-semibold">Get Wallet Details</h2>
          </div>
          <p className="text-muted-foreground">
            Retrieve the wallet address and deployment status at any time.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`export async function getWallet(address: string) {
  const res = await fetch(\`\${BASE_URL}/wallets/\${address}\`, {
    headers: { "X-API-Key": BOOTNODE_API_KEY },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(\`Failed to get wallet: \${error.error.message}\`);
  }

  return res.json();
}

// Response shape:
// {
//   "address": "0x7A0b...ABCD",
//   "owner": "0xd8dA...6045",
//   "chain": "base",
//   "status": "counterfactual",    // or "deployed"
//   "factory": "0x5FF1...2789",
//   "nonce": 0,
//   "created_at": "2026-01-15T10:30:00Z"
// }`}</code>
          </pre>
        </section>

        {/* Step 3 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">3</Badge>
            <h2 className="text-2xl font-semibold">Fund the Wallet</h2>
          </div>
          <p className="text-muted-foreground">
            Before sending transactions without gas sponsorship, your smart wallet needs
            funds. Send ETH (or the native token) to the smart wallet address from any
            wallet or exchange. The address works even before on-chain deployment.
          </p>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-3">
                Alternatively, use gas sponsorship to skip funding entirely. See step 4.
              </p>
            </CardContent>
          </Card>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`// Check the wallet balance via RPC
export async function getBalance(address: string, chain: string) {
  const res = await fetch(\`\${BASE_URL}/rpc/\${chain}/mainnet\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": BOOTNODE_API_KEY,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"],
    }),
  });

  const data = await res.json();
  const balanceWei = BigInt(data.result);
  const balanceEth = Number(balanceWei) / 1e18;
  return { wei: balanceWei.toString(), eth: balanceEth.toFixed(6) };
}

// const balance = await getBalance(wallet.address, "base");
// console.log(balance);
// => { wei: "50000000000000000", eth: "0.050000" }`}</code>
          </pre>
        </section>

        {/* Step 4 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">4</Badge>
            <h2 className="text-2xl font-semibold">Send a Gasless Transaction</h2>
          </div>
          <p className="text-muted-foreground">
            Build a UserOperation, get it sponsored by the Bootnode paymaster, and submit
            it through the bundler. The user pays zero gas.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`import { encodeFunctionData, parseAbi } from "viem";

const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

export async function sendGaslessTransfer({
  walletAddress,
  tokenContract,
  to,
  amount,
  chain,
  policyId,
}: {
  walletAddress: string;
  tokenContract: string;
  to: string;
  amount: bigint;
  chain: string;
  policyId: string;
}) {
  // 1. Encode the ERC-20 transfer call
  const callData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [to as \`0x\${string}\`, amount],
  });

  // 2. Build the UserOperation
  const userOp = {
    sender: walletAddress,
    nonce: "0x0", // Bootnode auto-manages nonces
    callData: callData,
    callGasLimit: "0x30000",
    verificationGasLimit: "0x50000",
    preVerificationGas: "0xc350",
    maxFeePerGas: "0x3b9aca00",
    maxPriorityFeePerGas: "0x59682f00",
  };

  // 3. Get paymaster sponsorship
  const sponsorRes = await fetch(\`\${BASE_URL}/gas/sponsor\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": BOOTNODE_API_KEY,
    },
    body: JSON.stringify({
      chain,
      policy_id: policyId,
      user_operation: userOp,
    }),
  });

  const sponsorData = await sponsorRes.json();

  // 4. Send via bundler
  const bundlerRes = await fetch(\`\${BASE_URL}/bundler/\${chain}/mainnet\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": BOOTNODE_API_KEY,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendUserOperation",
      params: [
        {
          ...userOp,
          paymasterAndData: sponsorData.paymasterData,
          signature: "0x", // Sign with owner's key in production
        },
        "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // EntryPoint
      ],
    }),
  });

  const result = await bundlerRes.json();
  return result.result; // UserOperation hash
}

// Usage:
// const opHash = await sendGaslessTransfer({
//   walletAddress: "0x7A0b...ABCD",
//   tokenContract: "0xA0b8...eB48",  // USDC on Base
//   to: "0x9876...5432",
//   amount: 1000000n,                // 1 USDC (6 decimals)
//   chain: "base",
//   policyId: "gp_x1y2z3w4v5u6",
// });
// console.log("UserOp hash:", opHash);`}</code>
          </pre>
        </section>

        {/* Full Next.js Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Full Next.js API Route Example</h2>
          <p className="text-muted-foreground">
            Here is a complete Next.js API route that creates a wallet and sends a
            sponsored transaction:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`// app/api/wallet/create/route.ts
import { NextRequest, NextResponse } from "next/server";

const BOOTNODE_API_KEY = process.env.BOOTNODE_API_KEY!;
const BASE_URL = "https://api.bootnode.dev/v1";

export async function POST(req: NextRequest) {
  const { ownerAddress } = await req.json();

  if (!ownerAddress) {
    return NextResponse.json(
      { error: "ownerAddress is required" },
      { status: 400 }
    );
  }

  // Create the smart wallet
  const walletRes = await fetch(\`\${BASE_URL}/wallets/create\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": BOOTNODE_API_KEY,
    },
    body: JSON.stringify({
      owner: ownerAddress,
      chain: "base",
    }),
  });

  if (!walletRes.ok) {
    const error = await walletRes.json();
    return NextResponse.json(
      { error: error.error.message },
      { status: walletRes.status }
    );
  }

  const wallet = await walletRes.json();

  return NextResponse.json({
    address: wallet.address,
    owner: wallet.owner,
    chain: wallet.chain,
    status: wallet.status,
  });
}`}</code>
          </pre>
        </section>

        {/* Next Steps */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Next Steps</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Account Abstraction", href: "/docs/aa/quickstart", desc: "Deep dive into ERC-4337" },
              { title: "Gas Manager", href: "/docs/api", desc: "Set up gas sponsorship policies" },
              { title: "Webhooks", href: "/docs/webhooks/quickstart", desc: "Monitor wallet activity" },
              { title: "API Reference", href: "/docs/api", desc: "Full wallet API docs" },
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
