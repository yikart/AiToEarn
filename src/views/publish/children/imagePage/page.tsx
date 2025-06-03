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
import { onImgTextPublishProgress } from '@/icp/receiveMsg';
import {
  icpCreateImgTextPubRecord,
  icpCreatePubRecord,
  icpPubImgText,
} from '@/icp/publish';
import { PubType } from '@@/publish/PublishEnum';
import { useCommontStore } from '@/store/commont';
import { useNavigate } from 'react-router-dom';
import { usePubStroe } from '@/store/pubStroe';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { signInApi } from '@/api/signIn';
import { toolsApi } from '@/api/tools';
import { IImageAccountItem } from '@/views/publish/children/imagePage/imagePage.type';
import { sensitivityLoading } from '@/utils';

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
      } as any;
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
  // 敏感词检测
  const [sensitiveDetLoading, setSensitiveDetLoading] = useState(false);

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

  // 发布
  const pubCore = async () => {
    setPubProgressModuleOpen(true);
    setLoading(true);
    await signInApi.createSignInRecord();

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
    useCommontStore.getState().notification!.open({
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

  // 进度
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

  // 一键发布点击
  const pubClick = () => {
    pubAccountDetModuleRef.current!.startDet();
    setLoading(true);
  };

  const sensitiveDetCore = async (
    content: string,
    accountItem: IImageAccountItem,
  ) => {
    const res = await toolsApi.textModeration(content);

    return {
      sensitive: res !== 'Normal',
      accountItem,
    };
  };

  return (
    <div className={styles.image}>
      <PubProgressModule
        open={pubProgressModuleOpen}
        pubProgressData={pubProgressData as any}
        onClose={() => setPubProgressModuleOpen(false)}
      />
      <PubAccountDetModule
        isCheckProxy={true}
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
          <Button>一键清空</Button>
        </Popconfirm>
        <Button
          loading={sensitiveDetLoading}
          color="danger"
          variant="solid"
          disabled={imageAccounts.length === 0 || images.length === 0}
          onClick={async () => {
            setSensitiveDetLoading(true);
            const core = async () => {
              const tasks: Promise<{
                // 作品
                accountItem: IImageAccountItem;
                // 是否敏感 true=敏感 false=正常
                sensitive: boolean;
              }>[] = [];
              // 如果检测内容重复不会进行检测
              const contentSet = new Set<string>();

              imageAccounts.map((v) => {
                const content = `
                ${v.pubParams.title}
                ${v.pubParams.describe}
              `;
                if (content.trim() !== '' && !contentSet.has(content)) {
                  contentSet.add(content);
                  tasks.push(sensitiveDetCore(content, v));
                }
              });
              return await Promise.all(tasks);
            };

            const taskRes = await Promise.all([core(), sensitivityLoading()]);
            const res = taskRes[0];

            setSensitiveDetLoading(false);

            if (res.length === 0) return message.success('检测正常');

            if (res.every((v) => !v.sensitive)) {
              message.success('检测正常');
              return;
            }
            for (const { sensitive, accountItem } of res) {
              if (sensitive) {
                message.warning('检测到此条作品存在敏感信息！');
                setActivePlat(accountItem.account.type);
                const platActiveAccountMap = new Map(
                  useImagePageStore.getState().platActiveAccountMap,
                );
                platActiveAccountMap.set(accountItem.account.type, accountItem);
                setPlatActiveAccountMap(platActiveAccountMap);
                break;
              }
            }
          }}
        >
          内容安全检测
        </Button>
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
            pubClick();
          }}
        >
          一键发布
        </Button>
      </div>
    </div>
  );
}
