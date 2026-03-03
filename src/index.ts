import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerTools } from "./tools.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

// Middlewares
app.use(cors());
// NOTE: Do NOT use express.json() here — the MCP SDK's handlePostMessage reads the raw stream.

// Auth Middleware for MCP Client
const authMiddleware = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    if (!AUTH_TOKEN) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (token !== AUTH_TOKEN) {
        return res.status(401).json({ error: "Unauthorized token" });
    }

    next();
};

// Store active transports by session ID
const activeTransports = new Map<string, SSEServerTransport>();

// SSE Endpoint for Client Connection
app.get("/sse", authMiddleware, async (req, res) => {
    console.log("Client connecting to SSE...");

    // Set SSE headers explicitly to ensure compatibility with proxies
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
    res.flushHeaders();

    const server = new Server(
        {
            name: "seedance-video-mcp",
            version: "1.0.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    registerTools(server);

    const sessionId = Math.random().toString(36).substring(7);
    const transport = new SSEServerTransport("/message", res);
    activeTransports.set(sessionId, transport);

    res.on("close", () => {
        console.log(`SSE connection closed for session ${sessionId}`);
        activeTransports.delete(sessionId);
    });

    await server.connect(transport);
    console.log(`SSE connection established for session ${sessionId}`);
});

// HTTP POST Endpoint for Client Messages
app.post("/message", authMiddleware, async (req, res) => {
    const transport = Array.from(activeTransports.values())[0];

    if (!transport) {
        return res.status(503).json({ error: "No active SSE connection" });
    }
    await transport.handlePostMessage(req, res);
});

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "seedance-video-mcp", version: "1.0.0" });
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`\n🎬 Seedance MCP Server listening on port ${PORT}`);
    console.log(`   SSE Endpoint:     http://localhost:${PORT}/sse`);
    console.log(`   Message Endpoint: http://localhost:${PORT}/message`);
    console.log(`   Health Check:     http://localhost:${PORT}/health`);
    if (AUTH_TOKEN) {
        console.log(`   Authentication:   ENABLED (Bearer token required)`);
    } else {
        console.log(`   Authentication:   DISABLED`);
    }
    if (!process.env.ARK_API_KEY) {
        console.warn(`\n⚠️  WARNING: ARK_API_KEY is not set! Copy .env.example to .env and fill in your API key.`);
    }
    console.log("");
});
