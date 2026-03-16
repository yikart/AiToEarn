import { SetMetadata } from '@nestjs/common'
import { MCP_RESOURCE_TEMPLATE_METADATA_KEY } from './constants'

export interface ResourceTemplateOptions {
  uriTemplate: string // URI template following RFC 6570
  name?: string // Human-readable name
  description?: string // Optional description
  mimeType?: string // Optional MIME type
  _meta?: Record<string, any>
}

export interface ResourceTemplateMetadata {
  uriTemplate: string // URI template following RFC 6570
  name: string // Human-readable name
  description?: string // Optional description
  mimeType?: string // Optional MIME type
  _meta?: Record<string, any>
}

/**
 * Decorator that marks a controller method as an MCP resource.
 * @param {object} options - The options for the decorator
 * @param {string} options.name - The name of the resource
 * @param {string} options.uriTemplate - The URI template of the resource
 * @returns {MethodDecorator} - The decorator
 */
export function ResourceTemplate(options: ResourceTemplateOptions) {
  return SetMetadata(MCP_RESOURCE_TEMPLATE_METADATA_KEY, options)
}
