import { AccountInfo, AccountPlatInfoMap } from '../../account/comment';
import { IPubParams } from '../children/videoPage/videoPage';
import { useMemo } from 'react';
import { parseTopicString } from '../../../utils';
import { AccountStatus, AccountType } from '../../../../commont/AccountEnum';

// 错误状态
export enum PubParamsErrStatusEnum {
  // 登录错误
  LOGIN = 1,
  // 参数错误
  PARAMS = 2,
}

export interface ErrPubParamsItem {
  message: string;
  // 同 AlertProps.type
  type: 'warning' | 'error';
  errType: PubParamsErrStatusEnum;
  // 参数错误提示消息
  parErrMsg?: string;
  plat?: AccountType;
}

export type ErrPubParamsMapType = Map<string | number, ErrPubParamsItem>;

/**
 * 发布参数校验是否复合平台规范
 * @param data
 */
export default function (
  data: {
    id: string | number;
    account?: AccountInfo;
    pubParams: IPubParams;
  }[],
) {
  const errParamsMap = useMemo(() => {
    const errParamsMapTemp: ErrPubParamsMapType = new Map();
    for (const v of data) {
      if (!v.account) continue;
      const platInfo = AccountPlatInfoMap.get(v.account!.type)!;
      const { topics } = parseTopicString(v.pubParams.describe || '');
      const topicsAll = [...new Set(v.pubParams.topics?.concat(topics))];
      const { topicMax } = platInfo.commonPubParamsConfig;

      if (v.account && v.account.status === AccountStatus.DISABLE) {
        // 登录状态校验
        errParamsMapTemp.set(v.id, {
          message: '登录失效',
          type: 'warning',
          errType: PubParamsErrStatusEnum.LOGIN,
          parErrMsg: '登录失效，请重新登录',
        });
      } else if (
        v.account?.type === AccountType.KWAI &&
        v.pubParams.cover &&
        (v.pubParams.cover.width < 400 || v.pubParams.cover.height < 400)
      ) {
        // 快手要求封面必须大于 400x400
        errParamsMapTemp.set(v.id, {
          message: '参数错误',
          type: 'error',
          errType: PubParamsErrStatusEnum.PARAMS,
          parErrMsg: '封面最小尺寸400*400',
        });
      } else if (topicsAll.length > topicMax) {
        // 话题校验
        errParamsMapTemp.set(v.id, {
          message: '参数错误',
          type: 'error',
          errType: PubParamsErrStatusEnum.PARAMS,
          parErrMsg: `${platInfo.name}话题最多不能超过${topicMax}个`,
        });
      } else if (
        v.account?.type === AccountType.Douyin &&
        topicsAll.length +
          v.pubParams.diffParams![AccountType.Douyin]!.activitys!.length >
          topicMax
      ) {
        /**
         * 抖音的话题和活动奖励校验
         * 抖音规定活动奖励 ＋ 话题不能超过5个
         */
        errParamsMapTemp.set(v.id, {
          message: '参数错误',
          type: 'error',
          errType: PubParamsErrStatusEnum.PARAMS,
          parErrMsg: `话题 + 活动奖励不能超过${topicMax}个`,
        });
      }
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

  return {
    errParamsMap,
  };
}
