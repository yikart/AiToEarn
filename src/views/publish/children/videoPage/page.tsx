import styles from './video.module.scss';
import VideoChoose from '@/components/Choose/VideoChoose';
import { useEffect, useRef, useState } from 'react';
import { Button, Popconfirm, Spin, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ChooseAccountModule from '@/views/publish/components/ChooseAccountModule/ChooseAccountModule';
import NoChoosePage from '@/views/publish/children/videoPage/components/NoChoosePage';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { PubType } from '@@/publish/PublishEnum';
import VideoChooseItem from '@/views/publish/children/videoPage/components/VideoChooseItem';
import CommonPubSetting from '@/views/publish/children/videoPage/components/CommonPubSetting';
import VideoPubSetModal from '@/views/publish/children/videoPage/components/VideoPubSetModal/VideoPubSetModal';

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

  useEffect(() => {
    return () => {
      // clear();
    };
  }, []);

  return (
    <div className={styles.video}>
      <Spin spinning={loadingPageLoading}>
        <VideoPubSetModal onClose={setVideoPubSetModalOpen} />

        <ChooseAccountModule
          disableAllSelect={
            accountChooseType.current === AccountChooseType.Radio
          }
          open={chooseAccountOpen}
          onClose={setChooseAccountOpen}
          choosedAccounts={videoListChoose
            .map((v) => v.account)
            .filter((v) => v !== undefined)}
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
          pubType={PubType.VIDEO}
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
                onConfirm={() => clear()}
                okText="确认"
                cancelText="取消"
              >
                <Button style={{ marginRight: '15px' }}>一键清空</Button>
              </Popconfirm>
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
