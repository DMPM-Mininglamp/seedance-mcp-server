/**
 * Test client for the Seedance MCP Server.
 * Connects via SSE and lists available tools.
 * 
 * Usage: node test.js
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const SSE_URL = process.env.SSE_URL || "http://localhost:3001/sse";

async function main() {
    console.log(`Connecting to Seedance MCP Server at ${SSE_URL}...`);

    const transport = new SSEClientTransport(new URL(SSE_URL));
    const client = new Client({ name: "test-client", version: "1.0.0" });

    await client.connect(transport);
    console.log("✅ Connected!\n");

    // List tools
    const tools = await client.listTools();
    console.log(`Found ${tools.tools.length} tool(s):\n`);
    for (const tool of tools.tools) {
        console.log(`  📦 ${tool.name}`);
        console.log(`     ${tool.description}\n`);
    }

    await client.close();
    console.log("Connection closed.");
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
