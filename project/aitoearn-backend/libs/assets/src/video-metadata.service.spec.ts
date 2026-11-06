import { writeFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { VideoMetadataService } from './video-metadata.service'

const { execaMock } = vi.hoisted(() => ({
  execaMock: vi.fn(),
}))

vi.mock('execa', () => ({
  execa: (...args: unknown[]) => execaMock(...args),
}))

vi.mock('@yikart/mongodb', () => ({
  AssetType: {
    AiImage: 'aiImage',
    AiVideo: 'aiVideo',
    AiCard: 'aiCard',
    AiChatImage: 'aiChatImage',
    AideoOutput: 'aideoOutput',
    VideoEdit: 'videoEdit',
    DramaRecap: 'dramaRecap',
    StyleTransfer: 'styleTransfer',
    UserMedia: 'userMedia',
    UserFile: 'userFile',
    PublishMedia: 'publishMedia',
    Avatar: 'avatar',
    AgentSession: 'agentSession',
    VideoThumbnail: 'videoThumbnail',
    GooglePlace: 'googlePlace',
    Temp: 'temp',
    ImageEdit: 'imageEdit',
    Subtitle: 'subtitle',
  },
  AssetStatus: {
    Confirmed: 'confirmed',
  },
  AssetRepository: class {},
}))

function createService() {
  const storage = {
    putObject: vi.fn().mockResolvedValue({ path: 'uploaded-path' }),
    buildUrl: vi.fn((objectPath: string) => `https://cdn.example.test/${objectPath}`),
  }
  const service = new VideoMetadataService(storage as never, {} as never)
  return { service, storage }
}

function mp4Box(type: string, payloadSize: number): Buffer {
  const box = Buffer.alloc(8 + payloadSize)
  box.writeUInt32BE(box.length, 0)
  box.write(type, 4, 'ascii')
  return box
}

/** Build a fake mp4 byte layout: ftyp first, then moov/mdat in the given order. */
function fakeMp4(...order: ('moov' | 'mdat')[]): Buffer {
  return Buffer.concat([
    mp4Box('ftyp', 16),
    ...order.map(type => mp4Box(type, 8)),
  ])
}

function probeResult(codecName: string, formatName = 'mov,mp4,m4a,3gp,3g2,mj2') {
  return {
    streams: [{ codec_type: 'video', codec_name: codecName }],
    format: { format_name: formatName },
  }
}

function mockExeca(probe: unknown) {
  execaMock.mockImplementation(async (cmd: string, args: string[]) => {
    if (cmd === 'ffprobe') {
      return { stdout: JSON.stringify(probe) }
    }
    if (cmd === 'ffmpeg') {
      await writeFile(args[args.length - 1], 'transcoded')
      return { stdout: '' }
    }
    throw new Error(`unexpected command: ${cmd}`)
  })
}

function mockFetchWithMp4(...order: ('moov' | 'mdat')[]) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(fakeMp4(...order)))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('videoMetadataService.ensureCompatibleVideo', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    execaMock.mockReset()
  })

  it('returns the original URL when the video is H.264 in a faststart mp4', async () => {
    mockFetchWithMp4('moov', 'mdat')
    mockExeca(probeResult('h264'))
    const { service, storage } = createService()

    const url = 'https://cdn.example.test/video.mp4'
    await expect(service.ensureCompatibleVideo(url)).resolves.toBe(url)

    expect(storage.putObject).not.toHaveBeenCalled()
    expect(execaMock).toHaveBeenCalledTimes(1)
    expect(execaMock.mock.calls[0][0]).toBe('ffprobe')
  })

  it('transcodes non-H.264 videos and uploads the result', async () => {
    mockFetchWithMp4('moov', 'mdat')
    mockExeca(probeResult('hevc'))
    const { service, storage } = createService()

    const result = await service.ensureCompatibleVideo('https://cdn.example.test/hevc.mp4')

    expect(execaMock).toHaveBeenCalledTimes(2)
    const ffmpegCall = execaMock.mock.calls[1]
    expect(ffmpegCall[0]).toBe('ffmpeg')
    expect(ffmpegCall[1]).toEqual(expect.arrayContaining([
      '-c:v',
      'libx264',
      '-movflags',
      '+faststart',
      '-f',
      'mp4',
    ]))
    expect(ffmpegCall[2]).toMatchObject({ timeout: 600000 })

    expect(storage.putObject).toHaveBeenCalledTimes(1)
    const [objectPath, , contentType] = storage.putObject.mock.calls[0]
    expect(objectPath).toContain('publish/media')
    expect(contentType).toBe('video/mp4')
    expect(result).toBe(`https://cdn.example.test/${objectPath}`)
  })

  it('transcodes H.264 videos whose moov atom is after mdat (not faststart)', async () => {
    mockFetchWithMp4('mdat', 'moov')
    mockExeca(probeResult('h264'))
    const { service, storage } = createService()

    const result = await service.ensureCompatibleVideo('https://cdn.example.test/slowstart.mp4')

    expect(execaMock.mock.calls[1][0]).toBe('ffmpeg')
    expect(storage.putObject).toHaveBeenCalledTimes(1)
    expect(result).not.toBe('https://cdn.example.test/slowstart.mp4')
  })

  it('transcodes H.264 videos in non-mp4 containers', async () => {
    mockFetchWithMp4('mdat', 'moov')
    mockExeca(probeResult('h264', 'avi'))
    const { service, storage } = createService()

    await service.ensureCompatibleVideo('https://cdn.example.test/video.avi')

    expect(storage.putObject).toHaveBeenCalledTimes(1)
  })

  it('throws when the URL is not http(s) or looks like an ffmpeg option', async () => {
    const { service, storage } = createService()

    await expect(service.ensureCompatibleVideo('-i evil')).rejects.toThrow('Invalid video URL')
    await expect(service.ensureCompatibleVideo('ftp://example.test/video.mp4')).rejects.toThrow('Invalid video URL')

    expect(execaMock).not.toHaveBeenCalled()
    expect(storage.putObject).not.toHaveBeenCalled()
  })

  it('rejects downloads whose declared content-length exceeds the size cap', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(fakeMp4('moov'), {
      headers: { 'content-length': String(3 * 1024 * 1024 * 1024) },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const { service, storage } = createService()

    await expect(service.ensureCompatibleVideo('https://cdn.example.test/huge.mp4'))
      .rejects
      .toThrow('Video too large to download')

    expect(execaMock).not.toHaveBeenCalled()
    expect(storage.putObject).not.toHaveBeenCalled()
  })

  it('passes an abort signal to fetch so oversized or stalled downloads are terminated', async () => {
    const fetchMock = mockFetchWithMp4('moov', 'mdat')
    mockExeca(probeResult('h264'))
    const { service } = createService()

    await service.ensureCompatibleVideo('https://cdn.example.test/video.mp4')

    const init = fetchMock.mock.calls[0][1]
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('throws when the download fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })))
    const { service, storage } = createService()

    await expect(service.ensureCompatibleVideo('https://cdn.example.test/video.mp4'))
      .rejects
      .toThrow('Failed to download video: HTTP 500')

    expect(execaMock).not.toHaveBeenCalled()
    expect(storage.putObject).not.toHaveBeenCalled()
  })
})

describe('videoMetadataService.probeVideoMetadata', () => {
  beforeEach(() => {
    execaMock.mockReset()
  })

  it('rejects URLs that could inject ffmpeg options', async () => {
    const { service } = createService()

    await expect(service.probeVideoMetadata('-user_agent x'))
      .rejects
      .toThrow('Invalid video URL')
    expect(execaMock).not.toHaveBeenCalled()
  })

  it('reports the last ffprobe error line when probing fails', async () => {
    execaMock.mockRejectedValueOnce(Object.assign(new Error('Command failed'), {
      stderr: 'https://cdn.example.test/video.mp4: Server returned 403 Forbidden (access denied)',
      exitCode: 1,
      timedOut: false,
    }))
    const { service } = createService()

    await expect(service.probeVideoMetadata('https://cdn.example.test/video.mp4'))
      .rejects
      .toThrow('ffprobe failed: https://cdn.example.test/video.mp4: Server returned 403 Forbidden (access denied)')
  })

  it('reports ffprobe timeouts', async () => {
    execaMock.mockRejectedValueOnce(Object.assign(new Error('Command timed out'), { stderr: '', timedOut: true }))
    const { service } = createService()

    await expect(service.probeVideoMetadata('https://cdn.example.test/video.mp4'))
      .rejects
      .toThrow('ffprobe timed out after 60s')
  })

  it('passes a fixed user agent to ffprobe', async () => {
    execaMock.mockResolvedValueOnce({
      stdout: JSON.stringify({
        streams: [{ codec_type: 'video', width: 1920, height: 1080, r_frame_rate: '30/1' }],
        format: { duration: '10', bit_rate: '1000' },
      }),
    })
    const { service } = createService()

    const metadata = await service.probeVideoMetadata('https://cdn.example.test/video.mp4')

    expect(execaMock).toHaveBeenCalledWith(
      'ffprobe',
      expect.arrayContaining(['-user_agent', 'AiToEarn-MediaProbe/1.0', 'https://cdn.example.test/video.mp4']),
      expect.objectContaining({ timeout: 60000 }),
    )
    expect(metadata).toMatchObject({ width: 1920, height: 1080, duration: 10 })
  })
})
