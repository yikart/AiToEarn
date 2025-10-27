import { ForwardedRef, forwardRef, memo, useRef, useState } from 'react';
import VideoChoose from '@/components/Choose/VideoChoose';
import SupportPlat from '../../../components/SupportPlat/SupportPlat';
import { PubType } from '../../../../../../commont/publish/PublishEnum';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import localUpload from '../images/localUpload.png';
import importRecord from '../images/importRecord.png';
import { Alert, message, Modal } from 'antd';
import PubRecord from '../../pubRecord/page';
import { icpGetPubVideoRecord } from '../../../../../icp/publish';
import { useAccountStore } from '../../../../../store/account';
import { ChooseChunk } from '../../../components/CommonComponents/CommonComponents';
import { PubRecordModel } from '../../../comment';

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
    const pubRecord = useRef<PubRecordModel>();
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
            if (!pubRecord.current) {
              return message.warning('未选择任何数据');
            }
            const res = await icpGetPubVideoRecord(pubRecord.current.id);
            restartPub(
              res,
              res.map((k) => accountMap.get(k.accountId)!),
              pubRecord.current,
            );
            setImportPubRecordOpen(false);
          }}
        >
          <Alert message="选择一条发布记录" />
          <PubRecord
            hegiht="55vh"
            defaultPubType={PubType.VIDEO}
            onChange={async (pubRecordModel) => {
              pubRecord.current = pubRecordModel;
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
            <ChooseChunk
              text="本地上传"
              imgUrl={localUpload}
              color="linear-gradient(to right, rgb(255, 142, 28), rgb(255, 124, 24))"
              hoverColor="rgb(255, 142, 28)"
              style={{ marginRight: '15px' }}
            />
          </VideoChoose>

          <ChooseChunk
            text="导入发布记录"
            imgUrl={importRecord}
            color="#a66ae4"
            onClick={() => {
              setImportPubRecordOpen(true);
            }}
          />
        </div>

        <SupportPlat pubType={PubType.VIDEO} style={{ marginTop: '15px' }} />
      </div>
    );
  }),
);
NoChoosePage.displayName = 'NoChoosePage';

export default NoChoosePage;
