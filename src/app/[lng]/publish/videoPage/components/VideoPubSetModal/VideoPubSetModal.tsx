import React, {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
} from "antd";
import { useVideoPageStore } from "@/app/[lng]/publish/videoPage/useVideoPageStore";
import { useShallow } from "zustand/react/shallow";
import styles from "./videoPubSetModal.module.scss";
import {
  NoticeItem,
  NoticeType,
  useBellMessageStroe,
} from "@/store/bellMessageStroe";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import VideoCoverSeting from "@/app/[lng]/publish/videoPage/components/VideoCoverSeting";
import PubAccountDetModule, {
  IPubAccountDetModuleRef,
} from "@/app/[lng]/publish/components/PubAccountDetModule/PubAccountDetModule";
import VideoPubSetModal_KWAI from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/children/VideoPubSetModal_KWAI";
import PubProgressModule from "@/app/[lng]/publish/components/PubProgressModule/PubProgressModule";
import VideoPubSetModalVideo, {
  IVideoPubSetModalVideoRef,
} from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/components/VideoPubSetModalVideo";
import usePubParamsVerify, {
  PubParamsErrStatusEnum,
  PubParamsVerifyInfo,
} from "@/app/[lng]/publish/hooks/usePubParamsVerify";
import { IVideoFile } from "@/app/[lng]/publish/components/Choose/VideoChoose";
import { useRouter } from "next/navigation";
import { useSystemStore } from "@/store/system";
import { signInApi } from "@/api/signIn";
import { generateUUID } from "@/utils";
import { PubStatus } from "@/app/config/publishConfig";
import { platManage } from "@/app/plat/PlatManage";
import { useCommontStore } from "@/store/commont";
import { PublishVideoParams } from "@/app/plat/plat.type";

export interface IVideoPubSetModalRef {}

export interface IVideoPubSetModalProps {
  onClose: (open: boolean) => void;
}

const PubSetModalChild = ({}: {}) => {
  const { currChooseAccount } = useVideoPageStore(
    useShallow((state) => ({
      currChooseAccount: state.currChooseAccount,
    })),
  );

  const renderedComponent = useMemo(() => {
    switch (currChooseAccount?.account?.type) {
      case PlatType.KWAI:
        return <VideoPubSetModal_KWAI />;
    }
    return <></>;
  }, [currChooseAccount?.account?.type]);

  return renderedComponent || <></>;
};

// 设置发布参数弹框
const VideoPubSetModal = memo(
  forwardRef(
    (
      { onClose }: IVideoPubSetModalProps,
      ref: ForwardedRef<IVideoPubSetModalRef>,
    ) => {
      const router = useRouter();
      const { addNotice, noticeMap } = useBellMessageStroe(
        useShallow((state) => ({
          noticeMap: state.noticeMap,
          addNotice: state.addNotice,
        })),
      );
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
        setCurrChooseAccount,
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
          setCurrChooseAccount: state.setCurrChooseAccount,
        })),
      );
      const [loading, setLoading] = useState(false);
      const pubAccountDetModuleRef = useRef<IPubAccountDetModuleRef>(null);
      const [pubProgressModuleOpen, setPubProgressModuleOpen] = useState(false);
      const videoPubSetModalVideoRef = useRef<IVideoPubSetModalVideoRef>(null);
      const { moreParamsOpen, setMoreParamsOpen } = useSystemStore(
        useShallow((state) => ({
          moreParamsOpen: state.moreParamsOpen,
          setMoreParamsOpen: state.setMoreParamsOpen,
        })),
      );
      const { errParamsMap, warnParamsMap } = usePubParamsVerify<IVideoFile>(
        videoListChoose.map((v) => {
          return {
            id: v.id,
            account: v.account,
            pubParams: v.pubParams,
            other: v.video!,
          };
        }),
        {
          moreErrorVerifyCallback(item, errParamsMapTemp) {
            if (
              item?.account?.type === PlatType.Douyin &&
              item.other?.duration > 3600
            ) {
              errParamsMapTemp.set(item.id, {
                message: "视频错误",
                errType: PubParamsErrStatusEnum.PARAMS,
                parErrMsg: `抖音平台规定视频时长最多不能超过60分钟！`,
              });
            }
          },
        },
      );

      useEffect(() => {
        if (!currChooseAccountId)
          setCurrChooseAccountId(videoListChoose[0]?.id);
      }, [videoListChoose]);

      // 发布进度获取
      const pubProgressData = useMemo(() => {
        // TODO 发布进度处理
        // return (
        //   (noticeMap.get(NoticeType.PubNotice) || []).find(
        //     (v) => v.id === recordId.current,
        //   )?.pub?.progressList || []
        // );
        return [];
      }, [noticeMap]);

      // 当前选择的账户数据
      const currChooseAccount = useMemo(() => {
        if (!currChooseAccountId) return videoListChoose[0];
        return videoListChoose.find((v) => v.id === currChooseAccountId);
      }, [currChooseAccountId, videoListChoose]);

      useEffect(() => {
        if (currChooseAccount) setCurrChooseAccount({ ...currChooseAccount });
      }, [currChooseAccount, videoListChoose]);

      const pubCore = async () => {
        setLoading(false);

        // await signInApi.createSignInRecord();
        const err = () => {
          setLoading(false);
          message.error("网络繁忙，请稍后重试！");
        };

        const operateId = generateUUID();
        // 发布记录通知消息初始化
        const initialNotice: NoticeItem = {
          title:
            [
              ...new Set(
                videoListChoose.map(
                  (v) => AccountPlatInfoMap.get(v.account!.type)!.name,
                ),
              ),
            ].join("、") + "发布任务",
          time: new Date(),
          id: operateId,
          pub: {
            status: PubStatus.UNPUBLISH,
            progressList: [],
          },
        };

        const publishVideoParamsArr: PublishVideoParams[] = [];
        for (const vData of videoListChoose) {
          initialNotice.pub!.progressList.push({
            account: vData.account!,
            progress: 0,
            msg: "加载中...",
            id: vData.account!.id!,
          });

          publishVideoParamsArr.push({
            videoPubParams: {
              ...vData.pubParams,
              video: vData.video!,
            },
            account: vData.account!,
            access_token: vData.account!.access_token!,
            refresh_token: vData.account!.refresh_token!,
          });
        }
        const noticeList = noticeMap.get(NoticeType.PubNotice) || [];
        noticeList.unshift(initialNotice);
        addNotice(NoticeType.PubNotice, noticeList);

        // 发布
        const okRes = await platManage.publishVideo(
          publishVideoParamsArr,
          operateId,
        );
        setLoading(false);
        close();
        setPubProgressModuleOpen(false);

        // 成功数据
        const successList = okRes.filter((v) => v.success);

        initialNotice.pub!.status =
          successList.length === okRes.length
            ? PubStatus.RELEASED
            : PubStatus.PartSuccess;
        addNotice(NoticeType.PubNotice, noticeList);

        setTimeout(() => {
          useCommontStore.getState().notification!.open({
            message: "发布结果",
            description: (
              <>
                一共发布 {okRes.length} 条数据，成功 {successList.length}{" "}
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
                    router.push("/publish/pubRecord");
                  }}
                >
                  查看发布记录
                </Button>
              </Space>
            ),
            key: Date.now(),
          });
        }, 10);
      };

      const handleOk = async () => {
        // 数据校验
        for (const [key, errVideoItem] of errParamsMap) {
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
        videoPubSetModalVideoRef.current?.pause();
      };

      return (
        <>
          <PubProgressModule
            pubProgressData={pubProgressData}
            open={pubProgressModuleOpen}
            onClose={() => {
              setPubProgressModuleOpen(false);
              if (loading) {
                close();
              }
            }}
          />
          <PubAccountDetModule
            ref={pubAccountDetModuleRef}
            isCheckProxy={true}
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
                    const errItem = errParamsMap.get(v.id);
                    if (!account || !v.video) return undefined;

                    return {
                      key: v.id,
                      label: (
                        <div className="videoPubSetModal-tabLabel">
                          {errItem && (
                            <Tooltip title={errItem.parErrMsg}>
                              <Alert
                                message={errItem.message}
                                type="error"
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
                  "videoPubSetModal_con",
                  !moreParamsOpen && "videoPubSetModal_con--noMore",
                ].join(" ")}
              >
                <div className="videoPubSetModal_con-left">
                  <PubParamsVerifyInfo
                    style={{ marginBottom: "5px" }}
                    id={currChooseAccount?.id}
                    warnParamsMap={warnParamsMap}
                    errParamsMap={errParamsMap}
                    onAccountRestart={() => {
                      accountRestart(currChooseAccount!.account!.type);
                    }}
                  />
                  <div className="videoPubSetModal_con-tips">
                    <span>*下方参数只应用于当前账号</span>
                  </div>
                  <h1>
                    <span className="videoPubSetModal_con-red">*</span>封面
                  </h1>
                  <VideoCoverSeting
                    saveImgId={currChooseAccount?.id || ""}
                    videoFile={currChooseAccount?.video}
                    value={currChooseAccount?.pubParams.cover}
                    onChoosed={(imgFile) => {
                      setOnePubParams({
                        cover: imgFile,
                      });
                    }}
                  />

                  {currChooseAccount && <PubSetModalChild />}
                </div>
                <div className="videoPubSetModal_con-right">
                  {currChooseAccount && (
                    <VideoPubSetModalVideo ref={videoPubSetModalVideoRef} />
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
VideoPubSetModal.displayName = "VideoPubSetModal";

export default VideoPubSetModal;
