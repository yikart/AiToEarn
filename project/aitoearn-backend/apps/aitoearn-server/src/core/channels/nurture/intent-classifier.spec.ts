import { describe, expect, it, vi } from 'vitest'
import { fastMatch, IntentLevel, type IntentClassification } from './intent-classifier'

// 注意：fastMatch 是模块内部的私有函数，我们通过导出它来测试
// 在 intent-classifier.ts 中已将 fastMatch 导出

describe('IntentClassifier - 快速规则匹配', () => {
  describe('高意向关键词匹配', () => {
    it('单条高意向关键词 → HIGH', () => {
      const result = fastMatch('这个多少钱？')
      expect(result?.level).toBe(IntentLevel.HIGH)
      expect(result?.confidence).toBe(0.75)
    })

    it('多条高意向关键词 → HIGH（高置信度）', () => {
      const result = fastMatch('怎么买？多少钱？')
      expect(result?.level).toBe(IntentLevel.HIGH)
      expect(result?.confidence).toBe(0.95)
    })

    it('英文高意向关键词', () => {
      const result = fastMatch('how much is this?')
      expect(result?.level).toBe(IntentLevel.HIGH)
    })
  })

  describe('无效/Spam 关键词匹配', () => {
    it('关注互粉 → INVALID', () => {
      const result = fastMatch('关注互粉啊')
      expect(result?.level).toBe(IntentLevel.INVALID)
      expect(result?.confidence).toBe(0.85)
    })

    it('广告推广 → INVALID', () => {
      const result = fastMatch('加微信领取免费资料')
      expect(result?.level).toBe(IntentLevel.INVALID)
    })

    it('辱骂内容 → INVALID', () => {
      const result = fastMatch('傻逼产品，垃圾')
      expect(result?.level).toBe(IntentLevel.INVALID)
    })
  })

  describe('无法匹配 → null（需要 LLM）', () => {
    it('普通赞美评论', () => {
      const result = fastMatch('视频做得真好！')
      expect(result).toBeNull()
    })

    it('中性提问', () => {
      const result = fastMatch('这个是怎么实现的？')
      expect(result).toBeNull()
    })

    it('空字符串', () => {
      const result = fastMatch('')
      expect(result).toBeNull()
    })

    it('纯表情', () => {
      const result = fastMatch('👍')
      expect(result).toBeNull()
    })
  })

  describe('边界情况', () => {
    it('中英文混合', () => {
      const result = fastMatch('这个 how much？')
      expect(result?.level).toBe(IntentLevel.HIGH)
    })

    it('大小写不敏感', () => {
      const result = fastMatch('HOW MUCH?')
      expect(result?.level).toBe(IntentLevel.HIGH)
    })

    it('长文本中包含关键词', () => {
      const result = fastMatch('大家好，我想问一下这个产品的价格和购买链接，谢谢！')
      expect(result?.level).toBe(IntentLevel.HIGH)
      expect(result?.confidence).toBe(0.95)
    })
  })
})

describe('IntentClassification 结构', () => {
  it('返回的对象包含必需字段', () => {
    const result: IntentClassification | null = fastMatch('多少钱')
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('level')
    expect(result).toHaveProperty('confidence')
    expect(result).toHaveProperty('reason')
    // entities 是可选的
  })

  it('confidence 在 0-1 范围内', () => {
    const result = fastMatch('多少钱')
    expect(result?.confidence).toBeGreaterThanOrEqual(0)
    expect(result?.confidence).toBeLessThanOrEqual(1)
  })
})
