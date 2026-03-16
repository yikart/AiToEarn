import { SetMetadata } from '@nestjs/common'
import { MCP_RESOURCE_METADATA_KEY } from './constants'

export interface ResourceOptions {
  uri: string // Unique identifier for the resource
  name?: string // Human-readable name
  description?: string // Optional description
  mimeType?: string // Optional MIME type
  _meta?: Record<string, any>
}

export interface ResourceMetadata {
  uri: string // Unique identifier for the resource
  name: string // Human-readable name
  description?: string // Optional description
  mimeType?: string // Optional MIME type
  _meta?: Record<string, any>
}

/**
 * Decorator that marks a controller method as an MCP resource.
 * @param {object} options - The options for the decorator
 * @param {string} options.name - The name of the resource
 * @param {string} options.uri - The URI of the resource
 * @returns {MethodDecorator} - The decorator
 */
export function Resource(options: ResourceOptions) {
  return SetMetadata(MCP_RESOURCE_METADATA_KEY, options)
}
