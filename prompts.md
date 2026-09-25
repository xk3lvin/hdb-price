# Prompts Reference & Catalog

This document records the prompts, system instructions, agent queries, and development requests used throughout the **HDB Resale & OneMap SG Intelligence Platform**.

---

## 1. Agent System Instruction (`api/ask.js`)

Used by the autonomous Gemini 3.8 Flash model when orchestrating tools across live Model Context Protocol (MCP) servers:

```text
answer only from tool results; give the source and the fetched_at time for every figure; if a tool returns an error or nothing, say so in one sentence and do not guess; at most 120 words.
```

### Constraints & Guardrails Enforced:
- **Grounding**: Answers must only draw facts from tool execution outputs (`t3_search_address`, `t3_route_between`, `t3_resale_lookup`, or external MCP servers).
- **Attribution**: Explicitly state the data source (e.g. `data.gov.sg HDB Resale Flat Prices`, `OneMap Search API`, `OneMap Routing Service API`) and the ISO timestamp `fetched_at` for every figure.
- **Fail-safe**: If an upstream tool returns an error or empty result, report it in exactly one sentence without guessing or hallucinating data.
- **Brevity**: Strict limit of at most 120 words.

---

## 2. Interactive UI Sample Prompts (`src/components/AskPanel.tsx`)

Pre-configured prompt chips available to users in the **Ask Agent (Tab 06)** interface:

### Prompt 1: HDB Resale Pricing in Specific Town
```text
What is the recent resale price of a 4-room flat in Tampines?
```
- **Intended Tool**: `t3_resale_lookup`
- **Arguments**: `{"town": "TAMPINES", "flat_type": "4 ROOM"}`
- **Expected Output**: List of latest transactions, prices, blocks, remaining lease, and fetched timestamp.

### Prompt 2: OneMap Geocoding & Postal Code Resolution
```text
Search address and postal code for 101 Ang Mo Kio Ave 3
```
- **Intended Tool**: `t3_search_address`
- **Arguments**: `{"query": "101 Ang Mo Kio Ave 3"}`
- **Expected Output**: Up to 5 matching Singapore locations, formatted address, postal code, block number, coordinates.

### Prompt 3: OneMap Multi-Modal Travel Routing
```text
What walking route is available from 1.3698,103.8400 to 1.3500,103.8500?
```
- **Intended Tool**: `t3_route_between`
- **Arguments**: `{"start": "1.3698,103.8400", "end": "1.3500,103.8500", "mode": "walk"}`
- **Expected Output**: Step-by-step walking directions, estimated duration in seconds, distance in meters.

### Prompt 4: Budget-Constrained Resale Lookup
```text
What are the most recent 3-room HDB transactions under $450,000 in Bedok?
```
- **Intended Tool**: `t3_resale_lookup`
- **Arguments**: `{"town": "BEDOK", "flat_type": "3 ROOM", "max_price": 450000}`
- **Expected Output**: Recent resale records meeting town, room type, and budget ceiling.

---

## 3. Additional Test & Benchmark Prompts

Prompts used to evaluate and test the agent's multi-step decision making, tool fallback, and synthesis capabilities:

### Composite Query (Geocoding + Resale)
```text
What are recent 5-room resale transactions near 101 Ang Mo Kio Avenue 3?
```
- **Execution Plan**:
  1. Calls `t3_search_address` with query `"101 Ang Mo Kio Avenue 3"` to locate town / postal code.
  2. Calls `t3_resale_lookup` with `{"town": "ANG MO KIO", "flat_type": "5 ROOM"}`.
  3. Synthesizes transaction figures with sources and `fetched_at` timestamp.

### Public Transit Navigation Query
```text
How can I travel by public transport from Tampines MRT (1.3533, 103.9452) to Bedok Mall (1.3240, 103.9298)?
```
- **Intended Tool**: `t3_route_between` (`mode: "pt"`)

### Out-of-Bounds & Negative Testing
```text
What is the average price of a penthouse in Beverly Hills?
```
- **Expected Behavior**: Agent indicates that tools cover Singapore HDB and OneMap data only, and refuses to hallucinate external data without guessing.

---

## 4. MCP Server Tool Descriptions & Prompts

The schema descriptions registered in `api/mcp.js` guide Gemini's automatic function calling:

### Tool: `t3_search_address`
```text
Returns up to 5 matching Singapore locations with their formatted addresses, postal codes, and coordinates. Upstream data is fetched directly from the Singapore OneMap Search API. Use this tool when you need to resolve a Singapore postal code, address, or landmark to geographic coordinates. It does not provide driving or transit navigation routes between places.
```

### Tool: `t3_route_between`
```text
Returns route navigation details, step-by-step directions, estimated transit duration, and travel distance between two coordinates. Upstream routing data is computed by the Singapore OneMap Routing Service API. Use this tool when you need travel time or point-to-point directions across Singapore by public transport, walking, cycling, or driving. It does not include live road traffic camera feeds or ERP toll gantries.
```

### Tool: `t3_resale_lookup`
```text
Returns up to 20 recent Singapore HDB resale flat transactions sorted newest first, including sale price, town, flat model, floor area, and remaining lease. Upstream records are read directly from the official data.gov.sg HDB Resale Flat Prices public dataset. Use this tool when analyzing housing market pricing, comparing recent resale transactions, or finding flats within a target budget. It does not cover private condominiums, executive condominiums before privatization, or commercial property.
```

---

## 5. Development Iteration Prompts

The sequence of prompts that shaped the implementation of this application:

1. **MCP Endpoint Implementation**:
   - Create MCP server endpoint (`/api/mcp.js`) running Streamable HTTP with `@modelcontextprotocol/sdk`. Expose tools for Singapore OneMap geocoding, routing, and official data.gov.sg HDB resale flat records.
2. **Autonomous Agent Creation (`POST /api/ask`)**:
   - Build serverless handler in `api/ask.js` using `@google/genai` with `gemini-3.8-flash` and `mcpToTool`. Support connection to MCP servers configured in `MCP_SERVERS`, automatic function calling with history extraction, graceful handling of unavailable servers, input validation, and rate limit retry backoff.
3. **Frontend Agent Panel (`AskPanel.tsx`)**:
   - Create interactive tab in frontend with prompt chips, character limit counter, tool execution audit list with JSON arguments, and error displays.
4. **Browser Navigation Fix on MCP Endpoint**:
   - Fix `GET /api/mcp/` returning HTTP 405 `{"jsonrpc":"2.0","error":{"code":-32000,"message":"Method not allowed"},"id":null}` when navigating in a browser by returning HTTP 200 with an interactive status page and JSON discovery payload.
