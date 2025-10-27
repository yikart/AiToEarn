import {
  ForwardedRef,
  forwardRef,
  memo,
  useImperativeHandle,
  useState,
} from 'react';
import { Avatar, Button, Drawer, Spin, Tooltip } from 'antd';
import styles from '../pubRecord.module.scss';
import { AccountPlatInfoMap } from '../../../../account/comment';
import { formatTime } from '../../../../../utils';
import { getVideoFile } from '../../../../../components/Choose/VideoChoose';
import { PlatType } from '../../../../../../commont/AccountEnum';
import { IExamineVideo, ImageView } from '../page';
import { PubRecordModel } from '../../../comment';
import { useAccountStore } from '../../../../../store/account';
import { useShallow } from 'zustand/react/shallow';
import { useVideoPageStore } from '../../videoPage/useVideoPageStore';
import { useNavigate } from 'react-router-dom';
import { WorkData } from '../../../../../../electron/db/models/workData';
import { VideoModel } from '../../../../../../electron/db/models/video';
import { PubType } from '../../../../../../commont/publish/PublishEnum';
import {
  icpGetImgTextList,
  icpGetPubVideoRecord,
  PubStatusCnMap,
} from '../../../../../icp/publish';

export interface IPubRecordDetailsRef {
  // 打开详情
  oepnPubRecordDetails: (pubRecordModel: PubRecordModel) => void;
}

export interface IPubRecordDetailsProps {
  onExamineVideoClick: (examineVideo: IExamineVideo) => void;
}

const PubRecordDetails = memo(
  forwardRef(
    (
      { onExamineVideoClick }: IPubRecordDetailsProps,
      ref: ForwardedRef<IPubRecordDetailsRef>,
    ) => {
      const [recordLoaidng, setRecordLoaidng] = useState(false);
      const [currPubRecordModel, setCurrPubRecordModel] =
        useState<PubRecordModel>();
      const [open, setOpen] = useState(false);
      // 视频发布记录列表
      const [pubRecordList, setPubRecordList] = useState<WorkData[]>([]);
      const { accountMap } = useAccountStore(
        useShallow((state) => ({
          accountMap: state.accountMap,
        })),
      );
      const { restartPub } = useVideoPageStore(
        useShallow((state) => ({
          restartPub: state.restartPub,
        })),
      );
      const navigate = useNavigate();

      const imperativeHandle: IPubRecordDetailsRef = {
        async oepnPubRecordDetails(pubRecordModel) {
          setCurrPubRecordModel(pubRecordModel);
          setRecordLoaidng(true);
          if (pubRecordModel.type === PubType.VIDEO) {
            const res = await icpGetPubVideoRecord(pubRecordModel.id);
            setPubRecordList(res);
          } else if (pubRecordModel.type === PubType.ImageText) {
            const res = await icpGetImgTextList(pubRecordModel.id);
            setPubRecordList(res);
          }
          setRecordLoaidng(false);
          setOpen(true);
        },
      };
      useImperativeHandle(ref, () => imperativeHandle);

      return (
        <>
          <Drawer
            title="发布记录"
            onClose={() => {
              setOpen(false);
              onExamineVideoClick({
                open: false,
                jsCode: '',
                url: '',
                account: undefined,
              });
            }}
            closeIcon={false}
            open={open}
            width={600}
          >
            <Spin spinning={recordLoaidng}>
              <div className={styles.pubRecord} style={{ padding: '0' }}>
                <ImageView
                  prm={currPubRecordModel!}
                  width="auto"
                  height={150}
                />

                <ul className="pubRecord-record">
                  {pubRecordList?.map((v) => {
                    const account = accountMap.get(v.accountId);
                    const plat = AccountPlatInfoMap.get(v.type);
                    const statusText = PubStatusCnMap[v.status];
                    let className = '';
                    let tooltipText = '';
                    if (v.status === 1) {
                      className = 'pubRecord-record-item--success';
                    } else if (v.status === 0) {
                      className = 'pubRecord-record-item--processing';
                    } else if (v.status === 2) {
                      className = 'pubRecord-record-item--fail';
                    } else if (v.status === 4) {
                      tooltipText =
                        '快手需要几十秒时间审核您的作品，等待几十秒后刷新数据即可';
                      className = 'pubRecord-record-item--processing';
                    }

                    return (
                      <li className="pubRecord-record-item" key={v.id}>
                        <Tooltip title={tooltipText || undefined}>
                          <div
                            className={[
                              'pubRecord-record-item-status',
                              className,
                            ].join(' ')}
                          >
                            {statusText}
                          </div>
                        </Tooltip>
                        <div className="pubRecord-record-item-con">
                          <div className="pubRecord-record-item-con-avatar">
                            <Avatar size="large" src={account?.avatar} />
                            <img src={plat?.icon} />
                          </div>
                          <div className="pubRecord-record-item-userinfo">
                            <b>{account?.nickname}</b>
                            {v.failMsg ? (
                              <Tooltip title={v.failMsg}>
                                <div className="pubRecord-record-item-failMsg">
                                  {v.failMsg}
                                </div>
                              </Tooltip>
                            ) : (
                              <p className="pubRecord-record-item-userinfo-time">
                                {formatTime(v.publishTime!)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="pubRecord-record-item-btns">
                          {v.status === 2 && (
                            <Button
                              type="link"
                              onClick={async () => {
                                if (
                                  currPubRecordModel?.type === PubType.VIDEO
                                ) {
                                  setRecordLoaidng(true);
                                  const prl = pubRecordList.filter(
                                    (v) => v.status === 2,
                                  );
                                  await restartPub(
                                    prl as VideoModel[],
                                    prl.map(
                                      (k) => accountMap.get(k.accountId)!,
                                    ),
                                    currPubRecordModel,
                                  );
                                  setRecordLoaidng(false);
                                  navigate('/publish/video');
                                } else if (
                                  currPubRecordModel?.type === PubType.ImageText
                                ) {
                                }
                              }}
                            >
                              重新发布
                            </Button>
                          )}

                          {v.status === 1 && (
                            <Button
                              type="link"
                              onClick={async () => {
                                if (!v.dataId) return;
                                const newState: IExamineVideo = {
                                  jsCode: '',
                                  open: true,
                                  url: '',
                                  account,
                                };
                                if (account?.type === PlatType.WxSph) {
                                  const videoFile = await getVideoFile(
                                    (v as VideoModel).videoPath!,
                                  );
                                  newState['videoSrc'] = videoFile.videoUrl;
                                } else {
                                  newState['url'] = v.previewVideoLink || '';
                                }
                                onExamineVideoClick(newState);
                              }}
                            >
                              查看
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Spin>
          </Drawer>
        </>
      );
    },
  ),
);
PubRecordDetails.displayName = 'PubRecordDetails';

export default PubRecordDetails;
