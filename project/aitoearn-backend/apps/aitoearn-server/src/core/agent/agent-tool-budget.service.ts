import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { DiscoveryService, MetadataScanner } from '@nestjs/core'
import { MAX_AGENT_TOOLS, selectAgentTools } from './agent-tool-policy'

const MCP_TOOL_METADATA_KEY = 'mcp:tool'

/**
 * 启动时统计 @Tool 数量并核对 Agent 工具预算（方案 §12.2）。
 * strict=true（生产建议）时超出预算直接阻断启动，避免"工具越加越多"无声劣化。
 */
@Injectable()
export class AgentToolBudgetService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AgentToolBudgetService.name)

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
  ) {}

  onApplicationBootstrap(): void {
    const names = this.collectToolNames()
    const selection = selectAgentTools(names, 'core')
    if (names.length > MAX_AGENT_TOOLS) {
      this.logger.warn(
        `MCP 工具总数 ${names.length} 超过 Agent 预算 ${MAX_AGENT_TOOLS}；Agent 面只暴露 ${selection.exposed.length} 个，隐藏: ${selection.hidden.join(', ')}`,
      )
    }
    this.logger.log(`Agent 工具预算: 总数 ${names.length}，暴露 ${selection.exposed.length}（上限 ${MAX_AGENT_TOOLS}）`)
  }

  /** 读取全部 @Tool 装饰器声明的工具名（与 nest-mcp 的元数据键一致） */
  collectToolNames(): string[] {
    const names = new Set<string>()
    const instances = [
      ...this.discovery.getProviders(),
      ...this.discovery.getControllers(),
    ]
    for (const wrapper of instances) {
      const instance = wrapper.instance as Record<string, unknown> | undefined
      if (!instance || typeof instance !== 'object') {
        continue
      }
      for (const methodName of this.scanner.getAllMethodNames(instance)) {
        const methodRef = instance[methodName] as object
        const metadata = Reflect.getMetadata(MCP_TOOL_METADATA_KEY, methodRef) as { name?: string } | undefined
        if (metadata) {
          names.add(metadata.name ?? methodName)
        }
      }
    }
    return Array.from(names)
  }
}
