import { memo, useMemo } from "react";
import { parseTopicString } from "@/utils";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import { PubItem } from "@/components/PublishDialog/publishDialog.type";
import { Alert } from "antd";
import { useTransClient } from "@/app/i18n/client";

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
      const topicsAll = [...new Set(v.params.topics?.concat(topics))];
      const { topicMax } = platInfo.commonPubParamsConfig;

      const setErrorMsg = (msg: string) => {
        errParamsMapTemp.set(v.account.id, {
          parErrMsg: msg,
        });
      };

      (() => {
        // ------------------------  通用参数校验  ------------------------

        // 图片或者视频校验，视频和图片必须要上传一个
        if (v.params.images?.length === 0 && !v.params.video) {
          return setErrorMsg(t("validation.uploadImageOrVideo"));
        }
        // 话题校验
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

        // 快手的强制校验
        if (v.account.type === PlatType.KWAI) {
          if (
            v.params.video?.cover &&
            (v.params.video.cover.width < 400 ||
              v.params.video.cover.height < 400)
          ) {
            return setErrorMsg(t("validation.coverSizeError"));
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
