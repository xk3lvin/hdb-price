/**
 * Vercel Serverless Function & Express Route: POST /api/ask
 * Answers visitor queries using Gemini and Model Context Protocol (MCP) tools.
 */
import { GoogleGenAI, mcpToTool } from '@google/genai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed. Use POST.',
    });
  }

  // 1. Check GEMINI_API_KEY
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not set. Add it in Vercel and redeploy.',
    });
  }

  // 2. Validate question
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  const question = (
    body?.question ||
    body?.prompt ||
    body?.q ||
    (typeof body === 'string' ? body : '')
  )?.trim();

  if (!question || question.length > 500) {
    return res.status(400).json({
      error: 'Question is required and must not exceed 500 characters.',
    });
  }

  // 3. Connect to MCP servers
  const serverAddresses = (process.env.MCP_SERVERS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const connectedClients = [];
  const unavailable = [];

  await Promise.all(
    serverAddresses.map(async (address) => {
      let client;
      try {
        const url = new URL(address);
        client = new Client({ name: 't3-agent', version: '1.0.0' }, { capabilities: {} });
        const transport = new StreamableHTTPClientTransport(url);

        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('Connection timed out after 8 seconds'));
          }, 8000);

          client
            .connect(transport)
            .then(() => {
              clearTimeout(timer);
              resolve();
            })
            .catch((err) => {
              clearTimeout(timer);
              reject(err);
            });
        });

        connectedClients.push(client);
      } catch (err) {
        if (client) {
          try {
            await client.close();
          } catch {}
        }
        unavailable.push({
          address,
          reason: err?.message || String(err) || 'Failed to connect',
        });
      }
    })
  );

  try {
    const ai = new GoogleGenAI({ apiKey });

    const config = {
      systemInstruction:
        'answer only from tool results; give the source and the fetched_at time for every figure; if a tool returns an error or nothing, say so in one sentence and do not guess; at most 120 words.',
      automaticFunctionCalling: { maximumRemoteCalls: 6 },
    };

    if (connectedClients.length > 0) {
      config.tools = [mcpToTool(...connectedClients)];
    }

    // Call Gemini with automatic function calling, with retries on transient 503 spikes
    let response;
    let lastError;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: question,
          config,
        });
        break;
      } catch (err) {
        lastError = err;
        const isTransient = err?.status === 503 || err?.message?.includes('503') || err?.status === 429;
        if (attempt < 2 && isTransient) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    // 4. Build tool_calls from response.automaticFunctionCallingHistory
    const tool_calls = [];
    const history = response?.automaticFunctionCallingHistory || [];

    const callEntries = [];
    const responseMapById = new Map();
    const responsesByName = new Map();

    for (const turn of history) {
      for (const part of turn.parts || []) {
        if (part.functionCall) {
          callEntries.push(part.functionCall);
        }
        if (part.functionResponse) {
          if (part.functionResponse.id) {
            responseMapById.set(part.functionResponse.id, part.functionResponse);
          }
          const existing = responsesByName.get(part.functionResponse.name) || [];
          existing.push(part.functionResponse);
          responsesByName.set(part.functionResponse.name, existing);
        }
      }
    }

    for (const call of callEntries) {
      let resp = call.id ? responseMapById.get(call.id) : null;
      if (!resp && responsesByName.has(call.name)) {
        const list = responsesByName.get(call.name);
        resp = list.shift();
      }

      const respData = resp?.response;
      let isFailed = false;

      if (respData) {
        if (respData.isError === true || respData.error) {
          isFailed = true;
        } else if (Array.isArray(respData.content)) {
          isFailed = respData.content.some(
            (c) =>
              Boolean(c.isError) ||
              (c.text && (c.text.toLowerCase().includes('failed with status') || c.text.toLowerCase().includes('"iserror":true')))
          );
        } else if (typeof respData === 'string' && respData.toLowerCase().includes('error')) {
          isFailed = true;
        }
      }

      tool_calls.push({
        name: call.name,
        args: call.args || {},
        failed: isFailed,
      });
    }

    return res.status(200).json({
      answer: response?.text || '',
      tool_calls,
      unavailable,
      model: 'gemini-3.8-flash',
      answered_at: new Date().toISOString(),
    });
  } catch (err) {
    const status = err?.status || (typeof err?.statusCode === 'number' ? err.statusCode : 500);
    let oneLineReason = err?.message || 'Gemini request failed';
    const jsonMatch = oneLineReason.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.error?.message) {
          oneLineReason = parsed.error.message;
        }
      } catch {}
    }
    oneLineReason = oneLineReason.split('\n')[0].replace(/^ApiError:\s*/, '').trim();

    return res.status(502).json({
      error: 'Gemini request failed',
      status,
      reason: oneLineReason,
    });
  } finally {
    // Close every client in finally block
    await Promise.all(connectedClients.map((client) => client.close().catch(() => {})));
  }
}
