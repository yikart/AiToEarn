import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import type { LinkedInErrorBody } from './linkedin.exception'
import type {
  LinkedInCommentCreateResponse,
  LinkedInCommentListResponse,
  LinkedInCreatedPostResponse,
  LinkedInPersonProfile,
  LinkedInShareResponse,
  LinkedInTokenResponse,
  LinkedInUploadInitResponse,
} from './linkedin.interface'
import { Injectable } from '@nestjs/common'
import { ResponseCode } from '@yikart/common'
import axios from 'axios'
import { PlatformErrorCategory } from '../platforms.exception'
import { LinkedinConfig } from './linkedin.config'
import { LinkedInPlatformException } from './linkedin.exception'
import { LinkedInOAuthGrantType, LinkedInPostLifecycleState } from './linkedin.interface'
import { LinkedInDistribution, LinkedInVisibility } from './linkedin.schema'

@Injectable()
export class LinkedInService {
  private readonly http: AxiosInstance
  private readonly apiBaseUrl = 'https://api.linkedin.com/v2'
  private readonly restBaseUrl = 'https://api.linkedin.com/rest'

  constructor(private readonly cfg: LinkedinConfig) {
    this.http = this.createHttpClient()
  }

  private createHttpClient(): AxiosInstance {
    const http = axios.create()
    http.interceptors.response.use(
      response => response,
      (error: AxiosError<LinkedInErrorBody>) => {
        throw LinkedInPlatformException.fromAxiosError(error)
      },
    )
    return http
  }

  private restHeaders(accessToken: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Linkedin-Version': this.cfg.restVersion,
      'X-Restli-Protocol-Version': '2.0.0',
    }
  }

  generateAuthUrl(scopes: string[], state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.cfg.clientId,
      redirect_uri: this.cfg.redirectUri,
      scope: scopes.join(' '),
      state,
    })

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
  }> {
    const response = await this.http.post<LinkedInTokenResponse>(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: LinkedInOAuthGrantType.AuthorizationCode,
        code,
        redirect_uri: this.cfg.redirectUri,
        client_id: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    )

    const data = response.data
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scope: data.scope,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
  }> {
    const response = await this.http.post<LinkedInTokenResponse>(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: LinkedInOAuthGrantType.RefreshToken,
        refresh_token: refreshToken,
        client_id: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    )

    const data = response.data
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scope: data.scope,
    }
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    await this.http.post(
      `${this.apiBaseUrl}/oauth/v2/revoke`,
      new URLSearchParams({
        token: accessToken,
        client_id: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    )
    return true
  }

  async getProfile(accessToken: string): Promise<{
    platformUid: string
    displayName: string
    avatarUrl?: string
    email?: string
  }> {
    const response = await this.http.get<LinkedInPersonProfile>(
      `${this.apiBaseUrl}/userinfo`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )

    const profile = response.data
    const displayName = profile.name || [profile.given_name, profile.family_name]
      .filter(Boolean)
      .join(' ') || profile.sub

    return {
      platformUid: profile.sub,
      displayName,
      avatarUrl: profile.picture,
      email: profile.email,
    }
  }

  async registerImageUpload(
    accessToken: string,
    ownerUrn: string,
  ): Promise<LinkedInUploadInitResponse> {
    const response = await this.http.post<LinkedInUploadInitResponse>(
      `${this.restBaseUrl}/images?action=initializeUpload`,
      {
        initializeUploadRequest: { owner: ownerUrn },
      },
      {
        headers: this.restHeaders(accessToken),
      },
    )

    return response.data
  }

  async registerVideoUpload(
    accessToken: string,
    ownerUrn: string,
    fileSizeBytes: number,
  ): Promise<LinkedInUploadInitResponse> {
    const response = await this.http.post<LinkedInUploadInitResponse>(
      `${this.restBaseUrl}/videos?action=initializeUpload`,
      {
        initializeUploadRequest: {
          owner: ownerUrn,
          fileSizeBytes,
        },
      },
      {
        headers: this.restHeaders(accessToken),
      },
    )

    return response.data
  }

  async uploadBinary(uploadUrl: string, binary: Buffer): Promise<string | undefined> {
    const response = await this.http.put(uploadUrl, binary, {
      headers: { 'Content-Type': 'application/octet-stream' },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    })
    const etag = response.headers['etag'] ?? response.headers['ETag']
    return Array.isArray(etag) ? etag[0] : etag
  }

  async finalizeVideoUpload(
    accessToken: string,
    videoUrn: string,
    uploadToken: string,
    uploadedPartIds: string[],
  ): Promise<void> {
    await this.http.post(
      `${this.restBaseUrl}/videos?action=finalizeUpload`,
      {
        finalizeUploadRequest: {
          video: videoUrn,
          uploadToken,
          uploadedPartIds,
        },
      },
      {
        headers: this.restHeaders(accessToken),
      },
    )
  }

  async createTextPost(
    accessToken: string,
    ownerUrn: string,
    text: string,
  ): Promise<LinkedInCreatedPostResponse> {
    const response = await this.http.post<LinkedInShareResponse>(
      `${this.restBaseUrl}/posts`,
      {
        author: ownerUrn,
        commentary: text,
        visibility: LinkedInVisibility.Public,
        distribution: {
          feedDistribution: LinkedInDistribution.MainFeed,
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: LinkedInPostLifecycleState.Published,
        isReshareDisabledByAuthor: false,
      },
      {
        headers: this.restHeaders(accessToken),
      },
    )

    return this.withCreatedPostId(response, 'createTextPost')
  }

  async createImagePost(
    accessToken: string,
    ownerUrn: string,
    text: string,
    imageUrns: string[],
  ): Promise<LinkedInCreatedPostResponse> {
    const response = await this.http.post<LinkedInShareResponse>(
      `${this.restBaseUrl}/posts`,
      {
        author: ownerUrn,
        commentary: text,
        visibility: LinkedInVisibility.Public,
        distribution: {
          feedDistribution: LinkedInDistribution.MainFeed,
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          multiImage: {
            images: imageUrns.map(urn => ({ id: urn })),
          },
        },
        lifecycleState: LinkedInPostLifecycleState.Published,
        isReshareDisabledByAuthor: false,
      },
      {
        headers: this.restHeaders(accessToken),
      },
    )

    return this.withCreatedPostId(response, 'createImagePost')
  }

  async createVideoPost(
    accessToken: string,
    ownerUrn: string,
    text: string,
    videoUrn: string,
  ): Promise<LinkedInCreatedPostResponse> {
    const response = await this.http.post<LinkedInShareResponse>(
      `${this.restBaseUrl}/posts`,
      {
        author: ownerUrn,
        commentary: text,
        visibility: LinkedInVisibility.Public,
        distribution: {
          feedDistribution: LinkedInDistribution.MainFeed,
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          media: {
            id: videoUrn,
          },
        },
        lifecycleState: LinkedInPostLifecycleState.Published,
        isReshareDisabledByAuthor: false,
      },
      {
        headers: this.restHeaders(accessToken),
      },
    )

    return this.withCreatedPostId(response, 'createVideoPost')
  }

  async createResharePost(
    accessToken: string,
    ownerUrn: string,
    text: string,
    resharedPostUrn: string,
  ): Promise<LinkedInCreatedPostResponse> {
    const response = await this.http.post<LinkedInShareResponse>(
      `${this.restBaseUrl}/posts`,
      {
        author: ownerUrn,
        commentary: text,
        visibility: LinkedInVisibility.Public,
        reshareContext: { parent: resharedPostUrn },
        distribution: {
          feedDistribution: LinkedInDistribution.MainFeed,
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: LinkedInPostLifecycleState.Published,
      },
      { headers: this.restHeaders(accessToken) },
    )

    return this.withCreatedPostId(response, 'createResharePost')
  }

  async deletePost(accessToken: string, postUrn: string): Promise<boolean> {
    await this.http.delete(
      `${this.restBaseUrl}/posts/${encodeURIComponent(postUrn)}`,
      {
        headers: this.restHeaders(accessToken),
      },
    )
    return true
  }

  async listComments(
    accessToken: string,
    postUrn: string,
    params?: { start?: number, count?: number },
  ): Promise<LinkedInCommentListResponse> {
    const response = await this.http.get<LinkedInCommentListResponse>(
      `${this.restBaseUrl}/socialActions/${encodeURIComponent(postUrn)}/comments`,
      {
        headers: this.restHeaders(accessToken),
        params: {
          start: params?.start,
          count: params?.count,
        },
      },
    )
    return response.data
  }

  async createComment(
    accessToken: string,
    postUrn: string,
    message: string,
  ): Promise<LinkedInCommentCreateResponse> {
    const response = await this.http.post<LinkedInCommentCreateResponse>(
      `${this.restBaseUrl}/socialActions/${encodeURIComponent(postUrn)}/comments`,
      {
        actor: 'me',
        message: { text: message },
      },
      { headers: this.restHeaders(accessToken) },
    )
    return response.data
  }

  async deleteComment(
    accessToken: string,
    commentUrn: string,
  ): Promise<void> {
    await this.http.delete(
      `${this.restBaseUrl}/socialActions/${encodeURIComponent(commentUrn)}`,
      { headers: this.restHeaders(accessToken) },
    )
  }

  private withCreatedPostId(
    response: AxiosResponse<LinkedInShareResponse>,
    endpoint: string,
  ): LinkedInCreatedPostResponse {
    const { 'x-restli-id': headerId } = response.headers
    const id = (Array.isArray(headerId) ? headerId[0] : headerId) ?? response.data.id
    return this.withPostId({ ...response.data, id }, endpoint, response.data)
  }

  private withPostId<T extends { id?: string }>(
    data: T,
    endpoint: string,
    raw: unknown = data,
  ): T & { id: string } {
    if (!data.id) {
      throw LinkedInPlatformException.validation({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        category: PlatformErrorCategory.PlatformUnavailable,
        context: { endpoint },
        cause: { raw },
      })
    }
    return { ...data, id: data.id }
  }
}
