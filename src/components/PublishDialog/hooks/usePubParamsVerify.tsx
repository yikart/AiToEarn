import { memo, useMemo } from "react";
import { parseTopicString } from "@/utils";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import { PubItem } from "@/components/PublishDialog/publishDialog.type";
import { Alert } from "antd";
import { useTransClient } from "@/app/i18n/client";
import { PubType } from "@/app/config/publishConfig";

export interface ErrPubParamsItem {
  // 参数错误提示消息
  parErrMsg?: string;
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
          return setErrorMsg(t("validation.uploadImageOrVideo"));
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

        // 微信公众号的强制校验
        if (v.account.type === PlatType.WxGzh) {
          // 强制需要标题
          if (!v.params.title) {
            return setErrorMsg(t("validation.titleRequired"));
          }
        }

        // facebook的强制校验
        if (v.account.type === PlatType.Facebook) {
          switch (v.params.option.facebook?.content_category) {
            case "reel":
              // facebook reel 不支持图片，只支持视频 + 描述
              if ((v.params.images?.length || 0) !== 0) {
                return setErrorMsg(t("validation.facebookReelNoImage"));
              }
              break;
            case "story":
              // facebook story 只能选择图片、视频，不能有描述
              if (v.params.des) {
                return setErrorMsg(t("validation.facebookStoryNoDes"));
              }
              break;
          }
        }

        // instagram的强制校验
        if (v.account.type === PlatType.Instagram) {
          switch (v.params.option.instagram?.content_category) {
            case "post":
              // instagram post不能上传视频，必须上传图片
              if (v.params.video) {
                return setErrorMsg(t("validation.instagramPostNoVideo"));
              }
              break;
            case "reel":
              // instagram reel 不能上传图片，必须上传视频
              if ((v.params.images?.length || 0) !== 0) {
                return setErrorMsg(t("validation.instagramReelNoImage"));
              }
              break;
            case "story":
              // instagram story 只能选择图片、视频，不能有描述
              if (v.params.des) {
                return setErrorMsg(t("validation.instagramStoryNoDes"));
              }
              break;
          }
        }

        // Pinterest 的强制校验 
        if (v.account.type === PlatType.Pinterest) {
          // 强制需要标题
          if (!v.params.title) {
            return setErrorMsg(t("validation.titleRequired"));
          }
          // 强制需要选择Board
          if (!v.params.option.pinterest?.boardId) {
            return setErrorMsg(t("validation.boardRequired"));
          }
        }
      })();
    }
    return errParamsMapTemp;
  }, [data, t]);

  return {
    errParamsMap,
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
