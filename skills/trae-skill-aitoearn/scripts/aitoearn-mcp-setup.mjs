#!/usr/bin/env node
// aitoearn-mcp-setup.mjs — 交互式注册 aitoearn MCP 服务器（由入口技能在缺少工具时调用）
//
// 用法: node aitoearn-mcp-setup.mjs <API_KEY> [cn|ai]
//   cn -> https://aitoearn.cn  （默认，国内平台：抖音/快手/小红书/视频号/公众号/B站）
//   ai -> https://aitoearn.ai  （国际平台：YouTube/TikTok/Twitter/Instagram 等）
//   两站 Key 不通用。
//
// 行为:
//   1. Key 写入 ~/.aitoearn/config.json（合并保留已有内容，chmod 600，供 stdio 桥读取）
//   2. 注册 aitoearn / aitoearn-cn 服务器到 Trae 用户级 ~/.trae-cn/mcp.json（合并保留已有服务器）
//   3. 用该 Key 实测 tools/list 验证；失败时输出诊断并退出码 1
//
// 全程不回显 API Key。测试可覆盖路径: AITOEARN_CONFIG（共享配置）、AITOEARN_MCP_CONFIG（mcp.json）

import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const SITES = { cn: 'https://aitoearn.cn', ai: 'https://aitoearn.ai' };
const key = process.argv[2] || '';
const region = (process.argv[3] || 'cn').toLowerCase();
const base = SITES[region];

if (!base) {
  console.error(`未知站点 "${region}"，可选 cn / ai`);
  process.exit(2);
}
if (!key) {
  console.error('缺少 API Key。用法: node aitoearn-mcp-setup.mjs <API_KEY> [cn|ai]');
  console.error(`获取: 登录 ${base} -> 设置 -> API Key -> Create，创建后立即复制`);
  process.exit(2);
}
const url = `${base}/api/ai/agent/mcp`;
const envName = region === 'cn' ? 'AITOEARN_CN_API_KEY' : 'AITOEARN_API_KEY';
const serverName = region === 'cn' ? 'aitoearn-cn' : 'aitoearn';

// 1. Key 写入共享配置（stdio 桥按 README「MCP 鉴权」约定从这里读取）
const configPath = process.env.AITOEARN_CONFIG || join(homedir(), '.aitoearn', 'config.json');
let shared = {};
if (existsSync(configPath)) {
  try {
    shared = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch {
    console.error(`警告: ${configPath} 解析失败，已重写`);
    shared = {};
  }
}
shared[envName] = key;
mkdirSync(dirname(configPath), { recursive: true });
writeFileSync(configPath, JSON.stringify(shared, null, 2) + '\n');
chmodSync(configPath, 0o600);
console.log(`已写入 ${configPath} (${envName})`);

// 2. 注册到 Trae 用户级 MCP 配置
const mcpPath = process.env.AITOEARN_MCP_CONFIG || join(homedir(), '.trae-cn', 'mcp.json');
let mcp = {};
if (existsSync(mcpPath)) {
  try {
    mcp = JSON.parse(readFileSync(mcpPath, 'utf8'));
  } catch {
    console.error(`警告: ${mcpPath} 解析失败，已重写`);
    mcp = {};
  }
}
mcp.mcpServers = mcp.mcpServers || {};
mcp.mcpServers[serverName] = { url, headers: { 'X-Api-Key': key } };
mkdirSync(dirname(mcpPath), { recursive: true });
writeFileSync(mcpPath, JSON.stringify(mcp, null, 2) + '\n');
console.log(`已注册 ${serverName} -> ${url} (${mcpPath})`);

// 3. 实测验证
let count = 0;
try {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'X-Api-Key': key,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });
  const data = await resp.json();
  count = data?.result?.tools?.length || 0;
} catch (err) {
  console.error(`验证失败：无法访问 ${url}（${err?.cause?.code || err.message}）。`);
  process.exit(1);
}
if (count > 1) {
  console.log(`验证通过：${serverName} 已开放 ${count} 个工具（完整工具集）。`);
  console.log('下一步：在 Trae 的 MCP 面板重载（或重启会话），即可使用 aitoearn / MediaKit 工具。');
} else {
  console.error(`验证失败：仅暴露 ${count} 个工具——Key 无效或站点不匹配（cn / ai 两站 Key 不通用）。`);
  process.exit(1);
}
