import { ForwardedRef, forwardRef, memo, useRef, useState } from 'react';
import VideoChoose from '@/components/Choose/VideoChoose';
import SupportPlat from '../../../components/SupportPlat/SupportPlat';
import { PubType } from '../../../../../../commont/publish/PublishEnum';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import localUpload from '../images/localUpload.png';
import importRecord from '../images/importRecord.png';
import { Alert, Button, message, Modal } from 'antd';
import PubRecord from '../../pubRecord/page';
import { icpGetPubVideoRecord } from '../../../../../icp/publish';
import { useAccountStore } from '../../../../../store/account';

export interface INoChoosePageRef {}

export interface INoChoosePageProps {}

// 未选择视频时暂时的组件
const NoChoosePage = memo(
  forwardRef(({}: INoChoosePageProps, ref: ForwardedRef<INoChoosePageRef>) => {
    const { addVideos, setLoadingPageLoading, setOperateId, restartPub } =
      useVideoPageStore(
        useShallow((state) => ({
          addVideos: state.addVideos,
          setLoadingPageLoading: state.setLoadingPageLoading,
          setOperateId: state.setOperateId,
          restartPub: state.restartPub,
        })),
      );
    const [importPubRecordOpen, setImportPubRecordOpen] = useState(false);
    const pubRecordIds = useRef<number[]>([]);
    const { accountMap } = useAccountStore(
      useShallow((state) => ({
        accountMap: state.accountMap,
      })),
    );

    return (
      <div className="video-pubBefore">
        <Modal
          open={importPubRecordOpen}
          width="90%"
          title="导入发布记录"
          okText="确认导入"
          onCancel={() => setImportPubRecordOpen(false)}
          onOk={async () => {
            if (pubRecordIds.current.length === 0) {
              return message.warning('未选择任何数据');
            }
            const res = await icpGetPubVideoRecord(pubRecordIds.current[0]);
            restartPub(
              res,
              res.map((k) => accountMap.get(k.accountId)!),
            );
            setImportPubRecordOpen(false);
          }}
        >
          <Alert message="选择一条发布记录" />
          <PubRecord
            hegiht="55vh"
            onChange={async (ids) => {
              pubRecordIds.current = ids;
            }}
          />
        </Modal>

        <h1>视频发布</h1>
        <p className="video-pubBefore-tip">
          支持多视频、多平台、多账号同时发布
        </p>

        <div className="video-pubBefore-con">
          <VideoChoose
            onMultipleChoose={(videoFiles) => {
              setOperateId();
              addVideos(videoFiles);
            }}
            onStartShoose={() => {
              setLoadingPageLoading(true);
            }}
            onChooseFail={() => {
              setLoadingPageLoading(false);
            }}
          >
            <img src={localUpload} />
            <Button type="primary" size="large">
              本地上传
            </Button>
          </VideoChoose>

          <div
            className="videoChoose"
            onClick={() => {
              setImportPubRecordOpen(true);
              console.log('click');
            }}
          >
            <img src={importRecord} />
            <Button type="primary" size="large">
              导入发布记录
            </Button>
          </div>
        </div>

        <SupportPlat pubType={PubType.VIDEO} type={1} />
      </div>
    );
  }),
);
NoChoosePage.displayName = 'NoChoosePage';

export default NoChoosePage;
