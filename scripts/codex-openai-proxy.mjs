#!/usr/bin/env node

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const port = Number(process.env.CODEX_OPENAI_PROXY_PORT || 52032)
const model = process.env.CODEX_OPENAI_MODEL || 'gpt-5.5'
const reasoningEffort = process.env.CODEX_OPENAI_REASONING_EFFORT || 'xhigh'
const providerName = process.env.CODEX_MODEL_PROVIDER || 'codex_local_access'
const forceModel = process.env.CODEX_OPENAI_FORCE_MODEL !== '0'

function readCodexAuth() {
  const authPath = join(homedir(), '.codex', 'auth.json')
  const auth = JSON.parse(readFileSync(authPath, 'utf8'))
  const apiKey = auth.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(`${authPath} does not contain OPENAI_API_KEY`)
  }
  return apiKey
}

function readCodexBaseUrl() {
  const configPath = join(homedir(), '.codex', 'config.toml')
  const config = readFileSync(configPath, 'utf8')
  const section = config.match(new RegExp(`\\[model_providers\\.${providerName}\\]([\\s\\S]*?)(?:\\n\\[|$)`))
  const baseUrl = section?.[1]?.match(/base_url\s*=\s*"([^"]+)"/)?.[1]
  if (!baseUrl) {
    throw new Error(`${configPath} does not contain model_providers.${providerName}.base_url`)
  }
  return baseUrl.replace(/\/$/, '')
}

const apiKey = readCodexAuth()
const codexBaseUrl = readCodexBaseUrl()

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function responseJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`)
    if (url.pathname === '/health') {
      responseJson(res, 200, { ok: true, upstream: codexBaseUrl, model, reasoningEffort })
      return
    }

    const targetUrl = `${codexBaseUrl}${url.pathname}${url.search}`
    const headers = new Headers()
    for (const [name, value] of Object.entries(req.headers)) {
      if (!value || ['host', 'content-length', 'authorization'].includes(name.toLowerCase())) {
        continue
      }
      headers.set(name, Array.isArray(value) ? value.join(', ') : value)
    }
    headers.set('authorization', `Bearer ${apiKey}`)

    let body
    if (req.method && !['GET', 'HEAD'].includes(req.method)) {
      const rawBody = await collectBody(req)
      if (url.pathname === '/v1/chat/completions' && rawBody.length > 0) {
        const payload = JSON.parse(rawBody.toString('utf8'))
        if (forceModel || !payload.model) {
          payload.model = model
        }
        if (payload.model === model && payload.reasoning_effort == null) {
          payload.reasoning_effort = reasoningEffort
        }
        body = JSON.stringify(payload)
        headers.set('content-type', 'application/json')
      }
      else {
        body = rawBody
      }
    }

    const upstream = await fetch(targetUrl, { method: req.method, headers, body })
    res.writeHead(upstream.status, Object.fromEntries(upstream.headers.entries()))
    if (upstream.body) {
      await upstream.body.pipeTo(new WritableStream({
        write(chunk) {
          res.write(Buffer.from(chunk))
        },
        close() {
          res.end()
        },
        abort(error) {
          res.destroy(error)
        },
      }))
    }
    else {
      res.end()
    }
  }
  catch (error) {
    responseJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Codex OpenAI proxy listening on http://127.0.0.1:${port}/v1`)
  console.log(`Upstream: ${codexBaseUrl}, model: ${model}, reasoning: ${reasoningEffort}, forceModel: ${forceModel}`)
})
