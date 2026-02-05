import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocsLayout } from "@/components/docs-layout"
import { ArrowRight } from "lucide-react"
import { docsConfig } from "@/lib/docs-config"

export const metadata = {
  title: "ZAP Protocol",
  description: `Native ZAP (Zero-Copy App Proto) support for high-performance AI agent access to ${docsConfig.brandName}.`,
}

export default function ZapQuickstartPage() {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold">ZAP Protocol</h1>
            <Badge variant="secondary">Native</Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            ZAP (Zero-Copy App Proto) is a high-performance binary RPC protocol based on Cap'n Proto.
            {docsConfig.brandName} implements native ZAP - direct Cap'n Proto RPC over TCP for AI agents.
          </p>
        </div>

        {/* Connection */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Connect</h2>
          <p className="text-muted-foreground">
            Connect directly to the native ZAP server:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{docsConfig.zapUrl}</code>
          </pre>
        </section>

        {/* Schema */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Schema</h2>
          <p className="text-muted-foreground">
            ZAP uses a clean, whitespace-significant syntax. No ordinals, no braces, no semicolons.
            Field order determines wire encoding.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`# Structs - field order determines ordinals
struct User
  name Text
  email Text
  age UInt32

# Adding fields is always backwards-compatible
struct User
  name Text
  email Text
  age UInt32
  phone Text       # New field - safe to add
  verified Bool    # New field - safe to add

# Nested structs
struct Metadata
  entries List(Entry)

  struct Entry
    key Text
    value Text

# Enums - value order determines encoding
enum Status
  pending
  active
  completed

# Unions
struct Content
  union data
    text Text
    blob Data
    json Text

# Interfaces with methods
interface Bootnode
  init (client ClientInfo) -> (server ServerInfo)
  listTools () -> (tools ToolList)
  callTool (call ToolCall) -> (result ToolResult)
  rpcCall (request RPCRequest) -> (response RPCResponse)`}</code>
          </pre>
        </section>

        {/* Python Client */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Python Client</h2>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`from hanzo_zap import Client

async with Client.connect("${docsConfig.zapUrl}") as client:
    # Initialize connection
    server_info = await client.init({
        "name": "my-agent",
        "version": "1.0.0"
    })
    print(f"Connected to {server_info.name} v{server_info.version}")

    # List available tools
    tools = await client.list_tools()
    for tool in tools:
        print(f"  - {tool.name}: {tool.description}")

    # Call a tool
    result = await client.call_tool("rpc_call", {
        "chain": "ethereum",
        "method": "eth_blockNumber"
    })
    print(f"Block: {int(result['result'], 16)}")`}</code>
          </pre>
        </section>

        {/* Rust Client */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Rust Client</h2>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`use hanzo_zap::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::connect("${docsConfig.zapUrl}").await?;

    // Initialize
    let server = client.init("my-agent", "1.0.0").await?;
    println!("Connected to {} v{}", server.name, server.version);

    // List tools
    let tools = client.list_tools().await?;
    for tool in tools {
        println!("  - {}: {}", tool.name, tool.description);
    }

    // Call tool
    let result = client.call_tool("rpc_call", serde_json::json!({
        "chain": "ethereum",
        "method": "eth_blockNumber"
    })).await?;
    println!("Result: {:?}", result);

    Ok(())
}`}</code>
          </pre>
        </section>

        {/* Go Client */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Go Client</h2>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`package main

import (
    "context"
    "fmt"
    "log"

    "github.com/hanzo-ai/zap-go"
)

func main() {
    ctx := context.Background()

    client, err := zap.Connect(ctx, "${docsConfig.zapUrl}")
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    // Initialize
    server, err := client.Init(ctx, "my-agent", "1.0.0")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Connected to %s v%s\\n", server.Name, server.Version)

    // List tools
    tools, err := client.ListTools(ctx)
    if err != nil {
        log.Fatal(err)
    }
    for _, tool := range tools {
        fmt.Printf("  - %s: %s\\n", tool.Name, tool.Description)
    }

    // Call tool
    result, err := client.CallTool(ctx, "rpc_call", map[string]any{
        "chain":  "ethereum",
        "method": "eth_blockNumber",
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Result: %v\\n", result)
}`}</code>
          </pre>
        </section>

        {/* Available Tools */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Tools</h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Tool</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "rpc_call", desc: "Execute JSON-RPC on any supported blockchain" },
                  { name: "get_token_balances", desc: "Get ERC-20 token balances for an address" },
                  { name: "get_token_metadata", desc: "Get token metadata (name, symbol, decimals)" },
                  { name: "get_nfts_owned", desc: "Get NFTs owned by an address" },
                  { name: "get_nft_metadata", desc: "Get NFT metadata and attributes" },
                  { name: "create_smart_wallet", desc: "Create ERC-4337 smart wallet" },
                  { name: "get_smart_wallet", desc: "Get smart wallet details" },
                  { name: "create_webhook", desc: "Create webhook for blockchain events" },
                  { name: "list_webhooks", desc: "List configured webhooks" },
                  { name: "delete_webhook", desc: "Delete webhook by ID" },
                  { name: "estimate_gas", desc: "Get current gas prices" },
                ].map((tool) => (
                  <tr key={tool.name} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs">{tool.name}</td>
                    <td className="p-3 text-muted-foreground">{tool.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Available Resources */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Resources</h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">URI</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { uri: "bootnode://chains", desc: "List of all supported blockchain networks" },
                  { uri: "bootnode://usage", desc: "API usage for current billing period" },
                  { uri: "bootnode://config", desc: "Current API configuration and limits" },
                ].map((resource) => (
                  <tr key={resource.uri} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs">{resource.uri}</td>
                    <td className="p-3 text-muted-foreground">{resource.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Code Generation */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Code Generation</h2>
          <p className="text-muted-foreground">
            Download the schema and generate client code for your language:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`# Download the .zap schema (new whitespace-significant format)
curl -H "X-API-Key: YOUR_API_KEY" \\
  ${docsConfig.apiUrl}/v1/zap/schema > bootnode.zap

# Compile to Cap'n Proto
zapc compile bootnode.zap --out=bootnode.capnp

# Generate Python client
zapc generate bootnode.capnp --lang python --out ./gen/

# Generate Rust client
zapc generate bootnode.capnp --lang rust --out ./gen/

# Generate Go client
zapc generate bootnode.capnp --lang go --out ./gen/

# Generate TypeScript client
zapc generate bootnode.capnp --lang typescript --out ./gen/`}</code>
          </pre>
        </section>

        {/* REST Discovery */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">REST Discovery Endpoints</h2>
          <p className="text-muted-foreground">
            Use these REST endpoints for discovery and debugging:
          </p>
          <div className="grid gap-3">
            {[
              { method: "GET", path: "/v1/zap/connect", desc: "Connection info & client examples" },
              { method: "GET", path: "/v1/zap/info", desc: "Server capabilities" },
              { method: "GET", path: "/v1/zap/tools", desc: "Available tools" },
              { method: "GET", path: "/v1/zap/resources", desc: "Available resources" },
              { method: "GET", path: "/v1/zap/schema", desc: ".zap schema (whitespace-significant)" },
              { method: "GET", path: "/v1/zap/schema.capnp", desc: "Compiled .capnp schema" },
              { method: "GET", path: "/v1/zap/health", desc: "Health check" },
            ].map((endpoint) => (
              <div
                key={endpoint.path}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <Badge
                  variant="secondary"
                  className="font-mono"
                >
                  {endpoint.method}
                </Badge>
                <div>
                  <code className="text-sm">{endpoint.path}</code>
                  <p className="text-xs text-muted-foreground">{endpoint.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MCP Compatibility */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">MCP Compatibility</h2>
          <p className="text-muted-foreground">
            ZAP implements a superset of the Model Context Protocol (MCP). All MCP clients can connect
            to ZAP servers, and ZAP extends MCP with:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Binary wire format (Cap'n Proto) for 10-100x faster serialization</li>
            <li>Zero-copy reads for large payloads</li>
            <li>Streaming responses for real-time data</li>
            <li>Native TCP transport (no HTTP overhead)</li>
            <li>Bidirectional communication</li>
          </ul>
        </section>

        {/* Next Steps */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Next Steps</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "API Reference", href: "/docs/api", desc: "Full REST API documentation" },
              { title: "SDKs", href: "/docs/sdks", desc: "Client libraries for every language" },
              { title: "Smart Wallets", href: "/docs/wallets/quickstart", desc: "ERC-4337 account abstraction" },
              { title: "Webhooks", href: "/docs/webhooks/quickstart", desc: "Real-time event notifications" },
            ].map((item) => (
              <Link
                key={item.href}
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
