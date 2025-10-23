import { memo, useMemo } from "react";
import { parseTopicString } from "@/utils";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import { PubItem } from "@/components/PublishDialog/publishDialog.type";
import { Alert } from "antd";
import { useTransClient } from "@/app/i18n/client";
import { PubType } from "@/app/config/publishConfig";
import { isAspectRatioMatch } from "@/components/PublishDialog/PublishDialog.util";

export interface ErrPubParamsItem {
  // 参数错误提示消息
  parErrMsg?: string;
  // 错误状态
  errStatus?: boolean;
}

export type ErrPubParamsMapType = Map<string | number, ErrPubParamsItem>;

/**
 * 发布参数校验是否复合平台规范
 * @param data
 */
export default function usePubParamsVerify(data: PubItem[]) {
  // 用于判断描述中的话题是否符合规范
  const descTopicRegex = /#\S+#\S+/;
  const { t } = useTransClient("publish");

  // 错误参数，发布之前会检测错误参数，防止平台无法发布
  const errParamsMap = useMemo(() => {
    const errParamsMapTemp: ErrPubParamsMapType = new Map();

    for (const v of data) {
      const platInfo = AccountPlatInfoMap.get(v.account!.type)!;
      const { topics } = parseTopicString(v.params.des || "");
      const topicsAll = [...new Set((v.params.topics ?? []).concat(topics))];
      const { topicMax } = platInfo.commonPubParamsConfig;
      const video = v.params.video;

      const setErrorMsg = (msg: string) => {
        errParamsMapTemp.set(v.account.id, {
          parErrMsg: msg,
        });
      };

      (() => {
        // ------------------------  通用参数校验  ------------------------

        // 描述校验
        if (
          (v.account.type === PlatType.Threads ||
            v.account.type === PlatType.Twitter) &&
          !v.params.des
        ) {
          return setErrorMsg(t("validation.descriptionRequired"));
        }

        // 标题字数校验
        if (
          v.params.title &&
          v.params.title.length > platInfo.commonPubParamsConfig.titleMax!
        ) {
          return setErrorMsg(
            t("validation.titleMaxExceeded", {
              platformName: platInfo.name,
              maxCount: platInfo.commonPubParamsConfig.titleMax,
            }),
          );
        }

        // 描述字数校验
        if (
          v.params.des &&
          v.params.des.length > platInfo.commonPubParamsConfig.desMax
        ) {
          return setErrorMsg(
            t("validation.descriptionMaxExceeded", {
              platformName: platInfo.name,
              maxCount: platInfo.commonPubParamsConfig.desMax,
            }),
          );
        }

        // 图片数量校验
        if (
          platInfo.pubTypes.has(PubType.ImageText) &&
          (v.params.images?.length || 0) > 1 &&
          v.params.images!.length > platInfo.commonPubParamsConfig.imagesMax!
        ) {
          return setErrorMsg(
            t("validation.imageMaxExceeded", {
              platformName: platInfo.name,
              maxCount: platInfo.commonPubParamsConfig.imagesMax,
            }),
          );
        }

        // 图片或者视频校验，视频和图片必须要上传一个
        if (
          !platInfo.pubTypes.has(PubType.Article) &&
          v.params.images?.length === 0 &&
          !v.params.video
        ) {
          let msgs: any = t("validation.uploadImageOrVideo");
          if (
            platInfo.pubTypes.has(PubType.ImageText) &&
            platInfo.pubTypes.has(PubType.VIDEO)
          ) {
            msgs = t("validation.uploadImageOrVideo");
          } else if (platInfo.pubTypes.has(PubType.ImageText)) {
            msgs = t("validation.uploadImage");
          } else if (platInfo.pubTypes.has(PubType.VIDEO)) {
            msgs = t("validation.uploadVideo");
          }
          return setErrorMsg(msgs);
        }

        // 话题数量校验
        if (topicsAll.length > topicMax) {
          return setErrorMsg(
            t("validation.topicMaxExceeded", {
              platformName: platInfo.name,
              maxCount: topicMax,
            }),
          );
        }

        // 判断描述中的话题中间是否用空格分割，如：#话题1#话题2#话题3 这种格式错误
        if (descTopicRegex.test(v.params.des || "")) {
          return setErrorMsg(t("validation.topicFormatError"));
        }

        // ------------------------  单个平台参数校验  ------------------------

        // b站的强制校验
        if (v.account.type === PlatType.BILIBILI) {
          // 强制需要标题
          if (!v.params.title) {
            return setErrorMsg(t("validation.titleRequired"));
          }
          // 强制需要话题
          if (topicsAll.length === 0) {
            return setErrorMsg(t("validation.topicRequired"));
          }
          if (!v.params.option.bilibili?.tid) {
            return setErrorMsg(t("validation.partitionRequired"));
          }
          if (
            v.params.option.bilibili.copyright === 2 &&
            !v.params.option.bilibili.source
          ) {
            return setErrorMsg(t("validation.sourceRequired"));
          }
        }

        // facebook的强制校验
        if (v.account.type === PlatType.Facebook) {
          switch (v.params.option.facebook?.content_category) {
            case "post":
              // facebook post 图片上限 ≤ 10MB
              if (v.params.images) {
                for (const img of v.params.images) {
                  if (img.size > 10 * 1024 * 1024) {
                    return setErrorMsg(t("validation.facebookPostImageSize"));
                  }
                }
              }
              break;
            case "reel":
              // facebook reel 不支持图片，只支持视频 + 描述
              if ((v.params.images?.length || 0) !== 0) {
                return setErrorMsg(t("validation.facebookReelNoImage"));
              }
              // facebook reel 视频时长 3–90 秒
              if (video && (video.duration > 90 || video.duration < 3)) {
                return setErrorMsg(t("validation.facebookReelDuration"));
              }
              break;
            case "story":
              // facebook story 只能选择图片、视频，不能有描述
              if (v.params.des) {
                return setErrorMsg(t("validation.facebookStoryNoDes"));
              }
              // facebook story 视频时长 3–4小时
              if (video && (video.duration > 14400 || video.duration < 3)) {
                return setErrorMsg(t("validation.facebookStoryDuration"));
              }
              // facebook story 图片上限 ≤ 4MB
              if (v.params.images) {
                for (const img of v.params.images) {
                  if (img.size > 4 * 1024 * 1024) {
                    return setErrorMsg(t("validation.facebookStoryImageSize"));
                  }
                }
              }
              break;
          }
        }

        // instagram的强制校验
        if (v.account.type === PlatType.Instagram) {
          // 视频大小 ≤ 100MB
          if (video && video.size > 100 * 1024 * 1024) {
            return setErrorMsg(t("validation.instagramVideoSize"));
          }
          // instagram 图片size上限8MB
          if (v.params.images) {
            for (const img of v.params.images) {
              if (img.size > 8 * 1024 * 1024) {
                return setErrorMsg(t("validation.instagramImageSize"));
              }
            }
          }

          switch (v.params.option.instagram?.content_category) {
            case "post":
              // instagram post不能上传视频，必须上传图片
              if (video) {
                return setErrorMsg(t("validation.instagramPostNoVideo"));
              }
              break;
            case "reel":
              // instagram reel 不能上传图片，必须上传视频
              if ((v.params.images?.length || 0) !== 0) {
                return setErrorMsg(t("validation.instagramReelNoImage"));
              }
              // instagram reel 视频时长 5秒 – 15 分钟
              if (video && (video.duration > 900 || video.duration < 5)) {
                return setErrorMsg(t("validation.instagramReelDuration"));
              }
              break;
            case "story":
              // instagram story 只能选择图片/视频，不能有描述
              if (v.params.des) {
                return setErrorMsg(t("validation.instagramStoryNoDes"));
              }
              // instagram story 视频时长 3–60 秒
              if (video && (video.duration > 60 || video.duration < 3)) {
                return setErrorMsg(t("validation.instagramStoryDuration"));
              }
              break;
          }
        }

        if (v.account.type === PlatType.Threads) {
          // Threads 视频大小限制 最大 1GB
          if (video && video.size > 1024 * 1024 * 1024) {
            return setErrorMsg(t("validation.threadsVideoSize"));
          }
          // Threads视频限制，最长 5 分钟，最短 > 0 秒
          if (video && (video.duration > 300 || video.duration <= 0)) {
            return setErrorMsg(t("validation.threadsVideoDuration"));
          }
          // Threads 图片限制，最少 2 张图片，最多 10 张图片
          if (v.params.images) {
            if (v.params.images.length < 2) {
              return setErrorMsg(t("validation.threadsImageMin"));
            }
          }
        }

        // Pinterest 的强制校验
        if (v.account.type === PlatType.Pinterest) {
          // 强制需要标题
          if (!v.params.title) {
            return setErrorMsg(t("validation.titleRequired"));
          }
          // 强制需要 选择Board
          if (!v.params.option.pinterest?.boardId) {
            return setErrorMsg(t("validation.boardRequired"));
          }
          // Pinterest 视频限制，4 秒–15 分钟
          if (video && (video.duration > 900 || video.duration < 4)) {
            return setErrorMsg(t("validation.pinterestVideoDuration"));
          }
          // Pinterest 视频大小≤ 1GB
          if (video && video.size > 1024 * 1024 * 1024) {
            return setErrorMsg(t("validation.pinterestVideoSize"));
          }
          // Pinterest图片size  ≤ 10MB
          if (v.params.images) {
            for (const img of v.params.images) {
              if (img.size > 10 * 1024 * 1024) {
                return setErrorMsg(t("validation.pinterestImageSize"));
              }
            }
          }
        }

        // YouTube 的强制校验
        if (v.account.type === PlatType.YouTube) {
          // 强制需要标题
          if (!v.params.title) {
            return setErrorMsg(t("validation.titleRequired"));
          }
          // 强制需要描述
          if (!v.params.des) {
            return setErrorMsg(t("validation.descriptionRequired"));
          }
          // 强制需要选择视频分类
          if (!v.params.option.youtube?.categoryId) {
            return setErrorMsg(t("validation.categoryRequired"));
          }
          // YouTube 视频大小限制 ≤ 256GB
          if (video && video.size > 256 * 1024 * 1024 * 1024) {
            return setErrorMsg(t("validation.youtubeVideoSize"));
          }
          // YouTube 视频时长限制 ≤ 12小时
          if (video && video.duration > 43200) {
            return setErrorMsg(t("validation.youtubeVideoDuration"));
          }
        }

        // TikTok 的强制校验
        if (v.account.type === PlatType.Tiktok) {
          // 	TikTok 视频时长限制 3 秒至 10 分钟
          if (video && (video.duration > 600 || video.duration < 3)) {
            return setErrorMsg(t("validation.tiktokVideoDuration"));
          }
          // TikTok视频大小限制1GB或更小
          if (video && video.size > 1024 * 1024 * 1024) {
            return setErrorMsg(t("validation.tiktokVideoSize"));
          }
          // TikTok限制视频最小高度和宽度为 360 像素
          if (video && (video.width < 360 || video.height < 360)) {
            return setErrorMsg(t("validation.tiktokVideoMinResolution"));
          }
          // TikTok 图片size限制 最多 20MB
          if (v.params.images) {
            for (const img of v.params.images) {
              if (img.size > 20 * 1024 * 1024) {
                return setErrorMsg(t("validation.tiktokImageSize"));
              }
            }
          }
          // TikTok 图片最大分辨率：1080 x 1920 像素或 1920 x 1080 像素
          if (v.params.images) {
            for (const img of v.params.images) {
              if (
                img.width > 1920 ||
                img.height > 1920 ||
                (img.width !== 1080 && img.width !== 1920) ||
                (img.height !== 1080 && img.height !== 1920)
              ) {
                return setErrorMsg(t("validation.tiktokImageResolution"));
              }
            }
          }
        }

        // Twitter 的强制校验
        if (v.account.type === PlatType.Twitter) {
          if (v.params.images) {
            for (const img of v.params.images) {
              // Twitter图片大小限制最大 5MB
              if (img.size > 5 * 1024 * 1024) {
                return setErrorMsg(t("validation.twitterImageSize"));
              }
              // Twitter最大 8192 × 8192 像素
              if (img.width > 8192 || img.height > 8192) {
                return setErrorMsg(t("validation.twitterImageResolution"));
              }
            }
          }
        }
      })();
    }
    return errParamsMapTemp;
  }, [data, t]);

  // 警告参数，警告参数不会阻止发布，只是提示用户可能存在的问题
  const warningParamsMap = useMemo(() => {
    const warningParamsMapTemp: ErrPubParamsMapType = new Map();

    for (const v of data) {
      const setWarningMsg = (msg: string) => {
        warningParamsMapTemp.set(v.account.id, {
          parErrMsg: msg,
        });
      };

      // Instagram 警告消息
      if (v.account.type === PlatType.Instagram) {
        // 图片比例判断
        if (
          v.params.option.instagram?.content_category === "post" &&
          v.params.images &&
          v.params.images.length > 0
        ) {
          for (const img of v.params.images) {
            if (!isAspectRatioMatch(img.width, img.height, 4 / 5)) {
              setWarningMsg(t("validation.instagramImageValidation"));
              break;
            }
          }
        }
      }

      // YouTube 警告消息
      if (v.account.type === PlatType.YouTube) {
        // 建议分辨率：1920×1080（16:9）或 1080×1920（9:16）。
        if (v.params.video) {
          const video = v.params.video;
          if (
            !isAspectRatioMatch(video.width, video.height, 16 / 9) &&
            !isAspectRatioMatch(video.width, video.height, 9 / 16)
          ) {
            setWarningMsg(t("validation.youtubeResolutionSuggestion"));
          }
        }
      }

      // 快手 警告消息
      if (v.account.type === PlatType.KWAI) {
        // 推荐分辨率：1080x1920（竖屏）
        if (v.params.video) {
          const video = v.params.video;
          if (!isAspectRatioMatch(video.width, video.height, 9 / 16)) {
            setWarningMsg(t("validation.kwaiResolutionSuggestion"));
          }
        }
        // 时长建议：15 秒 - 3 分钟
        if (v.params.video) {
          const video = v.params.video;
          if (video.duration < 15 || video.duration > 180) {
            setWarningMsg(t("validation.kwaiDurationSuggestion"));
          }
        }
      }
    }
    return warningParamsMapTemp;
  }, [data, t]);

  return {
    errParamsMap,
    warningParamsMap,
  };
}

// 用于展示校验的结果
export const PubParamsVerifyInfo = memo(
  ({ errItem }: { errItem?: ErrPubParamsItem }) => {
    return (
      <>
        {errItem && (
          <Alert
            type="warning"
            showIcon
            message={<p style={{ textAlign: "left" }}>{errItem.parErrMsg}</p>}
            style={{
              marginBottom: "15px",
              padding: "6px 10px",
              fontSize: "12px",
            }}
          />
        )}
      </>
    );
  },
);
