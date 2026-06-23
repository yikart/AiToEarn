import { vi } from 'vitest'
import { RelayLibService } from '../../libs/relay'
import { RelayLibModule } from '../../libs/relay/relay.module'
import { RelayVideoModule } from './relay-video.module'
import { RelayVideoService } from './relay-video.service'

vi.mock('../../models-config', () => ({ ModelsConfigModule: class ModelsConfigModule {} }))
vi.mock('./relay-video.service', () => ({ RelayVideoService: class RelayVideoService {} }))

describe('relayVideoModule', () => {
  const relayConfig = {
    url: 'https://relay.example.com',
    apiKey: 'relay-api-key',
    timeout: 1000,
  }

  it('does not register RelayVideoService when relay config is missing', () => {
    const moduleDefinition = RelayVideoModule.forRoot(undefined)

    expect(moduleDefinition.providers).toBeUndefined()
    expect(moduleDefinition.exports).toBeUndefined()
  })

  it('registers relay video providers only when relay config exists', () => {
    const moduleDefinition = RelayVideoModule.forRoot(relayConfig)

    expect(moduleDefinition.providers).toContain(RelayVideoService)
    expect(moduleDefinition.exports).toContain(RelayVideoService)
  })

  it('exports RelayLibService globally when relay config exists', () => {
    const moduleDefinition = RelayLibModule.forRoot(relayConfig)

    expect(moduleDefinition.global).toBe(true)
    expect(moduleDefinition.exports).toContain(RelayLibService)
  })
})
