"use client";

import styles from "./video.module.scss";
import { Button, message, Popconfirm, Spin, Tooltip } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useShallow } from "zustand/react/shallow";
import { toolsApi } from "@/api/tools";
import { sensitivityLoading } from "@/utils";
import VideoChoose from "@/app/[lng]/publish/components/Choose/VideoChoose";
import ChooseAccountModule from "@/app/[lng]/publish/components/ChooseAccountModule/ChooseAccountModule";
import NoChoosePage from "@/app/[lng]/publish/videoPage/components/NoChoosePage";
import { useVideoPageStore } from "@/app/[lng]/publish/videoPage/useVideoPageStore";
import { PubType } from "@/app/config/publishConfig";
import VideoChooseItem from "@/app/[lng]/publish/videoPage/components/VideoChooseItem";
import CommonPubSetting from "@/app/[lng]/publish/videoPage/components/CommonPubSetting";
import VideoPubSetModal from "@/app/[lng]/publish/videoPage/components/VideoPubSetModal/VideoPubSetModal";
import { IVideoChooseItem } from "@/app/[lng]/publish/videoPage/videoPage";
import { useEffect, useRef, useState } from "react";

export enum AccountChooseType {
  // 多选
  MultiSelect = 0,
  // 单选
  Radio = 1,
  // 替换
  Replace = 2,
}

export default function Page() {
  const {
    videoListChoose,
    addVideos,
    clearVideoList,
    clear,
    addAccount,
    aloneAdd,
    setVideoPubSetModalOpen,
    loadingPageLoading,
    setLoadingPageLoading,
    setCurrChooseAccountId,
  } = useVideoPageStore(
    useShallow((state) => ({
      videoListChoose: state.videoListChoose,
      addVideos: state.addVideos,
      addAccount: state.addAccount,
      clearVideoList: state.clearVideoList,
      clear: state.clear,
      aloneAdd: state.aloneAdd,
      setVideoPubSetModalOpen: state.setVideoPubSetModalOpen,
      loadingPageLoading: state.loadingPageLoading,
      setLoadingPageLoading: state.setLoadingPageLoading,
      setCurrChooseAccountId: state.setCurrChooseAccountId,
    })),
  );
  // 账户选择弹框显示隐藏状态
  const [chooseAccountOpen, setChooseAccountOpen] = useState(false);
  // 账户选择类型
  const accountChooseType = useRef(AccountChooseType.MultiSelect);
  // 用户单选ID
  const accountOneChooseId = useRef<string>();
  const [sensitiveDetLoading, setSensitiveDetLoading] = useState(false);

  useEffect(() => {
    return () => {
      clear();
    };
  }, []);

  const sensitiveDetCore = async (
    content: string,
    videoItem: IVideoChooseItem,
  ) => {
    const res = await toolsApi.textModeration(content);

    return {
      sensitive: res !== "Normal",
      videoItem,
    };
  };

  return (
    <div className={styles.video}>
      <Spin spinning={loadingPageLoading}>
        <VideoPubSetModal onClose={setVideoPubSetModalOpen} />
        <ChooseAccountModule
          platChooseProps={{
            disableAllSelect:
              accountChooseType.current === AccountChooseType.Radio ||
              accountChooseType.current === AccountChooseType.Replace,
            choosedAccounts: videoListChoose
              .map((v) => v.account)
              .filter((v) => v !== undefined),
            pubType: PubType.VIDEO,
            isCancelChooseAccount: true,
          }}
          open={chooseAccountOpen}
          onClose={setChooseAccountOpen}
          onPlatConfirm={(aList) => {
            addAccount(aList);
          }}
          onPlatChange={(_, account) => {
            if (
              accountChooseType.current === AccountChooseType.Radio ||
              accountChooseType.current === AccountChooseType.Replace
            ) {
              setChooseAccountOpen(false);
              aloneAdd({
                account,
                id: accountOneChooseId.current!,
              });
            }
          }}
        />

        {videoListChoose.length !== 0 ? (
          // 视频已选择
          <div className="video-pubAfter">
            <div className="video-pubAfter-con">
              <div className="video-pubAfter-left">
                <div className="video-pubAfter-left-options">
                  <div className="video-pubAfter-left-options-video">
                    <h1>视频</h1>
                    <VideoChoose
                      onMultipleChoose={addVideos}
                      onStartShoose={() => {
                        setLoadingPageLoading(true);
                      }}
                      onChooseFail={() => {
                        setLoadingPageLoading(false);
                      }}
                    >
                      <Tooltip title="批量添加视频">
                        <Button type="dashed" icon={<PlusOutlined />}>
                          批量添加
                        </Button>
                      </Tooltip>
                    </VideoChoose>
                    <Tooltip title="删除所有视频">
                      <Button
                        type="dashed"
                        icon={<DeleteOutlined />}
                        onClick={() => clearVideoList(0)}
                      >
                        清空视频
                      </Button>
                    </Tooltip>
                  </div>
                  <div className="video-pubAfter-left-options-account">
                    <h1>账号</h1>
                    <Tooltip title="批量添加账号">
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          accountChooseType.current =
                            AccountChooseType.MultiSelect;
                          setChooseAccountOpen(true);
                        }}
                      >
                        批量添加
                      </Button>
                    </Tooltip>
                    <Tooltip title="删除所有账号">
                      <Button
                        type="dashed"
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          clearVideoList(1);
                        }}
                      >
                        清空账号
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                <div className="video-pubAfter-left-list">
                  {videoListChoose.map((v) => {
                    return (
                      <VideoChooseItem
                        key={v.id + v.video + v.account}
                        videoChooseItem={v}
                        onAccountOneChoose={(id, type) => {
                          accountChooseType.current = type;
                          accountOneChooseId.current = id;
                          setChooseAccountOpen(true);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="video-pubAfter-right">
                <CommonPubSetting />
              </div>
            </div>
            <div className="video-pubAfter-footer">
              <Popconfirm
                title="温馨提示"
                description="是否确认清空内容和账号？"
                onConfirm={() => {
                  clear();
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
                disabled={!videoListChoose.every((v) => v.account && v.video)}
                onClick={async () => {
                  setSensitiveDetLoading(true);
                  const core = async () => {
                    const tasks: Promise<{
                      // 作品
                      videoItem: IVideoChooseItem;
                      // 是否敏感 true=敏感 false=正常
                      sensitive: boolean;
                    }>[] = [];
                    // 如果检测内容重复不会进行检测
                    const contentSet = new Set<string>();
                    videoListChoose.map((v) => {
                      const content = `
                      ${v.pubParams.title}
                      ${v.pubParams.describe}
                    `;
                      if (content.trim() !== "" && !contentSet.has(content)) {
                        contentSet.add(content);
                        tasks.push(sensitiveDetCore(content, v));
                      }
                    });
                    return await Promise.all(tasks);
                  };

                  const taskRes = await Promise.all([
                    core(),
                    sensitivityLoading(),
                  ]);
                  const res = taskRes[0];

                  setSensitiveDetLoading(false);

                  if (res.length === 0) return message.success("检测正常");
                  if (res.every((v) => !v.sensitive)) {
                    message.success("检测正常");
                    return;
                  }
                  for (const { sensitive, videoItem } of res) {
                    if (sensitive) {
                      message.warning("检测到此条作品存在敏感信息！");
                      setVideoPubSetModalOpen(true);
                      setCurrChooseAccountId(videoItem.id);
                      break;
                    }
                  }
                }}
              >
                内容安全检测
              </Button>

              <Button
                type="primary"
                disabled={!videoListChoose.every((v) => v.account && v.video)}
                onClick={() => {
                  setVideoPubSetModalOpen(true);
                  setCurrChooseAccountId(videoListChoose[0].id);
                }}
              >
                预览及发布
              </Button>
            </div>
          </div>
        ) : (
          // 视频未选择
          <NoChoosePage />
        )}
      </Spin>
    </div>
  );
}
