import { memo, useMemo } from "react";
import { parseTopicString } from "@/utils";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import { PubItem } from "@/components/PublishDialog/publishDialog.type";
import { Alert } from "antd";

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
          return setErrorMsg("请上传图片或视频");
        }
        // 话题校验
        if (topicsAll.length > topicMax) {
          return setErrorMsg(`${platInfo.name}话题最多不能超过${topicMax}个`);
        }
        // 判断描述中的话题中间是否用空格分割，如：#话题1#话题2#话题3 这种格式错误
        if (descTopicRegex.test(v.params.des || "")) {
          return setErrorMsg(
            `描述中的话题必须使用空格分割，如：“#话题1 #话题2”`,
          );
        }

        // ------------------------  单个平台参数校验  ------------------------

        // b站的强制校验
        if (v.account.type === PlatType.BILIBILI) {
          // 强制需要标题
          if (!v.params.title) {
            return setErrorMsg("标题是必须的");
          }
          if (!v.params.option.bilibili?.tid) {
            return setErrorMsg("您必须选择分区!");
          }
          if (
            v.params.option.bilibili.copyright === 2 &&
            !v.params.option.bilibili.source
          ) {
            return setErrorMsg("转载时必须填写转载来源!");
          }
        }

        // Facebook的强制校验
        if (v.account.type === PlatType.Facebook) {
          if (!v.params.option.facebook?.page_id) {    
            return setErrorMsg("您必须选择页面!");
          }
        }

        // 快手的强制校验
        if (v.account.type === PlatType.KWAI) {
          if (
            v.params.video?.cover &&
            (v.params.video.cover.width < 400 ||
              v.params.video.cover.height < 400)
          ) {
            return setErrorMsg("封面最小尺寸400*400!");
          }
        }
      })();
    }
    return errParamsMapTemp;
  }, [data]);

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
