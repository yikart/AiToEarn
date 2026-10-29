/**
 * Worker 侧引导代码：零依赖、不 import 任何包（连 @airongrong/plugin-api 都不需要），
 * 由宿主在插件目录旁生成 .mjs 文件，Worker 以 ESM 方式加载。
 * 协议: worker→host { kind:'cap', id, method, params } / host→worker { kind:'cap-result', id, result|error }
 *       host→worker { kind:'invoke', id, method, params } / worker→host { kind:'invoke-result', id, result|error }
 */
export const WORKER_BOOTSTRAP_SOURCE = String.raw`
import { parentPort, workerData } from 'node:worker_threads'

const pending = new Map()
let nextId = 0

function sendError(id, kind, error) {
  parentPort.postMessage({
    kind,
    id,
    error: {
      name: error?.name ?? 'Error',
      message: error?.message ?? String(error),
      stack: error?.stack,
    },
  })
}

function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, { resolve, reject })
    parentPort.postMessage({ kind: 'cap', id, method, params })
  })
}

const host = {
  http: { request: params => rpc('http.request', params) },
  secrets: { use: (key, fn) => rpc('secrets.use', { key }).then(value => fn(value)) },
  storage: {
    get: key => rpc('storage.get', { key }),
    set: (key, value) => rpc('storage.set', { key, value }),
    delete: key => rpc('storage.delete', { key }),
  },
  log: {
    info: (message, meta) => { rpc('log', { level: 'info', message: String(message), meta }) },
    warn: (message, meta) => { rpc('log', { level: 'warn', message: String(message), meta }) },
    error: (message, meta) => { rpc('log', { level: 'error', message: String(message), meta }) },
  },
}

function resolveTarget(root, path) {
  const segments = path.split('.')
  let target = root
  for (const segment of segments) {
    target = target?.[segment]
  }
  if (typeof target !== 'function') {
    throw new Error('插件未实现该方法: ' + path)
  }
  return target
}

parentPort.on('message', async (message) => {
  if (message.kind === 'cap-result') {
    const entry = pending.get(message.id)
    if (!entry) return
    pending.delete(message.id)
    if (message.error) {
      entry.reject(Object.assign(new Error(message.error.message), { name: message.error.name }))
    } else {
      entry.resolve(message.result)
    }
    return
  }
  if (message.kind === 'invoke') {
    try {
      const target = resolveTarget(api, message.method)
      const result = await target(...(message.params ?? []))
      parentPort.postMessage({ kind: 'invoke-result', id: message.id, result })
    } catch (error) {
      sendError(message.id, 'invoke-result', error)
    }
  }
})

let api
try {
  const plugin = await import(workerData.entryUrl)
  const activate = plugin.activate ?? plugin.default
  if (typeof activate !== 'function') {
    throw new Error('插件模块必须导出 activate(host) 或默认导出函数')
  }
  api = await activate(host)
  // 上报已实现的方法，宿主据此跳过未实现的 deactivate，卸载不再无谓等待
  parentPort.postMessage({ kind: 'ready', methods: Object.keys(api ?? {}) })
} catch (error) {
  sendError(null, 'bootstrap-error', error)
}
`
