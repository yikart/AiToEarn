import { useEffect, useMemo, useState } from 'react';
import { PubRecordModel } from '../../comment';
import styles from './pubRecord.module.scss';
import { icpGetPubRecordList, icpGetPubVideoRecord } from '@/icp/publish';
import {
  Avatar,
  Button,
  Drawer,
  Image,
  Modal,
  Spin,
  Table,
  TableProps,
  Tag,
  Tooltip,
} from 'antd';
import { getImgFile, IImgFile } from '@/components/Choose/ImgChoose';
import { formatTime, getFilePathName } from '@/utils';
import { VideoPul } from '@/views/publish/children/videoPage/comment';
import { AccountInfo, AccountPlatInfoMap } from '@/views/account/comment';
import { useVideoPageStore } from '../videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';
import { AccountType } from '../../../../../commont/AccountEnum';
import WebView from '../../../../components/WebView';
import { getVideoFile } from '../../../../components/Choose/VideoChoose';
import { useAccountStore } from '../../../../store/account';

export const ImageView = ({
  prm,
  width,
  height,
}: {
  prm: PubRecordModel;
  width: number | string;
  height: number | string;
}) => {
  const [imgFile, setImgFile] = useState<IImgFile>();
  useEffect(() => {
    getImgFile(prm.coverPath).then((res) => {
      setImgFile(res);
    });
  }, []);
  return (
    <div
      className={styles['pubRecord-pubCon']}
      style={{ minHeight: height + 'px' }}
    >
      {imgFile && <Image src={imgFile.imgUrl} height={height} width={width} />}
      <span
        title={getFilePathName(prm.videoPath)}
        className="pubRecord-pubCon-name"
      >
        {getFilePathName(prm.videoPath)}
      </span>
    </div>
  );
};

export default function Page({
  hegiht = '78vh',
  onChange,
}: {
  hegiht?: string;
  onChange?: (ids: number[]) => void;
}) {
  const [pulRecardList, setRecardList] = useState<PubRecordModel[]>([]);
  const [open, setOpen] = useState(false);
  const [currPubRecordModel, setCurrPubRecordModel] =
    useState<PubRecordModel>();
  const [recordLoaidng, setRecordLoaidng] = useState(false);
  const [pubRecordList, setPubRecordList] = useState<VideoPul[]>([]);
  const navigate = useNavigate();
  const [examineVideo, setExamineVideo] = useState<{
    account?: AccountInfo;
    url: string;
    open: boolean;
    jsCode: string;
    videoSrc?: string;
  }>({
    videoSrc: '',
    account: undefined,
    url: '',
    open: false,
    jsCode: '',
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
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

  const columns = useMemo(() => {
    const columns: TableProps<PubRecordModel>['columns'] = [
      {
        title: '序号',
        render: (text, prm, ind) => ind + 1,
        width: 70,
        key: '序号',
      },
      {
        title: '发布内容',
        render: (text, prm) => <ImageView prm={prm} width={30} height={50} />,
        width: 200,
        key: '发布内容',
      },
      {
        title: '发布时间',
        dataIndex: 'publishTime',
        key: 'publishTime',
        render: (text, prm) => formatTime(prm.publishTime),
        width: 200,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (text, prm) => {
          switch (prm.status) {
            case 2:
              return <Tag color="error">全部发布失败</Tag>;
            case 1:
              return <Tag color="success">全部发布成功</Tag>;
            case 3:
              return <Tag color="warning">部分发布成功</Tag>;
            case 0:
              return <Tag color="processing">正在发布</Tag>;
          }
        },
        width: 100,
      },
      {
        title: '操作',
        width: 100,
        key: '操作',
        render: (text, prm) => (
          <>
            <Button
              type="link"
              onClick={async (e) => {
                e.stopPropagation();
                setOpen(true);
                setCurrPubRecordModel(prm);
                setRecordLoaidng(true);
                const res = await icpGetPubVideoRecord(prm.id);
                setRecordLoaidng(false);
                setPubRecordList(res);
              }}
            >
              详情
            </Button>
          </>
        ),
      },
    ];
    return columns;
  }, []);

  useEffect(() => {
    GetPubList();
  }, []);

  async function GetPubList() {
    const res = await icpGetPubRecordList({
      page_no: 1,
      page_size: 10,
    });
    setRecardList(res.list);
  }

  const close = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (onChange) onChange(selectedRowKeys);
  }, [selectedRowKeys]);

  const rowSelection: TableProps<PubRecordModel>['rowSelection'] = {
    onChange: (
      selectedRowKeys: React.Key[],
      selectedRows: PubRecordModel[],
    ) => {
      setSelectedRowKeys(selectedRowKeys as number[]);
    },
    getCheckboxProps: (record: PubRecordModel) => ({
      name: record.title,
    }),
    selectedRowKeys,
  };

  return (
    <div
      className={[
        styles.pubRecord,
        onChange && styles['pubRecord-component'],
      ].join(' ')}
    >
      <Modal
        zIndex={10000}
        open={examineVideo.open}
        forceRender={true}
        footer={null}
        onCancel={() => {
          setExamineVideo((prevState) => {
            const newState = { ...prevState };
            newState.open = false;
            newState.url = '';
            newState.videoSrc = '';
            return newState;
          });
        }}
        title="查看视频"
        width="90%"
      >
        <div style={{ height: '70vh' }}>
          {examineVideo.videoSrc ? (
            <>
              <video
                src={examineVideo.videoSrc}
                controls
                autoPlay
                style={{ margin: '0 auto', display: 'block', height: '100%' }}
              />
            </>
          ) : (
            <>
              {examineVideo.account && open ? (
                <WebView
                  url={examineVideo.url}
                  cookieParams={{
                    cookies: JSON.parse(examineVideo.account.loginCookie),
                  }}
                  key={examineVideo.url + examineVideo.open}
                />
              ) : (
                ''
              )}
            </>
          )}
        </div>
      </Modal>

      <Table<PubRecordModel>
        columns={columns}
        dataSource={pulRecardList}
        scroll={{ y: hegiht }}
        rowKey="id"
        rowSelection={onChange ? { type: 'radio', ...rowSelection } : undefined}
        onRow={(record) => ({
          onClick: () => {
            setSelectedRowKeys([record.id]);
          },
        })}
      />

      {/*发布记录详情*/}
      <Drawer title="发布记录" onClose={close} open={open} width={600}>
        <Spin spinning={recordLoaidng}>
          <div className={styles.pubRecord} style={{ padding: '0' }}>
            <ImageView prm={currPubRecordModel!} width="auto" height={150} />

            <ul className="pubRecord-record">
              {pubRecordList.map((v) => {
                const account = accountMap.get(v.accountId);
                const plat = AccountPlatInfoMap.get(v.type);
                return (
                  <li className="pubRecord-record-item" key={v.id}>
                    <div
                      className={[
                        'pubRecord-record-item-status',
                        v.status === 1
                          ? 'pubRecord-record-item--success'
                          : v.status === 0
                            ? 'pubRecord-record-item--processing'
                            : 'pubRecord-record-item--fail',
                      ].join(' ')}
                    >
                      {v.status === 1
                        ? '发布成功'
                        : v.status === 0
                          ? '发布中'
                          : '发布失败'}
                    </div>
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
                      {v.status !== 1 ? (
                        <Button
                          type="link"
                          onClick={() => {
                            setRecordLoaidng(true);
                            const prl = pubRecordList.filter(
                              (v) => v.status === 2,
                            );
                            restartPub(
                              prl,
                              prl.map((k) => accountMap.get(k.accountId)!),
                            );
                            setRecordLoaidng(false);
                            navigate('/publish/video');
                          }}
                        >
                          重新发布
                        </Button>
                      ) : (
                        <Button
                          type="link"
                          onClick={async () => {
                            if (!v.dataId) return;
                            const videoFile = await getVideoFile(v.videoPath!);
                            setExamineVideo((prevState) => {
                              const newState = { ...prevState };
                              newState.open = true;
                              newState.account = account;

                              if (account?.type === AccountType.WxSph) {
                                newState.videoSrc = videoFile.videoUrl;
                              } else {
                                newState.url = v.previewVideoLink || '';
                              }
                              return newState;
                            });
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
    </div>
  );
}
