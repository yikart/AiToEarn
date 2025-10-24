import * as crypto from 'node:crypto'
import { XMLParser } from 'fast-xml-parser'

class StrUtil {
  private xMlParser: XMLParser
  constructor() {
    // this.xMlParser = new XMLParser({
    //   ignoreAttributes: false,
    //   attributeNamePrefix: '@_',
    //   isArray: () => false, // 自定义数组判断
    //   trimValues: true,
    //   parseTagValue: true,
    //   parseAttributeValue: true,
    // });

    this.xMlParser = new XMLParser()
  }

  xmlToObject(xml: string): any {
    return this.xMlParser.parse(xml).xml
  }

  generateComplexKey(length = 32) {
    const chars
      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const randomBytes = crypto.randomBytes(length)
    let result = ''

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % chars.length
      result += chars[randomIndex]
    }

    return `sk-${result}`
  }
}
export const strUtil = new StrUtil()
