# Development Prompts & Architecture Reference Catalog

This document consolidates all prompts, specifications, system instructions, tool prompts, and user requests utilized across the development and operation of the **HDB Resale & OneMap SG Intelligence Platform**.

---

## 1. Core Development Prompts & User Directives

### 1.1 MCP Server Implementation (`api/mcp.js`)
**Objective**: Build a Model Context Protocol (MCP) server endpoint compliant with the Streamable HTTP transport specification to expose Singapore public data to AI agents.

**Development Directives**:
```text
Create an MCP server endpoint at /api/mcp (and /api/mcp.js for Vercel serverless deployment) using @modelcontextprotocol/sdk.
- Transport: Use StreamableHTTPServerTransport with JSON response support and stateless configuration.
- Implement 3 tools with Zod input schemas, descriptions, and readOnlyHint annotations:
  1. t3_search_address: Singapore address, postal code, and coordinate search using OneMap Search API.
  2. t3_route_between: Point-to-point multi-modal routing (pt, walk, cycle, drive) with step instructions and duration using OneMap Routing API.
  3. t3_resale_lookup: Query recent Singapore HDB resale transactions with town, flat_type, and max_price filters using official data.gov.sg APIs.
- Output formatting: Structure all tool responses with explicit data source and fetched_at ISO timestamp.
- Route handling: Support both GET and POST requests, handle CORS headers, and ensure clean session teardown.
```

---

### 1.2 Autonomous MCP Agent Endpoint (`POST /api/ask`)
**Objective**: Build a serverless agent endpoint that dynamically connects to one or more MCP servers, converts tools to Gemini-compatible declarations, and executes multi-step tool calls.

**Development Directives**:
```text
Implement POST /api/ask using @google/genai and @modelcontextprotocol/sdk:
- Validation:
  * Verify GEMINI_API_KEY is present; if missing, return HTTP 503 {"error": "GEMINI_API_KEY is not set. Add it in Vercel and redeploy."}.
  * Validate question payload (1 to 500 characters); return HTTP 400 on error.
- Multi-Server MCP Orchestration:
  * Parse MCP_SERVERS environment variable (comma-separated URLs, defaulting to local /api/mcp and external Sandra MCP).
  * Connect to each server using StreamableHTTPClientTransport with an 8-second timeout.
  * If any server fails to connect, record it in an 'unavailable' list with failure reason and proceed with remaining servers.
- Tool Conversion & Execution:
  * Use mcpToTool from @google/genai to bridge MCP tools to Gemini function calling.
  * Use model 'gemini-3.8-flash' with automatic function calling (maximumRemoteCalls: 6).
  * Handle rate limiting (HTTP 429/503/502) with exponential backoff and jitter across up to 5 retries.
- Output Structure:
  * Extract executed tool calls (name, args, failed status) from automaticFunctionCallingHistory.
  * Return HTTP 200 with { answer, tool_calls, unavailable, model: "gemini-3.8-flash", answered_at }.
  * Always close client transports in a finally block to avoid resource leaks.
```

---

### 1.3 Agent System Instruction
**Exact system instruction passed to `gemini-3.8-flash` in `api/ask.js`**:

```text
answer only from tool results; give the source and the fetched_at time for every figure; if a tool returns an error or nothing, say so in one sentence and do not guess; at most 120 words.
```

**Guardrail Principles**:
- **Fact Grounding**: Strictly zero hallucination; the agent is prohibited from drawing on training-data memory for prices or routes.
- **Provenance & Recency**: Mandatory inclusion of upstream source name and ISO `fetched_at` timestamp for each metric.
- **Explicit Failure State**: Deterministic one-sentence acknowledgment if upstream APIs return empty or error status.
- **Conciseness**: Maximum response length capped at 120 words.

---

### 1.4 Frontend Ask Panel (`src/components/AskPanel.tsx`)
**Objective**: Develop an interactive agent interface allowing users to pose natural language queries, inspect tool execution, and monitor server status.

**Development Directives**:
```text
Build a responsive React component for the Ask Agent feature:
- Navigation: Add Tab 06 ('Ask Agent') in Header.tsx and a launcher banner on Tab 01 Explorer.
- Input Controls: Textarea with real-time character counter (0/500), submit button with loading spinner, and quick-prompt chips.
- Results Display:
  * Markdown/formatted answer card with one-click copy to clipboard, model badge, and timestamp.
  * Tool Execution Audit Trail: Ordered list of tools called, collapsible JSON arguments, and success/failed badges.
  * Server Availability Banner: Warning card showing any unreachable MCP servers and failure reasons.
- Accessibility & Design: Support dark/light mode, mobile responsive layout, and keyboard submission (Cmd/Ctrl + Enter).
```

---

### 1.5 Browser Navigation & Discovery Fix for MCP Endpoint
**User Request**:
```text
when I navigate https://hdb-price.vercel.app/api/mcp/ 
I got the an error, {"jsonrpc":"2.0","error":{"code":-32000,"message":"Method not allowed"},"id":null}
fix the error
```

**Resolution & Specification**:
```text
In api/mcp.js and server.ts:
- Differentiate between MCP client requests and human browser navigation:
  * If req.method === 'GET' and Accept does NOT include 'text/event-stream':
    - If Accept includes 'text/html': Serve an HTML status dashboard showing server status (Online & Ready), version, published tools, and connection URL.
    - If Accept includes 'application/json' or general GET: Return HTTP 200 JSON discovery payload with server metadata and tool schemas.
  * If req.method === 'GET' and Accept includes 'text/event-stream': Delegate to StreamableHTTPServerTransport for SSE streaming.
  * If req.method === 'POST': Delegate to StreamableHTTPServerTransport for JSON-RPC message processing.
- Route registration: In server.ts, bind app.all('/api/mcp') and app.all('/api/mcp/') to handle trailing slashes seamlessly.
```

---

### 1.6 Git Repository Synchronization & Deployment
**User Directives**:
```text
git push https://<GITHUB_TOKEN>@github.com/xk3lvin/hdb-price.git
save the used prompts to the prompts.md to the codebase
consolidate the development prompts to prompts.md
```

**Workflow Principles**:
- Maintain pristine git history on `main` branch.
- Verify zero build and lint errors (`compile_applet`, `lint_applet`) prior to push.
- Keep repository synchronized with remote origin at `https://github.com/xk3lvin/hdb-price.git`.

---

## 2. Interactive UI Sample Prompts

These prompts are embedded as interactive suggestion chips in the user interface:

### 2.1 Town Resale Pricing
```text
What is the recent resale price of a 4-room flat in Tampines?
```
- **Primary Tool**: `t3_resale_lookup`
- **Arguments**: `{"town": "TAMPINES", "flat_type": "4 ROOM"}`
- **Expected Synthesis**: Up to 20 recent transactions, median price range, block numbers, lease remaining, and `data.gov.sg` citation.

### 2.2 Address Geocoding & Postal Search
```text
Search address and postal code for 101 Ang Mo Kio Ave 3
```
- **Primary Tool**: `t3_search_address`
- **Arguments**: `{"query": "101 Ang Mo Kio Ave 3"}`
- **Expected Synthesis**: Address details, postal code, block number, latitude/longitude, and `OneMap Search API` citation.

### 2.3 Multi-Modal Route Calculation
```text
What walking route is available from 1.3698,103.8400 to 1.3500,103.8500?
```
- **Primary Tool**: `t3_route_between`
- **Arguments**: `{"start": "1.3698,103.8400", "end": "1.3500,103.8500", "mode": "walk"}`
- **Expected Synthesis**: Turn-by-turn directions, total distance (m), estimated walking duration (s), and `OneMap Routing Service` citation.

### 2.4 Budget-Constrained Resale Search
```text
What are the most recent 3-room HDB transactions under $450,000 in Bedok?
```
- **Primary Tool**: `t3_resale_lookup`
- **Arguments**: `{"town": "BEDOK", "flat_type": "3 ROOM", "max_price": 450000}`
- **Expected Synthesis**: Filtered transactions within the $450k cap, streets/blocks, remaining lease, and timestamps.

---

## 3. Evaluation & Benchmark Test Prompts

Used during automated and manual testing to verify agent reasoning, multi-step tool calls, and error handling:

| Scenario | Test Prompt | Expected Execution Sequence |
|---|---|---|
| **Multi-Step Composition** | `What are recent 5-room resale transactions near 101 Ang Mo Kio Avenue 3?` | 1. `t3_search_address("101 Ang Mo Kio Avenue 3")`<br>2. `t3_resale_lookup(town="ANG MO KIO", flat_type="5 ROOM")`<br>3. Synthesize combined result. |
| **Public Transit Routing** | `How can I travel by public transport from Tampines MRT (1.3533, 103.9452) to Bedok Mall (1.3240, 103.9298)?` | `t3_route_between(start="1.3533,103.9452", end="1.3240,103.9298", mode="pt")` |
| **Cycling Route** | `Can I cycle from Bishan Park (1.3620,103.8465) to Marina Bay (1.2840,103.8600)?` | `t3_route_between(mode="cycle", ...)` |
| **Negative / Out-of-Bounds** | `What is the average home price in Los Angeles?` | Agent declines to guess, notes tools cover Singapore HDB and OneMap data only. |
| **Invalid Input Validation** | Empty prompt or `>500` characters | API returns HTTP 400 with descriptive error message without invoking LLM. |
| **Missing API Key** | `POST /api/ask` without `GEMINI_API_KEY` | API returns HTTP 503 with setup instructions. |

---

## 4. MCP Server Tool Registration Prompts & Schemas

The prompt descriptions registered with the `McpServer` instance in `api/mcp.js`:

### 4.1 `t3_search_address`
```text
Returns up to 5 matching Singapore locations with their formatted addresses, postal codes, and coordinates. Upstream data is fetched directly from the Singapore OneMap Search API. Use this tool when you need to resolve a Singapore postal code, address, or landmark to geographic coordinates. It does not provide driving or transit navigation routes between places.
```
- **Input Parameter**: `query` (string, min 1) — Search text for a Singapore address, postal code, road name, or building name (e.g. `'101 Ang Mo Kio'` or `'560101'`).
- **Annotations**: `readOnlyHint: true`, `openWorldHint: true`.

### 4.2 `t3_route_between`
```text
Returns route navigation details, step-by-step directions, estimated transit duration, and travel distance between two coordinates. Upstream routing data is computed by the Singapore OneMap Routing Service API. Use this tool when you need travel time or point-to-point directions across Singapore by public transport, walking, cycling, or driving. It does not include live road traffic camera feeds or ERP toll gantries.
```
- **Input Parameters**:
  * `start` (string) — Starting location formatted as `'latitude,longitude'` coordinates (e.g. `'1.369792,103.839958'`).
  * `end` (string) — Destination location formatted as `'latitude,longitude'` coordinates (e.g. `'1.300000,103.850000'`).
  * `mode` (enum: `'pt'` | `'walk'` | `'cycle'` | `'drive'`) — Mode of transportation.
- **Annotations**: `readOnlyHint: true`, `openWorldHint: true`.

### 4.3 `t3_resale_lookup`
```text
Returns up to 20 recent Singapore HDB resale flat transactions sorted newest first, including sale price, town, flat model, floor area, and remaining lease. Upstream records are read directly from the official data.gov.sg HDB Resale Flat Prices public dataset. Use this tool when analyzing housing market pricing, comparing recent resale transactions, or finding flats within a target budget. It does not cover private condominiums, executive condominiums before privatization, or commercial property.
```
- **Input Parameters**:
  * `town` (string, optional) — Town name in Singapore to filter transactions by (e.g. `'ANG MO KIO'`, `'BEDOK'`, `'TAMPINES'`).
  * `flat_type` (string, optional) — HDB flat type filter (e.g. `'2 ROOM'`, `'3 ROOM'`, `'4 ROOM'`, `'5 ROOM'`, `'EXECUTIVE'`).
  * `max_price` (number, optional) — Maximum resale transaction price in SGD to filter transactions (e.g. `600000`).
- **Annotations**: `readOnlyHint: true`, `openWorldHint: true`.
