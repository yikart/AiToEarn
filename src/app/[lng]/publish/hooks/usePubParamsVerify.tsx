import { memo, useMemo } from "react";
import { parseTopicString } from "@/utils";
import { Alert, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import {
  AccountInfo,
  IPubParams,
} from "@/app/[lng]/publish/videoPage/videoPage";
import {
  AccountPlatInfoMap,
  IAccountPlatInfo,
  PlatType,
} from "@/app/config/platConfig";
import { AccountStatus } from "@/app/config/accountConfig";

// 错误状态
export enum PubParamsErrStatusEnum {
  // 登录错误
  LOGIN = 1,
  // 参数错误
  PARAMS = 2,
}
export interface ErrPubParamsItem {
  // 这个错误提示会在账户tab显示
  message: string;
  // 错误类型，用户区分是否需要显示重新登录的错误提示
  errType: PubParamsErrStatusEnum;
  // 参数错误提示消息
  parErrMsg?: string;
  // 发生错误的平台
  plat?: PlatType;
}

export type ErrPubParamsMapType = Map<string | number, ErrPubParamsItem>;

interface IPubParamsVerifyItem<T = undefined> {
  id: string | number;
  account?: AccountInfo;
  pubParams: IPubParams;
  other: T;
}

/**
 * 发布参数校验是否复合平台规范
 * @param data
 * @param moreVerify
 */
export default function <T>(
  data: IPubParamsVerifyItem<T>[],
  moreVerify?: {
    // 错误参数扩展
    moreErrorVerifyCallback?: (
      item: IPubParamsVerifyItem<T>,
      errParamsMapTemp: ErrPubParamsMapType,
      platInfo: IAccountPlatInfo,
    ) => void;
    // 警告参数扩展
    moreWranVerifyCallback?: (
      item: IPubParamsVerifyItem<T>,
      wranParamsMapTemp: ErrPubParamsMapType,
      platInfo: IAccountPlatInfo,
    ) => void;
  },
) {
  // 用于判断描述中的话题是否符合规范
  const descTopicRegex = /#\S+#\S+/;

  // 错误参数，发布之前会检测错误参数，防止平台无法发布
  const errParamsMap = useMemo(() => {
    const errParamsMapTemp: ErrPubParamsMapType = new Map();
    for (const v of data) {
      if (!v.account) continue;
      const platInfo = AccountPlatInfoMap.get(v.account!.type)!;
      const { topics } = parseTopicString(v.pubParams.describe || "");
      const topicsAll = [...new Set(v.pubParams.topics?.concat(topics))];
      const { topicMax } = platInfo.commonPubParamsConfig;

      (() => {
        // 错误信息---------------------
        // 登录状态校验
        if (v.account && v.account.status === AccountStatus.DISABLE) {
          return errParamsMapTemp.set(v.id, {
            message: "登录失效",
            errType: PubParamsErrStatusEnum.LOGIN,
            parErrMsg: "登录失效，请重新登录",
          });
        }
        // 快手要求封面必须大于 400x400
        if (
          v.account?.type === PlatType.KWAI &&
          v.pubParams.cover &&
          (v.pubParams.cover.width < 400 || v.pubParams.cover.height < 400)
        ) {
          return errParamsMapTemp.set(v.id, {
            message: "参数错误",
            errType: PubParamsErrStatusEnum.PARAMS,
            parErrMsg: "封面最小尺寸400*400",
          });
        }
        // 话题校验
        if (topicsAll.length > topicMax) {
          return errParamsMapTemp.set(v.id, {
            message: "参数错误",
            errType: PubParamsErrStatusEnum.PARAMS,
            parErrMsg: `${platInfo.name}话题最多不能超过${topicMax}个`,
          });
        }
        /**
         * 抖音的话题和活动奖励校验
         * 抖音规定活动奖励 ＋ 话题不能超过5个
         */
        if (
          v.account?.type === PlatType.Douyin &&
          topicsAll.length +
            v.pubParams.diffParams![PlatType.Douyin]!.activitys!.length >
            topicMax
        ) {
          return errParamsMapTemp.set(v.id, {
            message: "参数错误",
            errType: PubParamsErrStatusEnum.PARAMS,
            parErrMsg: `话题 + 活动奖励不能超过${topicMax}个`,
          });
        }
        // 判断描述中的话题中间是否用空格分割，如：#话题1#话题2#话题3 这种格式错误
        if (descTopicRegex.test(v.pubParams.describe || "")) {
          return errParamsMapTemp.set(v.id, {
            message: "参数错误",
            errType: PubParamsErrStatusEnum.PARAMS,
            parErrMsg: `描述中的话题必须使用空格分割，如：“#话题1 #话题2”`,
          });
        }

        if (moreVerify?.moreErrorVerifyCallback)
          moreVerify?.moreErrorVerifyCallback(v, errParamsMapTemp, platInfo);
      })();

      // 通用参数
      if (errParamsMapTemp.has(v.id)) {
        errParamsMapTemp.set(v.id, {
          ...errParamsMapTemp.get(v.id)!,
          plat: v.account.type,
        });
      }
    }
    return errParamsMapTemp;
  }, [data]);

  // 警告参数，警告参数只会展示，不会阻止平台发布
  const warnParamsMap = useMemo(() => {
    const warnParamsMapTemp: ErrPubParamsMapType = new Map();
    for (const v of data) {
      if (!v.account) continue;
      const platInfo = AccountPlatInfoMap.get(v.account!.type)!;

      if (moreVerify?.moreWranVerifyCallback)
        moreVerify?.moreWranVerifyCallback(v, warnParamsMapTemp, platInfo);
    }
    return warnParamsMapTemp;
  }, [data]);

  return {
    errParamsMap,
    warnParamsMap,
  };
}

// 用于展示校验的结果
export const PubParamsVerifyInfo = memo(
  ({
    id,
    warnParamsMap,
    errParamsMap,
    onAccountRestart,
    style,
  }: {
    id?: string | number;
    errParamsMap?: ErrPubParamsMapType;
    warnParamsMap?: ErrPubParamsMapType;
    onAccountRestart: (plat?: PlatType) => void;
    style?: React.CSSProperties;
  }) => {
    const errPubParams = useMemo(() => {
      let errPubParams: ErrPubParamsItem | undefined = undefined;
      if (!errParamsMap) return errPubParams;
      for (const [itemId, errPubParamsItem] of errParamsMap) {
        if (itemId === id) {
          errPubParams = errPubParamsItem;
          break;
        }
      }
      return errPubParams;
    }, [id, errParamsMap]);

    const paramsWarningList = useMemo(() => {
      if (!warnParamsMap) return [];
      return Array.from(warnParamsMap)
        .map(([itemId, item]) => (itemId === id ? item : undefined))
        .filter((v) => v !== undefined);
    }, [warnParamsMap, id]);

    return (
      <>
        {errPubParams && (
          <Alert
            type="error"
            showIcon
            message={
              errPubParams.errType === PubParamsErrStatusEnum.LOGIN ? (
                <>
                  登录失效，请
                  <a
                    style={{ fontSize: "13px" }}
                    onClick={() => {
                      onAccountRestart(errPubParams.plat);
                    }}
                  >
                    重新登录
                  </a>
                </>
              ) : (
                errPubParams.parErrMsg
              )
            }
            style={style}
          />
        )}

        {paramsWarningList.length !== 0 && (
          <Alert
            type="warning"
            showIcon
            icon={
              <Tooltip title="这是参数警告，参数警告不会阻止您的发布！">
                <InfoCircleOutlined />
              </Tooltip>
            }
            message={
              <>
                {paramsWarningList.map((v, i) => {
                  return <p key={i}>{v.parErrMsg}</p>;
                })}
              </>
            }
            style={style}
          />
        )}
      </>
    );
  },
);
