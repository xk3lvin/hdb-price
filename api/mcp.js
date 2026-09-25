/**
 * MCP (Model Context Protocol) Server endpoint
 * Exposes Singapore OneMap geocoding, routing, and HDB resale data tools
 * over Streamable HTTP for external AI agents.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { searchOneMap, routeOneMap } from '../lib/onemap.js';
import { fetchHdbResale } from '../lib/hdb.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Last-Event-ID, Mcp-Session-Id, Mcp-Protocol-Version');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    } else {
      res.writeHead(200);
      return res.end();
    }
  }

  const acceptHeader = (req.headers && (req.headers['accept'] || req.headers['Accept'])) || '';

  // If a browser or API client navigates via GET without requesting an SSE event-stream,
  // return a 200 OK discovery/status response instead of a 405 error.
  if (req.method === 'GET' && !acceptHeader.includes('text/event-stream')) {
    const serverInfo = {
      name: 't3-server',
      version: '1.0.0',
      status: 'online',
      protocol: 'mcp',
      transport: 'Streamable HTTP',
      message: 'Singapore OneMap & HDB Resale MCP Server is online and ready for agent connections.',
      endpoint: '/api/mcp',
      tools: [
        {
          name: 't3_search_address',
          description:
            'Returns up to 5 matching Singapore locations with their formatted addresses, postal codes, and coordinates from Singapore OneMap Search API.',
          parameters: {
            query: 'string (Search text for a Singapore address, postal code, road name, or building name)',
          },
        },
        {
          name: 't3_route_between',
          description:
            'Returns route navigation details, step-by-step directions, estimated transit duration, and travel distance between two coordinates from Singapore OneMap Routing Service API.',
          parameters: {
            start: "string (Starting coordinates 'lat,lng')",
            end: "string (Destination coordinates 'lat,lng')",
            mode: "enum ('pt', 'walk', 'cycle', 'drive')",
          },
        },
        {
          name: 't3_resale_lookup',
          description:
            'Returns up to 20 recent Singapore HDB resale flat transactions sorted newest first, including sale price, town, flat model, floor area, and remaining lease from data.gov.sg.',
          parameters: {
            town: 'string (optional town name like TAMPINES, BEDOK)',
            flat_type: 'string (optional flat type like 4 ROOM, 3 ROOM)',
            max_price: 'number (optional maximum resale price)',
          },
        },
      ],
    };

    if (acceptHeader.includes('text/html')) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Server - Singapore OneMap &amp; HDB Resale</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem 1rem; line-height: 1.5; }
    .card { max-width: 720px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 2rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
    h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
    p { color: #94a3b8; font-size: 0.9rem; margin-top: 0; }
    .tool { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 1rem; margin-top: 1rem; }
    .tool-name { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.95rem; font-weight: 700; color: #f43f5e; }
    .tool-desc { font-size: 0.85rem; color: #cbd5e1; margin: 0.4rem 0 0; }
    .code { font-family: monospace; background: #020617; padding: 0.5rem 0.8rem; border-radius: 8px; font-size: 0.8rem; color: #38bdf8; margin-top: 0.5rem; display: block; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> Online &amp; Ready</div>
    <h1>t3-server (MCP Server)</h1>
    <p>Model Context Protocol (MCP) Streamable HTTP endpoint for Singapore OneMap and data.gov.sg HDB Resale services.</p>
    <div style="margin-top: 1.5rem;">
      <strong style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Published Tools (3)</strong>
      <div class="tool">
        <div class="tool-name">t3_search_address</div>
        <div class="tool-desc">Resolves Singapore addresses, postal codes, and landmarks to coordinates using OneMap Search API.</div>
      </div>
      <div class="tool">
        <div class="tool-name">t3_route_between</div>
        <div class="tool-desc">Calculates routes, travel time, and step-by-step directions (pt, walk, cycle, drive) using OneMap Routing Service.</div>
      </div>
      <div class="tool">
        <div class="tool-name">t3_resale_lookup</div>
        <div class="tool-desc">Fetches latest Singapore HDB resale flat transactions with town, flat type, and price filters from data.gov.sg.</div>
      </div>
    </div>
    <div style="margin-top: 1.5rem;">
      <strong style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Connect via Agent / Client</strong>
      <span class="code">Endpoint URL: https://hdb-price.vercel.app/api/mcp</span>
    </div>
  </div>
</body>
</html>`;
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
      if (typeof res.status === 'function') {
        return res.status(200).send(html);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(html);
      }
    }

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(serverInfo);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(serverInfo));
    }
  }

  // Reject unsupported HTTP methods
  if (req.method !== 'POST' && req.method !== 'GET') {
    const errorBody = {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed' },
      id: null,
    };
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(405).json(errorBody);
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(errorBody));
    }
  }

  // Ensure Accept header includes text/event-stream and application/json for Streamable HTTP transport compliance
  if (req.headers) {
    const accept = req.headers['accept'] || req.headers['Accept'];
    if (!accept) {
      req.headers['accept'] = 'application/json, text/event-stream';
    } else {
      const parts = [];
      if (!accept.includes('application/json')) parts.push('application/json');
      if (!accept.includes('text/event-stream')) parts.push('text/event-stream');
      if (parts.length > 0) {
        req.headers['accept'] = accept + ', ' + parts.join(', ');
      }
    }
  }

  // Parse body if supplied as raw string
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch {}
  }

  const server = new McpServer({ name: 't3-server', version: '1.0.0' });

  // Tool 1: t3_search_address
  server.registerTool(
    't3_search_address',
    {
      description:
        'Returns up to 5 matching Singapore locations with their formatted addresses, postal codes, and coordinates. Upstream data is fetched directly from the Singapore OneMap Search API. Use this tool when you need to resolve a Singapore postal code, address, or landmark to geographic coordinates. It does not provide driving or transit navigation routes between places.',
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("Search text for a Singapore address, postal code, road name, or building name (e.g. '101 Ang Mo Kio' or '560101')."),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async ({ query }) => {
      try {
        const res = await searchOneMap(query);
        if (!res.ok) {
          return {
            isError: true,
            content: [{ type: 'text', text: `OneMap search API failed with status ${res.status}.` }],
          };
        }

        const matches = (res.data?.results || []).slice(0, 5).map(r => ({
          search_val: r.SEARCHVAL || '',
          building: r.BUILDING || '',
          block: r.BLK_NO || '',
          road_name: r.ROAD_NAME || '',
          address: r.ADDRESS || '',
          postal_code: r.POSTAL || '',
          latitude: r.LATITUDE || '',
          longitude: r.LONGITUDE || '',
          x: r.X || '',
          y: r.Y || '',
        }));

        const result = {
          source: 'OneMap Search API',
          fetched_at: new Date().toISOString(),
          items: matches,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch {
        return {
          isError: true,
          content: [{ type: 'text', text: 'OneMap search API failed with status 500.' }],
        };
      }
    }
  );

  // Tool 2: t3_route_between
  server.registerTool(
    't3_route_between',
    {
      description:
        'Returns route navigation details, step-by-step directions, estimated transit duration, and travel distance between two coordinates. Upstream routing data is computed by the Singapore OneMap Routing Service API. Use this tool when you need travel time or point-to-point directions across Singapore by public transport, walking, cycling, or driving. It does not include live road traffic camera feeds or ERP toll gantries.',
      inputSchema: {
        start: z
          .string()
          .describe("Starting location formatted as 'latitude,longitude' coordinates (e.g. '1.369792,103.839958')."),
        end: z
          .string()
          .describe("Destination location formatted as 'latitude,longitude' coordinates (e.g. '1.300000,103.850000')."),
        mode: z
          .enum(['pt', 'walk', 'cycle', 'drive'])
          .describe("Mode of transportation: 'pt' for public transit, 'walk' for walking, 'cycle' for cycling, or 'drive' for driving."),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async ({ start, end, mode }) => {
      try {
        const res = await routeOneMap({ start, end, mode });
        if (!res.ok) {
          return {
            isError: true,
            content: [{ type: 'text', text: `OneMap route API failed with status ${res.status}.` }],
          };
        }

        const data = res.data || {};
        let items = [];

        if (Array.isArray(data.route_instructions) && data.route_instructions.length > 0) {
          items = data.route_instructions.slice(0, 20).map((step, idx) => ({
            step_number: idx + 1,
            instruction: Array.isArray(step) ? step[0] : (step.instruction || String(step)),
            distance_meters: Array.isArray(step) ? step[1] : (step.distance || 0),
            duration_seconds: Array.isArray(step) ? step[2] : (step.duration || 0),
          }));
        } else if (Array.isArray(data.plan?.itineraries) && data.plan.itineraries.length > 0) {
          items = data.plan.itineraries.slice(0, 20).map((itin, idx) => ({
            itinerary_number: idx + 1,
            duration_seconds: itin.duration,
            walk_time_seconds: itin.walkTime,
            transit_time_seconds: itin.transitTime,
            legs: (itin.legs || []).slice(0, 5),
          }));
        } else {
          items = [
            {
              status_message: data.status_message || data.status || 'Route calculated',
              summary: data.route_summary || data.summary || null,
            },
          ];
        }

        const result = {
          source: 'OneMap Routing Service API',
          fetched_at: new Date().toISOString(),
          summary: data.route_summary || null,
          items: items.slice(0, 20),
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch {
        return {
          isError: true,
          content: [{ type: 'text', text: 'OneMap route API failed with status 500.' }],
        };
      }
    }
  );

  // Tool 3: t3_resale_lookup
  server.registerTool(
    't3_resale_lookup',
    {
      description:
        'Returns up to 20 recent Singapore HDB resale flat transactions sorted newest first, including sale price, town, flat model, floor area, and remaining lease. Upstream records are read directly from the official data.gov.sg HDB Resale Flat Prices public dataset. Use this tool when analyzing housing market pricing, comparing recent resale transactions, or finding flats within a target budget. It does not cover private condominiums, executive condominiums before privatization, or commercial property.',
      inputSchema: {
        town: z
          .string()
          .optional()
          .describe("Town name in Singapore to filter transactions by (e.g. 'ANG MO KIO', 'BEDOK', 'TAMPINES')."),
        flat_type: z
          .string()
          .optional()
          .describe("HDB flat type filter (e.g. '2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE')."),
        max_price: z
          .number()
          .optional()
          .describe('Maximum resale transaction price in SGD to filter transactions (e.g. 600000).'),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async ({ town, flat_type, max_price }) => {
      try {
        const res = await fetchHdbResale({ town, flat_type, max_price, limit: 20, sort: 'month desc' });
        if (!res.ok) {
          return {
            isError: true,
            content: [{ type: 'text', text: `data.gov.sg resale API failed with status ${res.status}.` }],
          };
        }

        const result = {
          source: 'data.gov.sg HDB Resale Flat Prices',
          fetched_at: new Date().toISOString(),
          items: (res.records || []).slice(0, 20),
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch {
        return {
          isError: true,
          content: [{ type: 'text', text: 'data.gov.sg resale API failed with status 500.' }],
        };
      }
    }
  );

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on('close', () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
