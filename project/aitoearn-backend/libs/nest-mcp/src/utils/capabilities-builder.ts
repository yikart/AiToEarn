import { ServerCapabilities } from '@modelcontextprotocol/sdk/types.js'
import { McpOptions } from '../interfaces'
import { McpRegistryService } from '../services/mcp-registry.service'

/**
 * Utility function to build MCP server capabilities dynamically based on
 * discovered tools, resources, and prompts
 */
export function buildMcpCapabilities(
  mcpModuleId: string,
  registry: McpRegistryService,
  options: McpOptions,
): ServerCapabilities {
  // Start with user-provided capabilities or empty object
  const baseCapabilities = options.capabilities || {}

  const capabilities: ServerCapabilities = { ...baseCapabilities }

  // Add tools capability if tools are discovered
  if (registry.getTools(mcpModuleId).length > 0) {
    capabilities.tools = capabilities.tools || {
      listChanged: true,
    }
  }

  if (
    registry.getResources(mcpModuleId).length > 0
    || registry.getResourceTemplates(mcpModuleId).length > 0
  ) {
    capabilities.resources = capabilities.resources || {
      listChanged: true,
    }
  }

  // Add prompts capability if prompts are discovered
  if (registry.getPrompts(mcpModuleId).length > 0) {
    capabilities.prompts = capabilities.prompts || {
      listChanged: true,
    }
  }

  return capabilities
}
