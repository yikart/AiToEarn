import type { AiAvailabilityService } from '../../ai-availability'
import { Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { vi } from 'vitest'
import { z } from 'zod'
import {
  errorResult,
  formatList,
  formatObject,
  secondsToSrtTimestamp,
  srtTimestampToMs,
  successResult,
  wrapTool,
} from './mcp.utils'

describe('mcp.utils', () => {
  describe('srtTimestampToMs', () => {
    it('should convert SRT timestamp to milliseconds', () => {
      expect(srtTimestampToMs('00:01:20,460')).toBe(80460)
    })

    it('should handle zero timestamp', () => {
      expect(srtTimestampToMs('00:00:00,000')).toBe(0)
    })

    it('should handle hours correctly', () => {
      expect(srtTimestampToMs('01:00:00,000')).toBe(3600000)
    })

    it('should handle minutes correctly', () => {
      expect(srtTimestampToMs('00:30:00,000')).toBe(1800000)
    })

    it('should handle seconds correctly', () => {
      expect(srtTimestampToMs('00:00:45,000')).toBe(45000)
    })

    it('should handle milliseconds correctly', () => {
      expect(srtTimestampToMs('00:00:00,500')).toBe(500)
    })

    it('should handle complex timestamp', () => {
      expect(srtTimestampToMs('02:15:30,750')).toBe(8130750)
    })
  })

  describe('secondsToSrtTimestamp', () => {
    it('should convert seconds to SRT timestamp', () => {
      expect(secondsToSrtTimestamp(80.46)).toBe('00:01:20,460')
    })

    it('should handle zero seconds', () => {
      expect(secondsToSrtTimestamp(0)).toBe('00:00:00,000')
    })

    it('should handle hours', () => {
      expect(secondsToSrtTimestamp(3600)).toBe('01:00:00,000')
    })

    it('should handle minutes', () => {
      expect(secondsToSrtTimestamp(1800)).toBe('00:30:00,000')
    })

    it('should handle complex time', () => {
      expect(secondsToSrtTimestamp(8130.75)).toBe('02:15:30,750')
    })

    it('should pad numbers correctly', () => {
      expect(secondsToSrtTimestamp(1.001)).toBe('00:00:01,001')
    })
  })

  describe('successResult', () => {
    it('should create success result with string content', () => {
      const result = successResult('test message')
      expect(result.content).toEqual([{ type: 'text', text: 'test message' }])
      expect(result.isError).toBeUndefined()
    })

    it('should create success result with object content', () => {
      const obj = { key: 'value', num: 123 }
      const result = successResult(obj)
      expect(result.content).toEqual([{ type: 'text', text: JSON.stringify(obj) }])
      expect(result.isError).toBeUndefined()
    })

    it('should create success result with array content', () => {
      const arr = ['item1', 'item2']
      const result = successResult(arr)
      expect(result.content).toEqual([{ type: 'text', text: JSON.stringify(arr) }])
      expect(result.isError).toBeUndefined()
    })

    it('should pass through content array with type property', () => {
      const content = [{ type: 'text', text: 'hello' }]
      const result = successResult(content)
      expect(result.content).toEqual(content)
    })
  })

  describe('errorResult', () => {
    it('should create error result with string message', () => {
      const result = errorResult('error message')
      expect(result.content).toEqual([{ type: 'text', text: 'error message' }])
      expect(result.isError).toBe(true)
    })

    it('should create error result with object message', () => {
      const obj = { error: 'details' }
      const result = errorResult(obj)
      expect(result.content).toEqual([{ type: 'text', text: JSON.stringify(obj) }])
      expect(result.isError).toBe(true)
    })
  })

  describe('wrapTool', () => {
    let mockLogger: Logger
    let mockAiAvailability: vi.Mocked<Pick<AiAvailabilityService, 'execute'>>

    beforeEach(() => {
      mockLogger = {
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
      } as unknown as Logger

      mockAiAvailability = {
        execute: vi.fn().mockImplementation((_ctx, fn) => fn()),
      }
    })

    it('should wrap tool and have correct name/description', async () => {
      const handler = vi.fn().mockResolvedValue(successResult('success'))
      const schema = { param: z.string() }

      const wrappedTool = wrapTool(
        mockLogger,
        'testTool',
        'Test description',
        schema,
        handler,
        mockAiAvailability as unknown as AiAvailabilityService,
      )

      expect(wrappedTool).toBeDefined()
      expect(wrappedTool.name).toBe('testTool')
      expect(wrappedTool.description).toBe('Test description')
    })

    it('should delegate to aiAvailability.execute on handler call', async () => {
      const handler = vi.fn().mockResolvedValue(successResult('success'))
      const schema = { param: z.string() }

      const wrappedTool = wrapTool(
        mockLogger,
        'testTool',
        'Test description',
        schema,
        handler,
        mockAiAvailability as unknown as AiAvailabilityService,
      )

      const result = await wrappedTool.handler({ param: 'test' }, {})

      expect(result.isError).toBeUndefined()
      expect(mockAiAvailability.execute).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'mcp', operation: 'testTool' }),
        expect.any(Function),
      )
    })

    it('should return errorResult for handler returning error', async () => {
      const handler = vi.fn().mockResolvedValue(errorResult('failed'))
      const schema = { param: z.string() }

      const wrappedTool = wrapTool(
        mockLogger,
        'testTool',
        'Test description',
        schema,
        handler,
        mockAiAvailability as unknown as AiAvailabilityService,
      )

      const result = await wrappedTool.handler({ param: 'test' }, {})

      expect(result.isError).toBe(true)
    })

    it('should catch non-AppException errors and return errorResult with fatal log', async () => {
      const testError = new Error('Test error')
      const handler = vi.fn().mockRejectedValue(testError)
      mockAiAvailability.execute.mockRejectedValue(testError)
      const schema = { param: z.string() }

      const wrappedTool = wrapTool(
        mockLogger,
        'testTool',
        'Test description',
        schema,
        handler,
        mockAiAvailability as unknown as AiAvailabilityService,
      )

      const result = await wrappedTool.handler({ param: 'test' }, {})

      expect(result.isError).toBe(true)
      expect(result.content).toEqual([{ type: 'text', text: 'Test error' }])
      expect(mockLogger.fatal).toHaveBeenCalled()
    })

    it('should catch AppException and return errorResult without fatal log', async () => {
      const handler = vi.fn().mockRejectedValue(
        new AppException(ResponseCode.AgentTaskFailed),
      )
      const schema = { param: z.string() }

      const wrappedTool = wrapTool(
        mockLogger,
        'testTool',
        'Test description',
        schema,
        handler,
        mockAiAvailability as unknown as AiAvailabilityService,
      )

      const result = await wrappedTool.handler({ param: 'test' }, {})

      expect(result.isError).toBe(true)
      expect(mockLogger.fatal).not.toHaveBeenCalled()
      expect(mockLogger.warn).toHaveBeenCalled()
    })
  })

  describe('formatObject', () => {
    it('should format object as YAML-like string', () => {
      const obj = { name: 'test', value: 123 }
      const result = formatObject(obj)
      expect(result).toBe('name: test\nvalue: 123')
    })

    it('should filter out timestamp fields', () => {
      const obj = {
        name: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        __v: 0,
        _id: 'abc123',
      }
      const result = formatObject(obj)
      expect(result).toBe('name: test')
    })

    it('should handle nested objects', () => {
      const obj = { name: 'test', nested: { key: 'value' } }
      const result = formatObject(obj)
      expect(result).toContain('name: test')
      expect(result).toContain('nested: {"key":"value"}')
    })

    it('should handle arrays', () => {
      const obj = { name: 'test', items: ['a', 'b', 'c'] }
      const result = formatObject(obj)
      expect(result).toContain('name: test')
      expect(result).toContain('items: a, b, c')
    })

    it('should skip null and undefined values', () => {
      const obj = { name: 'test', empty: null, missing: undefined }
      const result = formatObject(obj)
      expect(result).toBe('name: test')
    })

    it('should return empty string for null input', () => {
      const result = formatObject(null as unknown as Record<string, unknown>)
      expect(result).toBe('')
    })

    it('should filter by keepFields when provided', () => {
      const obj = { name: 'test', value: 123, extra: 'ignored' }
      const result = formatObject(obj, ['name', 'value'])
      expect(result).toBe('name: test\nvalue: 123')
    })
  })

  describe('formatList', () => {
    it('should format list with default formatter', () => {
      const list = ['item1', 'item2', 'item3']
      const result = formatList(list)
      expect(result).toBe('Total 3:\n1. item1\n2. item2\n3. item3')
    })

    it('should format list with custom formatter', () => {
      const list = [{ name: 'a' }, { name: 'b' }]
      const result = formatList(list, item => item.name)
      expect(result).toBe('Total 2:\n1. a\n2. b')
    })

    it('should return "No data" for empty list', () => {
      const result = formatList([])
      expect(result).toBe('No data')
    })

    it('should return "No data" for null list', () => {
      const result = formatList(null as unknown as unknown[])
      expect(result).toBe('No data')
    })

    it('should pass index to formatter', () => {
      const list = ['a', 'b']
      const result = formatList(list, (item, index) => `${index}: ${item}`)
      expect(result).toBe('Total 2:\n1. 0: a\n2. 1: b')
    })
  })
})
