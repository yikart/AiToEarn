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
  notification,
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
import { AccountStatus, AccountType } from '@@/AccountEnum';
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
import {
  IVideoPubSetModalChildProps,
  IVideoPubSetModalChildRef,
} from './videoPubSetModal.type';

export interface IVideoPubSetModalRef {}

export interface IVideoPubSetModalProps {
  onClose: (open: boolean) => void;
}

// 错误状态
enum ErrStatusEnum {
  // 登录错误
  LOGIN = 1,
  // 参数错误
  PARAMS = 2,
}

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
        })),
      );
      const { moreParamsOpen, setMoreParamsOpen } = usePubStroe(
        useShallow((state) => ({
          moreParamsOpen: state.moreParamsOpen,
          setMoreParamsOpen: state.setMoreParamsOpen,
        })),
      );
      const [loading, setLoading] = useState(false);
      const [api, contextHolder] = notification.useNotification();
      const pubAccountDetModuleRef = useRef<IPubAccountDetModuleRef>(null);
      // 主进程传过来的发布进度数据，key为用户id value为发布进度数据
      const [pubProgressMap, setPubProgressMap] = useState<
        Map<number, VideoPublishProgressRes>
      >(new Map());
      const [pubProgressModuleOpen, setPubProgressModuleOpen] = useState(false);
      const videoPubSetModalVideoRef = useRef<IVideoPubSetModalVideoRef>(null);

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

      // 捕获 videoListChoose 的错误
      const errVideoMap = useMemo(() => {
        const errVideoMapTemp: Map<
          string,
          {
            message: string;
            // 同 AlertProps.type
            type: 'warning' | 'error';
            errType: ErrStatusEnum;
            // 参数错误提示消息
            parErrMsg?: string;
          }
        > = new Map();
        for (const v of videoListChoose) {
          if (v.account && v.account.status === AccountStatus.DISABLE) {
            errVideoMapTemp.set(v.id, {
              message: '登录失效',
              type: 'warning',
              errType: ErrStatusEnum.LOGIN,
            });
          } else if (
            v.account?.type === AccountType.KWAI &&
            v.pubParams.cover &&
            (v.pubParams.cover.width < 400 || v.pubParams.cover.height < 400)
          ) {
            // 快手要求封面必须大于 400x400
            errVideoMapTemp.set(v.id, {
              message: '参数错误',
              type: 'error',
              errType: ErrStatusEnum.PARAMS,
              parErrMsg: '封面最小尺寸400*400',
            });
          }
        }
        return errVideoMapTemp;
      }, [videoListChoose]);

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
          title: '/',
          desc: '/',
          type: PubType.VIDEO,
          videoPath: videoListChoose[0].video?.videoPath,
          coverPath: videoListChoose[0].pubParams.cover?.imgPath,
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
          api.open({
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
            setCurrChooseAccountId(key);
            message.warning(errVideoItem.message);
            setMoreParamsOpen(true);
            return;
          }
        }
        if (videoListChoose.some((v) => !v.pubParams.cover)) {
          return message.warning('有的数据未上传封面，请检查后重试！');
        }
        setLoading(true);
        pubAccountDetModuleRef.current!.startDet();
      };

      const close = () => {
        setVideoPubSetModalOpen(false);
        videoPubSetModalVideoRef.current!.pause();
      };

      const PubSetModalChild = () => {
        if (!currChooseAccount) return <></>;
        let Component: React.MemoExoticComponent<
          React.ForwardRefExoticComponent<
            IVideoPubSetModalChildProps &
              React.RefAttributes<IVideoPubSetModalChildRef>
          >
        >;
        switch (currChooseAccount?.account?.type) {
          // 快手
          case AccountType.KWAI:
            Component = VideoPubSetModal_KWAI;
            break;
          // 抖音
          case AccountType.Douyin:
            Component = VideoPubSetModal_DouYin;
            break;
          // 小红书
          case AccountType.Xhs:
            Component = VideoPubSetModal_XSH;
            break;
          // 微信视频号
          case AccountType.WxSph:
            Component = VideoPubSetModal_WxSph;
            break;
          default:
            Component = VideoPubSetModal_KWAI;
            break;
        }
        return <Component currChooseAccount={currChooseAccount} />;
      };

      return (
        <>
          {contextHolder}
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
                            <Alert
                              message={errItem.message}
                              type={errItem.type}
                              showIcon
                            />
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
                        {errItem.errType === ErrStatusEnum.LOGIN && (
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
                        {errItem.errType === ErrStatusEnum.PARAMS && (
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

                  {currChooseAccount && <PubSetModalChild />}
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
