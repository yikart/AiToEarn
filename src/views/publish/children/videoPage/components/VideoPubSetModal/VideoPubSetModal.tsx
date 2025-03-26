import React, {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Avatar,
  Button,
  message,
  Modal,
  Space,
  Switch,
  Tabs,
  Tooltip,
} from 'antd';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import styles from './videoPubSetModal.module.scss';
import { AccountPlatInfoMap } from '@/views/account/comment';
import VideoCoverSeting from '@/views/publish/children/videoPage/components/VideoCoverSeting';
import { AccountType } from '@@/AccountEnum';
import {
  icpCreatePubRecord,
  icpCreateVideoPubRecord,
  icpPubVideo,
} from '@/icp/publish';
import { PubType } from '@@/publish/PublishEnum';
import { useNavigate } from 'react-router-dom';
import PubAccountDetModule, {
  IPubAccountDetModuleRef,
} from '../../../../components/PubAccountDetModule/PubAccountDetModule';
import VideoPubSetModal_KWAI from '@/views/publish/children/videoPage/components/VideoPubSetModal/children/VideoPubSetModal_KWAI';
import VideoPubSetModal_DouYin from '@/views/publish/children/videoPage/components/VideoPubSetModal/children/VideoPubSetModal_DouYin';
import VideoPubSetModal_XSH from '@/views/publish/children/videoPage/components/VideoPubSetModal/children/VideoPubSetModal_XSH';
import VideoPubSetModal_WxSph from '@/views/publish/children/videoPage/components/VideoPubSetModal/children/VideoPubSetModal_WxSph';
import { onVideoPublishProgress } from '@/icp/receiveMsg';
import PubProgressModule from '../../../../components/PubProgressModule/PubProgressModule';
import { VideoPublishProgressRes } from '../../../../../../../electron/main/plat/pub/PubItemVideo';
import VideoPubSetModalVideo, {
  IVideoPubSetModalVideoRef,
} from '@/views/publish/children/videoPage/components/VideoPubSetModal/components/VideoPubSetModalVideo';
import { usePubStroe } from '../../../../../../store/pubStroe';

import { IVideoChooseItem } from '../../videoPage';
import usePubParamsVerify, {
  PubParamsErrStatusEnum,
} from '../../../../hooks/usePubParamsVerify';
import { useAccountStore } from '../../../../../../store/commont';

export interface IVideoPubSetModalRef {}

export interface IVideoPubSetModalProps {
  onClose: (open: boolean) => void;
}

const PubSetModalChild = ({
  currChooseAccount,
}: {
  currChooseAccount: IVideoChooseItem;
}) => {
  switch (currChooseAccount?.account?.type) {
    case AccountType.KWAI:
      return <VideoPubSetModal_KWAI currChooseAccount={currChooseAccount} />;
    case AccountType.Douyin:
      return <VideoPubSetModal_DouYin currChooseAccount={currChooseAccount} />;
    case AccountType.Xhs:
      return <VideoPubSetModal_XSH currChooseAccount={currChooseAccount} />;
    case AccountType.WxSph:
      return <VideoPubSetModal_WxSph currChooseAccount={currChooseAccount} />;
  }
  return <></>;
};

// 设置发布参数弹框
const VideoPubSetModal = memo(
  forwardRef(
    (
      { onClose }: IVideoPubSetModalProps,
      ref: ForwardedRef<IVideoPubSetModalRef>,
    ) => {
      const navigate = useNavigate();
      const {
        videoListChoose,
        setOnePubParams,
        currChooseAccountId,
        setCurrChooseAccountId,
        videoPubSetModalOpen,
        setVideoPubSetModalOpen,
        updateAccounts,
        accountRestart,
        commonPubParams,
        clear,
      } = useVideoPageStore(
        useShallow((state) => ({
          videoListChoose: state.videoListChoose,
          setOnePubParams: state.setOnePubParams,
          setCurrChooseAccountId: state.setCurrChooseAccountId,
          currChooseAccountId: state.currChooseAccountId,
          videoPubSetModalOpen: state.videoPubSetModalOpen,
          setVideoPubSetModalOpen: state.setVideoPubSetModalOpen,
          updateAccounts: state.updateAccounts,
          accountRestart: state.accountRestart,
          clear: state.clear,
          commonPubParams: state.commonPubParams,
        })),
      );
      const { moreParamsOpen, setMoreParamsOpen } = usePubStroe(
        useShallow((state) => ({
          moreParamsOpen: state.moreParamsOpen,
          setMoreParamsOpen: state.setMoreParamsOpen,
        })),
      );
      const [loading, setLoading] = useState(false);
      const pubAccountDetModuleRef = useRef<IPubAccountDetModuleRef>(null);
      // 主进程传过来的发布进度数据，key为用户id value为发布进度数据
      const [pubProgressMap, setPubProgressMap] = useState<
        Map<number, VideoPublishProgressRes>
      >(new Map());
      const [pubProgressModuleOpen, setPubProgressModuleOpen] = useState(false);
      const videoPubSetModalVideoRef = useRef<IVideoPubSetModalVideoRef>(null);
      const { errVideoMap } = usePubParamsVerify(
        videoListChoose.map((v) => {
          return {
            id: v.id,
            account: v.account,
            pubParams: v.pubParams,
          };
        }),
      );

      useEffect(() => {
        // 发布进度监听
        return onVideoPublishProgress((progressData) => {
          setPubProgressMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(progressData.account.id!, progressData);
            return newMap;
          });
        });
      }, []);

      useEffect(() => {
        if (!currChooseAccountId)
          setCurrChooseAccountId(videoListChoose[0]?.id);
      }, [videoListChoose]);

      const pubProgressData = useMemo(() => {
        return videoListChoose
          .filter((v) => v.account && v.video)
          .map((v) => {
            const progress = pubProgressMap.get(v.account!.id);
            return {
              account: v.account!,
              progress: progress?.progress || 0,
              msg: progress?.msg || '',
            };
          });
      }, [pubProgressMap, videoListChoose]);

      // 当前选择的账户数据
      const currChooseAccount = useMemo(() => {
        if (!currChooseAccountId) return videoListChoose[0];
        return videoListChoose.find((v) => v.id === currChooseAccountId);
      }, [currChooseAccountId, videoListChoose]);

      const pubCore = async () => {
        setLoading(false);
        const err = () => {
          setLoading(false);
          message.error('网络繁忙，请稍后重试！');
        };
        // 创建一级记录
        const recordRes = await icpCreatePubRecord({
          title: commonPubParams.title,
          desc: commonPubParams.describe,
          type: PubType.VIDEO,
          timingTime: commonPubParams.timingTime,
          videoPath: videoListChoose[0].video?.videoPath,
          coverPath: videoListChoose[0].pubParams.cover?.imgPath,
          commonCoverPath: commonPubParams.cover?.imgPath,
        });
        if (!recordRes) return err();

        setPubProgressModuleOpen(true);
        setLoading(true);
        for (const vData of videoListChoose) {
          const account = vData.account!;
          const video = vData.video!;
          // 创建二级记录
          await icpCreateVideoPubRecord({
            ...vData.pubParams,
            type: account.type,
            accountId: account.id,
            pubRecordId: recordRes.id,
            publishTime: new Date(),
            title: vData.pubParams.title,
            topics: vData.pubParams.topics,
            desc: vData.pubParams.describe,
            videoPath: video.videoPath,
            coverPath: vData.pubParams.cover?.imgPath,
            visibleType: vData.pubParams.visibleType,
            diffParams: vData.pubParams.diffParams,
          });
        }
        const okRes = await icpPubVideo(recordRes.id);
        setLoading(false);
        close();
        setPubProgressModuleOpen(false);
        usePubStroe.getState().clearVideoPubSaveData();

        // 成功数据
        const successList = okRes.filter((v) => v.code === 1);
        setTimeout(() => {
          useAccountStore.getState().notification!.open({
            message: '发布结果',
            description: (
              <>
                一共发布 {okRes.length} 条数据，成功 {successList.length}{' '}
                条，失败 {okRes.length - successList.length} 条
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
            onClose: close,
          });
        }, 10);
      };

      const handleOk = async () => {
        // 数据校验
        for (const [key, errVideoItem] of errVideoMap) {
          if (errVideoItem) {
            setCurrChooseAccountId(`${key}`);
            message.warning(errVideoItem.parErrMsg);
            setMoreParamsOpen(true);
            return;
          }
        }
        setLoading(true);
        pubAccountDetModuleRef.current!.startDet();
      };

      const close = () => {
        setVideoPubSetModalOpen(false);
        videoPubSetModalVideoRef.current!.pause();
      };

      return (
        <>
          <PubProgressModule
            pubProgressData={pubProgressData}
            open={pubProgressModuleOpen}
            onClose={() => setPubProgressModuleOpen(false)}
          />
          <PubAccountDetModule
            ref={pubAccountDetModuleRef}
            accounts={videoListChoose
              .map((v) => v.account)
              .filter((v) => v !== undefined)}
            onClose={() => {
              setLoading(false);
            }}
            onPubClick={() => {
              pubCore();
            }}
            onRestartLoginFinish={(account) => {
              updateAccounts({
                accounts: [account],
              });
            }}
            onDetFinish={(accounts) => {
              updateAccounts({
                accounts,
              });
            }}
          />
          <Modal
            width={moreParamsOpen ? 900 : 500}
            maskClosable={false}
            title={
              <div className={styles.videoPubSetModal_titleWrap}>
                <div className="videoPubSetModal-title">预览及发布</div>
                <div className="videoPubSetModal-more">
                  <div className="videoPubSetModal-more-core">
                    <label>填写更多参数</label>
                    <Switch
                      size="small"
                      value={moreParamsOpen}
                      onClick={(e) => setMoreParamsOpen(e)}
                    />
                  </div>
                  <div className="videoPubSetModal-more-tips">
                    开启后，将显示更多发布参数供您填写
                  </div>
                </div>
              </div>
            }
            open={videoPubSetModalOpen}
            onOk={handleOk}
            onCancel={close}
            confirmLoading={loading}
            okText="发布检测"
          >
            <div className={styles.videoPubSetModal}>
              <Tabs
                activeKey={currChooseAccountId}
                onChange={setCurrChooseAccountId}
                items={videoListChoose
                  .map((v) => {
                    const account = v.account!;
                    const errItem = errVideoMap.get(v.id);
                    if (!account || !v.video) return undefined;

                    return {
                      key: v.id,
                      label: (
                        <div className="videoPubSetModal-tabLabel">
                          {errItem && (
                            <Tooltip title={errItem.parErrMsg}>
                              <Alert
                                message={errItem.message}
                                type={errItem.type}
                                showIcon
                              />
                            </Tooltip>
                          )}
                          <Tooltip title={account.nickname}>
                            <Avatar src={account?.avatar} size="small" />
                            <span className="videoPubSetModal-tabLabel-name">
                              {account?.nickname}
                            </span>
                            <img
                              src={AccountPlatInfoMap.get(account?.type)?.icon}
                            />
                          </Tooltip>
                        </div>
                      ),
                    };
                  })
                  .filter((v) => v !== undefined)}
              />

              <div
                className={[
                  'videoPubSetModal_con',
                  !moreParamsOpen && 'videoPubSetModal_con--noMore',
                ].join(' ')}
              >
                <div className="videoPubSetModal_con-left">
                  {(() => {
                    const errItem = errVideoMap.get(
                      currChooseAccount?.id || '',
                    );
                    if (!errItem) return;
                    return (
                      <div className="videoPubSetModal_con_top">
                        {errItem.errType === PubParamsErrStatusEnum.LOGIN && (
                          <Button
                            type="primary"
                            danger
                            onClick={() =>
                              accountRestart(currChooseAccount!.account!.type)
                            }
                          >
                            重新登录
                          </Button>
                        )}
                        {errItem.errType === PubParamsErrStatusEnum.PARAMS && (
                          <Alert
                            type="error"
                            showIcon
                            message={errItem.parErrMsg}
                          />
                        )}
                      </div>
                    );
                  })()}
                  <div className="videoPubSetModal_con-tips">
                    <span>*下方参数只应用于当前账号</span>
                  </div>
                  <h1>
                    <span className="videoPubSetModal_con-red">*</span>封面
                  </h1>
                  <VideoCoverSeting
                    saveImgId={currChooseAccount?.id || ''}
                    videoFile={currChooseAccount?.video}
                    value={currChooseAccount?.pubParams.cover}
                    onChoosed={(imgFile) => {
                      setOnePubParams(
                        {
                          cover: imgFile,
                        },
                        currChooseAccount!.id,
                      );
                    }}
                  />

                  {currChooseAccount && (
                    <PubSetModalChild currChooseAccount={currChooseAccount} />
                  )}
                </div>
                <div className="videoPubSetModal_con-right">
                  {currChooseAccount && (
                    <VideoPubSetModalVideo
                      ref={videoPubSetModalVideoRef}
                      chooseAccountItem={currChooseAccount}
                    />
                  )}
                </div>
              </div>
            </div>
          </Modal>
        </>
      );
    },
  ),
);
VideoPubSetModal.displayName = 'VideoPubSetModal';

export default VideoPubSetModal;
