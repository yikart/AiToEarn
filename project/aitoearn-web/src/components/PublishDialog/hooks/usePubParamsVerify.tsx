import type { PubItem } from '@/components/PublishDialog/publishDialog.type'
import { AlertTriangle } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { UploadTaskStatusEnum } from '@/components/PublishDialog/compoents/PublishManageUpload/publishManageUpload.enum'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import {
  isAspectRatioInRange,
  isAspectRatioMatch,
} from '@/components/PublishDialog/PublishDialog.util'
import { parseTopicString } from '@/utils'

export interface ErrPubParamsItem {
  // 参数错误提示消息（兼容旧版，显示第一个错误）
  parErrMsg?: string
  // 所有错误消息列表
  parErrMsgs?: string[]
  // 错误状态
  errStatus?: boolean
}

export type ErrPubParamsMapType = Map<string | number, ErrPubParamsItem>

/**
 * 发布参数校验是否复合平台规范
 * @param data
 */
export default function usePubParamsVerify(data: PubItem[]) {
  // 用于判断描述中的话题是否符合规范
  const descTopicRegex = /#\S+#\S+/
  const { t } = useTranslation('publish')

  const tasks = usePublishManageUpload(state => state.tasks)

  // 错误参数，发布之前会检测错误参数，防止平台无法发布
  const errParamsMap = useMemo(() => {
    const errParamsMapTemp: ErrPubParamsMapType = new Map()
    for (const v of data) {
      const platInfo = AccountPlatInfoMap.get(v.account!.type)!
      const { topics } = parseTopicString(v.params.des || '')
      const topicsAll = [...new Set((v.params.topics ?? []).concat(topics))]
      const { topicMax } = platInfo.commonPubParamsConfig
      const video = v.params.video

      // 收集当前账号的所有错误
      const errors: string[] = []
      const addErrorMsg = (msg: string) => {
        errors.push(msg)
      }

      // ------------------------  通用参数校验  ------------------------

      // 媒体上传完成校验（阻止在上传未完成时发布）
      const hasImages = (v.params.images?.length || 0) > 0
      const hasVideo = Boolean(v.params.video)

      const isImageUploaded = (img: any) => {
        return (
          !!img?.ossUrl
          || (img?.uploadTaskId && tasks[img.uploadTaskId]?.status === UploadTaskStatusEnum.Success)
        )
      }

      const isVideoUploaded = (vd: any) => {
        const videoOk
          = !!vd?.ossUrl
            || (vd?.uploadTaskIds?.video
              && tasks[vd.uploadTaskIds.video]?.status === UploadTaskStatusEnum.Success)

        const coverOk
          = !!vd?.cover?.ossUrl
            || (vd?.uploadTaskIds?.cover
              && tasks[vd.uploadTaskIds.cover]?.status === UploadTaskStatusEnum.Success)
        return videoOk && coverOk
      }

      if (hasImages) {
        const notFinished = (v.params.images || []).some(img => !isImageUploaded(img))
        if (notFinished) {
          addErrorMsg(t('upload.finishingUp'))
        }
      }

      if (hasVideo) {
        if (!isVideoUploaded(v.params.video)) {
          addErrorMsg(t('upload.finishingUp'))
        }
      }

      // 描述校验
      if (
        (v.account.type === PlatType.Threads || v.account.type === PlatType.Twitter)
        && !v.params.des
      ) {
        addErrorMsg(t('validation.descriptionRequired'))
      }

      // 标题字数校验
      if (v.params.title && v.params.title.length > platInfo.commonPubParamsConfig.titleMax!) {
        addErrorMsg(
          t('validation.titleMaxExceeded', {
            platformName: platInfo.name,
            maxCount: platInfo.commonPubParamsConfig.titleMax,
          }),
        )
      }

      // 描述字数校验
      if (v.params.des && v.params.des.length > platInfo.commonPubParamsConfig.desMax) {
        addErrorMsg(
          t('validation.descriptionMaxExceeded', {
            platformName: platInfo.name,
            maxCount: platInfo.commonPubParamsConfig.desMax,
          }),
        )
      }

      // 图片数量校验
      if (
        platInfo.pubTypes.has(PubType.ImageText)
        && (v.params.images?.length || 0) > 1
        && v.params.images!.length > platInfo.commonPubParamsConfig.imagesMax!
      ) {
        addErrorMsg(
          t('validation.imageMaxExceeded', {
            platformName: platInfo.name,
            maxCount: platInfo.commonPubParamsConfig.imagesMax,
          }),
        )
      }

      // 图片或者视频校验，视频和图片必须要上传一个
      if (
        !platInfo.pubTypes.has(PubType.Article)
        && v.params.images?.length === 0
        && !v.params.video
      ) {
        let msgs: any = t('validation.uploadImageOrVideo')
        if (platInfo.pubTypes.has(PubType.ImageText) && platInfo.pubTypes.has(PubType.VIDEO)) {
          msgs = t('validation.uploadImageOrVideo')
        }
        else if (platInfo.pubTypes.has(PubType.ImageText)) {
          msgs = t('validation.uploadImage')
        }
        else if (platInfo.pubTypes.has(PubType.VIDEO)) {
          msgs = t('validation.uploadVideo')
        }
        addErrorMsg(msgs)
      }

      // 话题数量校验
      if (topicsAll.length > topicMax) {
        addErrorMsg(
          t('validation.topicMaxExceeded', {
            platformName: platInfo.name,
            maxCount: topicMax,
          }),
        )
      }

      // 判断描述中的话题中间是否用空格分割，如：#话题1#话题2#话题3 这种格式错误
      if (descTopicRegex.test(v.params.des || '')) {
        addErrorMsg(t('validation.topicFormatError'))
      }

      // ------------------------  单个平台参数校验  ------------------------

      // b站的强制校验
      if (v.account.type === PlatType.BILIBILI) {
        // 强制需要标题
        if (!v.params.title) {
          addErrorMsg(t('validation.titleRequired'))
        }
        // 强制需要话题
        if (topicsAll.length === 0) {
          addErrorMsg(t('validation.topicRequired'))
        }
        if (!v.params.option.bilibili?.tid) {
          addErrorMsg(t('validation.partitionRequired'))
        }
        if (v.params.option.bilibili?.copyright === 2 && !v.params.option.bilibili.source) {
          addErrorMsg(t('validation.sourceRequired'))
        }
      }

      // facebook的强制校验
      if (v.account.type === PlatType.Facebook) {
        switch (v.params.option.facebook?.content_category) {
          case 'post':
            // facebook post 图片上限 ≤ 10MB
            if (v.params.images) {
              for (const img of v.params.images) {
                if (img.size > 10 * 1024 * 1024) {
                  addErrorMsg(t('validation.facebookPostImageSize'))
                  break
                }
              }
            }
            break
          case 'reel':
            // facebook reel 不支持图片，只支持视频 + 描述
            if ((v.params.images?.length || 0) !== 0) {
              addErrorMsg(t('validation.facebookReelNoImage'))
            }
            // facebook reel 视频时长 3–90 秒
            if (video && (video.duration > 90 || video.duration < 3)) {
              addErrorMsg(t('validation.facebookReelDuration'))
            }
            break
          case 'story':
            // facebook story 只能选择图片、视频，不能有描述
            if (v.params.des) {
              addErrorMsg(t('validation.facebookStoryNoDes'))
            }
            // facebook story 视频时长 3–4小时
            if (video && (video.duration > 14400 || video.duration < 3)) {
              addErrorMsg(t('validation.facebookStoryDuration'))
            }
            // facebook story 图片上限 ≤ 4MB
            if (v.params.images) {
              for (const img of v.params.images) {
                if (img.size > 4 * 1024 * 1024) {
                  addErrorMsg(t('validation.facebookStoryImageSize'))
                  break
                }
              }
            }
            break
        }
      }

      // instagram的强制校验
      if (v.account.type === PlatType.Instagram) {
        // 视频大小 ≤ 100MB
        if (video && video.size > 100 * 1024 * 1024) {
          addErrorMsg(t('validation.instagramVideoSize'))
        }
        // instagram 图片size上限8MB
        if (v.params.images) {
          for (const img of v.params.images) {
            if (img.size > 8 * 1024 * 1024) {
              addErrorMsg(t('validation.instagramImageSize'))
              break
            }
          }
        }

        // 图片比例判断
        if (
          v.params.option.instagram?.content_category === 'post'
          && v.params.images
          && v.params.images.length > 0
        ) {
          for (const img of v.params.images) {
            // Instagram Post 图片比例范围：4:5 ~ 1.91:1 (0.8 ~ 1.91)
            if (!isAspectRatioInRange(img.width, img.height, 4 / 5, 1.91)) {
              addErrorMsg(t('validation.instagramImageValidation'))
              break
            }
          }
        }

        switch (v.params.option.instagram?.content_category) {
          case 'post':
            // instagram post不能上传视频，必须上传图片
            if (video) {
              addErrorMsg(t('validation.instagramPostNoVideo'))
            }
            break
          case 'reel':
            // instagram reel 不能上传图片，必须上传视频 1
            if ((v.params.images?.length || 0) !== 0) {
              addErrorMsg(t('validation.instagramReelNoImage'))
            }
            // instagram reel 视频时长 5秒 – 15 分钟
            if (video && (video.duration > 900 || video.duration < 5)) {
              addErrorMsg(t('validation.instagramReelDuration'))
            }
            // instagram reel 视频宽高比限制：4:5 ~ 9:16 (0.8 ~ 0.5625)
            if (video && !isAspectRatioInRange(video.width, video.height, 9 / 16, 4 / 5)) {
              addErrorMsg(t('validation.instagramReelAspectRatio' as any))
            }
            break
          case 'story':
            // instagram story 只能选择图片/视频，不能有描述
            if (v.params.des) {
              addErrorMsg(t('validation.instagramStoryNoDes'))
            }
            // instagram story 视频时长 3–60 秒
            if (video && (video.duration > 60 || video.duration < 3)) {
              addErrorMsg(t('validation.instagramStoryDuration'))
            }
            break
        }
      }

      if (v.account.type === PlatType.Threads) {
        // Threads 视频大小限制 最大 1GB
        if (video && video.size > 1024 * 1024 * 1024) {
          addErrorMsg(t('validation.threadsVideoSize'))
        }
        // Threads视频限制，最长 5 分钟，最短 > 0 秒
        if (video && (video.duration > 300 || video.duration <= 0)) {
          addErrorMsg(t('validation.threadsVideoDuration'))
        }
      }

      // Pinterest 的强制校验
      if (v.account.type === PlatType.Pinterest) {
        // 强制需要标题
        if (!v.params.title) {
          addErrorMsg(t('validation.titleRequired'))
        }
        // 强制需要 选择Board
        if (!v.params.option.pinterest?.boardId) {
          addErrorMsg(t('validation.boardRequired'))
        }
        // Pinterest 视频限制，4 秒–15 分钟
        if (video && (video.duration > 900 || video.duration < 4)) {
          addErrorMsg(t('validation.pinterestVideoDuration'))
        }
        // Pinterest 视频大小≤ 1GB
        if (video && video.size > 1024 * 1024 * 1024) {
          addErrorMsg(t('validation.pinterestVideoSize'))
        }
        // Pinterest图片size  ≤ 10MB
        if (v.params.images) {
          for (const img of v.params.images) {
            if (img.size > 10 * 1024 * 1024) {
              addErrorMsg(t('validation.pinterestImageSize'))
              break
            }
          }
        }
      }

      // YouTube 的强制校验
      if (v.account.type === PlatType.YouTube) {
        // 强制需要标题
        if (!v.params.title) {
          addErrorMsg(t('validation.titleRequired'))
        }
        // 强制需要描述
        if (!v.params.des) {
          addErrorMsg(t('validation.descriptionRequired'))
        }
        // 强制需要选择视频分类
        if (!v.params.option.youtube?.categoryId) {
          addErrorMsg(t('validation.categoryRequired' as any))
        }
        // YouTube 视频大小限制 ≤ 256GB
        if (video && video.size > 256 * 1024 * 1024 * 1024) {
          addErrorMsg(t('validation.youtubeVideoSize' as any))
        }
        // YouTube 视频时长限制 ≤ 12小时
        if (video && video.duration > 43200) {
          addErrorMsg(t('validation.youtubeVideoDuration' as any))
        }
      }

      // TikTok 的强制校验
      if (v.account.type === PlatType.Tiktok) {
        // TikTok 视频时长限制 3 秒至 10 分钟
        if (video && (video.duration > 600 || video.duration < 3)) {
          addErrorMsg(t('validation.tiktokVideoDuration'))
        }
        // TikTok视频大小限制1GB或更小
        if (video && video.size > 1024 * 1024 * 1024) {
          addErrorMsg(t('validation.tiktokVideoSize'))
        }
        // TikTok限制视频最小高度和宽度为 360 像素
        if (video && (video.width < 360 || video.height < 360)) {
          addErrorMsg(t('validation.tiktokVideoMinResolution'))
        }
        // TikTok 图片size限制 最多 20MB
        if (v.params.images) {
          for (const img of v.params.images) {
            if (img.size > 20 * 1024 * 1024) {
              addErrorMsg(t('validation.tiktokImageSize'))
              break
            }
          }
        }
        // TikTok 图片最大分辨率：1080 x 1920 像素或 1920 x 1080 像素
        if (v.params.images) {
          for (const img of v.params.images) {
            if (
              img.width > 1920
              || img.height > 1920
              || (img.width !== 1080 && img.width !== 1920)
              || (img.height !== 1080 && img.height !== 1920)
            ) {
              addErrorMsg(t('validation.tiktokImageResolution'))
              break
            }
          }
        }
        // TikTok 内容披露校验：开启披露但未选择任何选项
        const tiktokOption = v.params.option.tiktok
        // TikTok 隐私级别必填校验
        if (!tiktokOption?.privacy_level) {
          addErrorMsg(t('validation.tiktokPrivacyLevelRequired'))
        }
        if (
          tiktokOption?.brand_disclosure_enabled === true
          && !tiktokOption?.brand_organic_toggle
          && !tiktokOption?.brand_content_toggle
        ) {
          addErrorMsg(t('validation.tiktokContentDisclosureRequired'))
        }
      }

      // Twitter 的强制校验
      if (v.account.type === PlatType.Twitter) {
        if (v.params.images) {
          for (const img of v.params.images) {
            // Twitter图片大小限制最大 5MB
            if (img.size > 5 * 1024 * 1024) {
              addErrorMsg(t('validation.twitterImageSize'))
              break
            }
            // Twitter最大 8192 × 8192 像素
            if (img.width > 8192 || img.height > 8192) {
              addErrorMsg(t('validation.twitterImageResolution'))
              break
            }
          }
        }
      }

      // 如果有错误，保存到 Map 中
      if (errors.length > 0) {
        errParamsMapTemp.set(v.account.id, {
          parErrMsg: errors[0], // 兼容旧版，显示第一个错误
          parErrMsgs: errors, // 所有错误
        })
      }
    }
    return errParamsMapTemp
  }, [data, t, tasks])

  // 警告参数，警告参数不会阻止发布，只是提示用户可能存在的问题
  const warningParamsMap = useMemo(() => {
    const warningParamsMapTemp: ErrPubParamsMapType = new Map()

    for (const v of data) {
      // 收集当前账号的所有警告
      const warnings: string[] = []
      const addWarningMsg = (msg: string) => {
        warnings.push(msg)
      }

      // YouTube 警告消息
      if (v.account.type === PlatType.YouTube) {
        // 建议分辨率：1920×1080（16:9）或 1080×1920（9:16）。
        if (v.params.video) {
          const video = v.params.video
          if (
            !isAspectRatioMatch(video.width, video.height, 16 / 9)
            && !isAspectRatioMatch(video.width, video.height, 9 / 16)
          ) {
            addWarningMsg(t('validation.youtubeResolutionSuggestion'))
          }
        }
      }

      // 快手 警告消息
      if (v.account.type === PlatType.KWAI) {
        // 推荐分辨率：1080x1920（竖屏）
        if (v.params.video) {
          const video = v.params.video
          if (!isAspectRatioMatch(video.width, video.height, 9 / 16)) {
            addWarningMsg(t('validation.kwaiResolutionSuggestion'))
          }
        }
        // 时长建议：15 秒 - 3 分钟
        if (v.params.video) {
          const video = v.params.video
          if (video.duration < 15 || video.duration > 180) {
            addWarningMsg(t('validation.kwaiDurationSuggestion'))
          }
        }
      }

      // 如果有警告，保存到 Map 中
      if (warnings.length > 0) {
        warningParamsMapTemp.set(v.account.id, {
          parErrMsg: warnings[0], // 兼容旧版，显示第一个警告
          parErrMsgs: warnings, // 所有警告
        })
      }
    }
    return warningParamsMapTemp
  }, [data, t])

  return {
    errParamsMap,
    warningParamsMap,
  }
}

// 用于展示校验的结果
export const PubParamsVerifyInfo = memo(({ errItem }: { errItem?: ErrPubParamsItem }) => {
  return (
    <>
      {errItem && (
        <div className="flex items-start gap-2 mb-4 p-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-xs">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-left text-yellow-800 dark:text-yellow-200">{errItem.parErrMsg}</p>
        </div>
      )}
    </>
  )
})
