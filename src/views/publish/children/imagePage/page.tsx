import styles from './image.module.scss';
import { useShallow } from 'zustand/react/shallow';
import { useImagePageStore } from './useImagePageStore';
import ImageLeftSetting from './components/ImageLeftSetting/ImageLeftSetting';
import ImageRightSetting from './components/ImageRightSetting/ImageRightSetting';
import { Button, message, Modal, Popconfirm, Space } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import usePubParamsVerify, {
  PubParamsErrStatusEnum,
} from '../../hooks/usePubParamsVerify';
import PubAccountDetModule, {
  IPubAccountDetModuleRef,
} from '../../components/PubAccountDetModule/PubAccountDetModule';
import { PublishProgressRes } from '../../../../../electron/main/plat/pub/PubItemVideo';
import PubProgressModule from '../../components/PubProgressModule/PubProgressModule';
import { onImgTextPublishProgress } from '../../../../icp/receiveMsg';
import {
  icpCreateImgTextPubRecord,
  icpCreatePubRecord,
  icpPubImgText,
} from '../../../../icp/publish';
import { PubType } from '../../../../../commont/publish/PublishEnum';
import { useAccountStore } from '../../../../store/commont';
import { useNavigate } from 'react-router-dom';
import { usePubStroe } from '../../../../store/pubStroe';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { AccountPlatInfoMap } from '../../../account/comment';

const { confirm } = Modal;

export default function Page() {
  const {
    clear,
    images,
    imageAccounts,
    setActivePlat,
    setPlatActiveAccountMap,
    setErrParamsMap,
    updateAccounts,
    setTempSaveParams,
    commonPubParams,
  } = useImagePageStore(
    useShallow((state) => ({
      clear: state.clear,
      images: state.images,
      imageAccounts: state.imageAccounts,
      setPlatActiveAccountMap: state.setPlatActiveAccountMap,
      setActivePlat: state.setActivePlat,
      setErrParamsMap: state.setErrParamsMap,
      updateAccounts: state.updateAccounts,
      commonPubParams: state.commonPubParams,
      setTempSaveParams: state.setTempSaveParams,
    })),
  );
  const { errParamsMap, warnParamsMap } = usePubParamsVerify(
    imageAccounts.map((v) => {
      return {
        id: v.account.id,
        account: v.account,
        pubParams: v.pubParams,
      };
    }),
    {
      moreWranVerifyCallback(item, wranParamsMapTemp, platInfo) {
        const { imgTextConfig } = platInfo.commonPubParamsConfig;
        if (imgTextConfig) {
          const { imagesMax } = imgTextConfig;
          if (images.length > imagesMax) {
            wranParamsMapTemp.set(item.id, {
              message: '参数警告',
              errType: PubParamsErrStatusEnum.PARAMS,
              parErrMsg: `${platInfo.name}的图片上传数最多不能超过${imagesMax}个，多余的图片会被系统过滤！`,
            });
          }
        }
      },
    },
  );
  const pubAccountDetModuleRef = useRef<IPubAccountDetModuleRef>(null);
  const [loading, setLoading] = useState(false);
  const [pubProgressModuleOpen, setPubProgressModuleOpen] = useState(false);
  // 主进程传过来的发布进度数据，key为用户id value为发布进度数据
  const [pubProgressMap, setPubProgressMap] = useState<
    Map<number, PublishProgressRes>
  >(new Map());
  const navigate = useNavigate();

  useEffect(() => {
    setErrParamsMap(errParamsMap, warnParamsMap);
  }, [errParamsMap, warnParamsMap]);

  useEffect(() => {
    const destroy = onImgTextPublishProgress((progressData) => {
      setPubProgressMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(progressData.account.id!, progressData);
        return newMap;
      });
    });
    const history = usePubStroe.getState().getImgTextPubSaveData();
    let confirmRes: { destroy: () => void };

    if (history) {
      confirmRes = confirm({
        title: '恢复草稿',
        icon: <ExclamationCircleFilled />,
        content: '您之前有未发布的图文记录，是否需要恢复？',
        okText: '恢复',
        cancelText: '放弃',
        onOk() {
          setTempSaveParams(history);
        },
        onCancel() {
          usePubStroe.getState().clearImgTextPubSave();
        },
      });
    }

    return () => {
      clear();
      destroy();
      confirmRes?.destroy();
    };
  }, []);

  const pubCore = async () => {
    setPubProgressModuleOpen(true);
    setLoading(true);
    const err = () => {
      setLoading(false);
      message.error('网络繁忙，请稍后重试！');
    };
    // 创建一级记录
    const recordRes = await icpCreatePubRecord({
      title: commonPubParams.title,
      desc: commonPubParams.describe,
      type: PubType.ImageText,
      coverPath: images[0].imgPath,
    });
    if (!recordRes) return err();

    for (const vData of imageAccounts) {
      const account = vData.account!;
      // 创建二级记录
      await icpCreateImgTextPubRecord({
        ...vData.pubParams,
        type: account.type,
        accountId: account.id,
        pubRecordId: recordRes.id,
        publishTime: new Date(),
        desc: vData.pubParams.describe,
        coverPath: images[0].imgPath,
        imagesPath: images.map((v) => v.imgPath),
      });
    }
    const okRes = await icpPubImgText(recordRes.id);
    setLoading(false);
    setPubProgressModuleOpen(false);
    usePubStroe.getState().clearImgTextPubSave();
    const successList = okRes.filter((v) => v.code === 1);
    useAccountStore.getState().notification!.open({
      message: '发布结果',
      description: (
        <>
          一共发布 {okRes.length} 条数据，成功 {successList.length} 条，失败{' '}
          {okRes.length - successList.length} 条
        </>
      ),
      showProgress: true,
      btn: (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              navigate('/publish/pubRecord');
            }}
          >
            查看发布记录
          </Button>
        </Space>
      ),
      key: Date.now(),
    });
  };

  const pubProgressData = useMemo(() => {
    return imageAccounts.map((v) => {
      const progress = pubProgressMap.get(v.account!.id);
      return {
        account: v.account!,
        progress: progress?.progress || 0,
        msg: progress?.msg || '',
      };
    });
  }, [pubProgressMap, imageAccounts]);

  const pubClick = () => {
    pubAccountDetModuleRef.current!.startDet();
    setLoading(true);
  };
  return (
    <div className={styles.image}>
      <PubProgressModule
        open={pubProgressModuleOpen}
        pubProgressData={pubProgressData}
        onClose={() => setPubProgressModuleOpen(false)}
      />
      <PubAccountDetModule
        ref={pubAccountDetModuleRef}
        accounts={imageAccounts
          .map((v) => v.account)
          .filter((v) => v !== undefined)}
        onClose={() => {
          setLoading(false);
        }}
        onPubClick={() => {
          pubCore();
        }}
        onRestartLoginFinish={(account) => {
          updateAccounts([account]);
        }}
        onDetFinish={(accounts) => {
          updateAccounts(accounts);
        }}
      />
      <div className="image-wrapper">
        <ImageLeftSetting />
        <ImageRightSetting />
      </div>
      <div className="image-footer">
        <Popconfirm
          title="温馨提示"
          description="是否确认清空内容和账号？"
          onConfirm={() => {
            clear();
            usePubStroe.getState().clearImgTextPubSave();
          }}
          okText="确认"
          cancelText="取消"
        >
          <Button style={{ marginRight: '20px' }}>一键清空</Button>
        </Popconfirm>
        <Button
          loading={loading}
          type="primary"
          disabled={imageAccounts.length === 0 || images.length === 0}
          onClick={() => {
            for (const [key, errVideoItem] of errParamsMap) {
              if (errVideoItem) {
                const imageAccount = imageAccounts.find(
                  (v) => v.account.id === +key,
                )!;
                const platType = imageAccount!.account.type;
                const platActiveAccountMap = new Map(
                  useImagePageStore.getState().platActiveAccountMap,
                );
                setActivePlat(platType);
                platActiveAccountMap.set(platType, imageAccount);
                setPlatActiveAccountMap(platActiveAccountMap);
                message.warning(errVideoItem.parErrMsg);
                return;
              }
            }
            if (commonPubParams.title !== '') {
              const titleNullData = imageAccounts.find(
                (v) => v.pubParams.title === '',
              );
              if (titleNullData) {
                confirm({
                  title: '温馨提示',
                  icon: <ExclamationCircleFilled />,
                  content: `检测到通用发布设置存在标题，但是${AccountPlatInfoMap.get(titleNullData!.account.type)?.name}详情参数的标题为空，您是否忘记同步通用发布参数？`,
                  okText: '继续发布',
                  cancelText: '放弃发布',
                  onOk() {
                    pubClick();
                  },
                });
                return;
              }
            }
            if (commonPubParams.describe !== '') {
              const titleNullData = imageAccounts.find(
                (v) => v.pubParams.describe === '',
              );
              if (titleNullData) {
                confirm({
                  title: '温馨提示',
                  icon: <ExclamationCircleFilled />,
                  content: `检测到通用发布设置存在描述，但是${AccountPlatInfoMap.get(titleNullData!.account.type)?.name}详情参数的描述为空，您是否忘记同步通用发布参数？`,
                  okText: '继续发布',
                  cancelText: '放弃发布',
                  onOk() {
                    pubClick();
                  },
                });
                return;
              }
            }
            pubClick();
          }}
        >
          一键发布
        </Button>
      </div>
    </div>
  );
}
