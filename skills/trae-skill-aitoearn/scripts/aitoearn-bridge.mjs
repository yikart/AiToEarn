#!/usr/bin/env node
/**
 * aitoearn-bridge.mjs — stdio <-> Streamable HTTP bridge for the AiToEarn MCP endpoint.
 *
 * Why this exists
 * ---------------
 * Agent Plugins 1.0.0 does not expand `${VAR}` inside mcp.json headers, and credentials
 * must never be committed as package data. So the remote Streamable HTTP endpoint is
 * reached through a local stdio process that resolves the API key at runtime.
 *
 * Key resolution order (first match wins):
 *   1. process.env[<--env-key>]            (inherited from the client process)
 *   2. config file, path from $AITOEARN_CONFIG
 *   3. ~/.aitoearn/config.json             -> { "AITOEARN_API_KEY": "..." }
 *                                          or { "aitoearn": { "apiKey": "..." } }
 *                                          or { "apiKey": "..." }
 *
 * Usage:
 *   node scripts/aitoearn-bridge.mjs --url https://aitoearn.ai/api/ai/agent/mcp --env-key AITOEARN_API_KEY
 *
 * Protocol: newline-delimited JSON-RPC on stdin/stdout (LSP framing is also accepted).
 * stderr is used for diagnostics only, so stdout stays a clean JSON-RPC channel.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);

function flag(name, fallback = null) {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
}

const URL_TARGET = flag('--url');
const ENV_KEY = flag('--env-key', 'AITOEARN_API_KEY');
const EXTRA_HEADER = flag('--header'); // "Name: value", repeatable via multiple --header
const TIMEOUT_MS = Number(flag('--timeout', '120000'));

if (!URL_TARGET) {
  process.stderr.write('[aitoearn-bridge] missing --url\n');
  process.exit(2);
}

function log(...m) {
  process.stderr.write(`[aitoearn-bridge] ${m.join(' ')}\n`);
}

/* ------------------------------------------------------------------ key ---- */

function readConfigFile() {
  const candidates = [
    process.env.AITOEARN_CONFIG,
    path.join(os.homedir(), '.aitoearn', 'config.json'),
  ].filter(Boolean);

  for (const file of candidates) {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const cfg = JSON.parse(raw);
      const direct = cfg[ENV_KEY] ?? cfg.apiKey ?? cfg.api_key;
      if (direct) return String(direct);
      const site = URL_TARGET.includes('.cn') ? 'aitoearn-cn' : 'aitoearn';
      const nested = cfg[site]?.apiKey ?? cfg[site]?.api_key;
      if (nested) return String(nested);
    } catch {
      /* ignore unreadable / missing config */
    }
  }
  return null;
}

function resolveApiKey() {
  const fromEnv = process.env[ENV_KEY];
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  const fromFile = readConfigFile();
  if (fromFile) return fromFile;
  return null;
}

/* ------------------------------------------------------------- transport --- */

let sessionId = null;

function headers() {
  const h = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  const key = resolveApiKey();
  if (key) h.Authorization = `Bearer ${key}`;
  if (sessionId) h['mcp-session-id'] = sessionId;
  if (EXTRA_HEADER) {
    const idx = EXTRA_HEADER.indexOf(':');
    if (idx > 0) {
      h[EXTRA_HEADER.slice(0, idx).trim()] = EXTRA_HEADER.slice(idx + 1).trim();
    }
  }
  return h;
}

function errorReply(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

async function post(payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(URL_TARGET, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    const maybeSession = res.headers.get('mcp-session-id');
    if (maybeSession) sessionId = maybeSession;

    if (res.status === 401 || res.status === 403) {
      return { __httpError: res.status, text: await res.text().catch(() => '') };
    }
    if (!res.ok && res.status !== 202) {
      return { __httpError: res.status, text: await res.text().catch(() => '') };
    }
    if (res.status === 202 || res.status === 204) return null;

    const ctype = (res.headers.get('content-type') || '').toLowerCase();
    const body = await res.text();
    if (ctype.includes('text/event-stream')) return parseSse(body);
    try {
      return JSON.parse(body);
    } catch {
      return { __httpError: res.status, text: body.slice(0, 500) };
    }
  } catch (err) {
    clearTimeout(timer);
    const aborted = err && err.name === 'AbortError';
    return {
      __httpError: -1,
      text: aborted ? `request timed out after ${TIMEOUT_MS}ms` : String(err && err.message ? err.message : err),
    };
  }
}

/** Pick the JSON-RPC message that answers `id`; fall back to the last data event. */
function parseSse(body) {
  const events = [];
  for (const block of body.split(/\r?\n\r?\n/)) {
    for (const line of block.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        events.push(JSON.parse(data));
      } catch {
        /* non-JSON ping frames are ignored */
      }
    }
  }
  return events;
}

function matchReply(events, id) {
  if (!Array.isArray(events)) return null;
  if (id === undefined) return null; // notification: upstream stays silent
  const direct = events.find((e) => e && !Array.isArray(e) && e.id === id);
  return direct ?? events.filter((e) => e && !Array.isArray(e) && e.result !== undefined)[0] ?? null;
}

async function handleMessage(msg) {
  const payload = Array.isArray(msg) ? msg : [msg];
  const reply = await post(msg);

  if (reply && reply.__httpError !== undefined) {
    const status = reply.__httpError;
    const hint =
      status === 401 || status === 403
        ? `AiToEarn 拒绝了鉴权（HTTP ${status}）。请在客户端环境变量中设置 ${ENV_KEY}，或写入 ~/.aitoearn/config.json 后重启 MCP 服务。`
        : `AiToEarn MCP 请求失败（HTTP ${status}）：${reply.text || ''}`;
    if (!Array.isArray(msg)) {
      if (msg && msg.id !== undefined) send(errorReply(msg.id, -32001, hint));
      return;
    }
    for (const m of payload) if (m && m.id !== undefined) send(errorReply(m.id, -32001, hint));
    return;
  }

  if (!Array.isArray(msg)) {
    const isNotification = msg && msg.id === undefined;
    if (!isNotification) {
      const one = Array.isArray(reply) ? matchReply(reply, msg.id) : reply;
      if (one) send(one);
      else send(errorReply(msg.id, -32002, 'AiToEarn MCP returned no JSON-RPC response body.'));
    }
    return;
  }

  const list = Array.isArray(reply) ? reply : reply ? [reply] : [];
  for (const m of payload) {
    if (m && m.id !== undefined) {
      const one = list.find((e) => e && !Array.isArray(e) && e.id === m.id);
      send(one ?? errorReply(m.id, -32002, 'AiToEarn MCP returned no JSON-RPC response body.'));
    }
  }
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

/* ------------------------------------------------------------ stdio loop --- */

let buf = Buffer.alloc(0);
let contentLength = null;

function decodeAscii(b) {
  // LSP-style framing: "Content-Length: N\r\n\r\n{json}"
  const headEnd = b.indexOf('\r\n\r\n');
  if (headEnd < 0) return { done: false };
  const head = b.subarray(0, headEnd).toString('ascii');
  const m = /Content-Length:\s*(\d+)/i.exec(head);
  if (!m) return { done: false };
  const len = Number(m[1]);
  const bodyStart = headEnd + 4;
  if (b.length < bodyStart + len) return { done: false };
  const body = b.subarray(bodyStart, bodyStart + len).toString('utf8');
  return { done: true, text: body, consumed: bodyStart + len };
}

process.stdin.on('data', (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  for (;;) {
    let text = null;
    let consumed = 0;

    if (contentLength !== null) {
      if (buf.length < contentLength) break;
      text = buf.subarray(0, contentLength).toString('utf8');
      consumed = contentLength;
      contentLength = null;
    } else {
      const nl = buf.indexOf(0x0a);
      const framed = decodeAscii(buf);
      if (framed.done) {
        text = framed.text;
        consumed = framed.consumed;
      } else if (nl >= 0) {
        text = buf.subarray(0, nl).toString('utf8');
        consumed = nl + 1;
      } else {
        break;
      }
    }

    buf = buf.subarray(consumed);
    text = text.trim();
    if (!text) continue;

    let msg;
    try {
      msg = JSON.parse(text);
    } catch (err) {
      log('ignoring malformed JSON on stdin:', err.message);
      continue;
    }
    handleMessage(msg).catch((err) => {
      const id = msg && !Array.isArray(msg) ? msg.id : undefined;
      if (id !== undefined) send(errorReply(id, -32603, String(err && err.message ? err.message : err)));
      else log('handler error:', err);
    });
  }
});

process.stdin.on('end', () => process.exit(0));
process.stdin.on('error', (err) => {
  log('stdin error:', err.message);
  process.exit(1);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

if (!resolveApiKey()) {
  log(
    `warning: ${ENV_KEY} is not set and no config file was found. ` +
      `Requests will be sent unauthenticated until the key is configured.`
  );
} else if (process.env.AITOEARN_BRIDGE_VERBOSE) {
  log(`ready: ${URL_TARGET} (key from ${ENV_KEY})`);
}
