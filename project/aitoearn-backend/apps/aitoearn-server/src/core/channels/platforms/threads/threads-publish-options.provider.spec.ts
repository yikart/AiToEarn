import { describe, expect, it, vi } from 'vitest'
import { PublishOptionValueType } from '../platforms.interface'
import { ThreadsLocationFilterSchema, ThreadsPublishOptionsProvider } from './threads-publish-options.provider'

describe('threads publish options provider', () => {
  it('requires a keyword or coordinates for location search', () => {
    expect(ThreadsLocationFilterSchema.safeParse({}).success).toBe(false)
    expect(ThreadsLocationFilterSchema.safeParse({ keyword: 'Paris' }).success).toBe(true)
    expect(ThreadsLocationFilterSchema.safeParse({ latitude: 48.8566, longitude: 2.3522 }).success).toBe(true)
  })

  it('returns Threads locations as location_id values', async () => {
    const threadsService = {
      searchLocations: vi.fn().mockResolvedValue([
        {
          id: 'location-id',
          name: 'Paris',
          address: '1 Rue Example',
          city: 'Paris',
          country: 'FR',
          latitude: 48.8566,
          longitude: 2.3522,
          postal_code: '75001',
        },
      ]),
    }
    const provider = new ThreadsPublishOptionsProvider(threadsService as never)

    const result = await provider.getValues({
      userId: 'user-id',
      accountId: 'account-id',
      field: 'location_id',
      filters: { keyword: 'Paris' },
      credential: { accessToken: 'access-token' },
    })

    expect(threadsService.searchLocations).toHaveBeenCalledWith('access-token', { keyword: 'Paris' })
    expect(result).toEqual({
      field: 'location_id',
      valueType: PublishOptionValueType.List,
      items: [{
        value: 'location-id',
        label: 'Paris',
        description: '1 Rue Example, Paris, FR',
        extra: {
          address: '1 Rue Example',
          city: 'Paris',
          country: 'FR',
          latitude: 48.8566,
          longitude: 2.3522,
          postalCode: '75001',
        },
      }],
    })
  })
})
