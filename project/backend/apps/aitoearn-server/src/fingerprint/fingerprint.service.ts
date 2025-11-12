import { Injectable } from '@nestjs/common'
import { FingerprintGenerator } from 'fingerprint-generator'
import { Device } from 'header-generator/header-generator'

@Injectable()
export class FingerprintService {
  constructor(
  ) {};

  async generateFingerprintCore(devices: Device) {
    const generator = new FingerprintGenerator()
    return generator.getFingerprint({
      devices: [devices],
    })
  }

  /**
   * 生成随机浏览器指纹
   * @returns 浏览器指纹
   */
  async generateFingerprint() {
    const mobile = await this.generateFingerprintCore('mobile')
    const desktop = await this.generateFingerprintCore('desktop')
    return {
      mobile,
      desktop,
    }
  }
}
