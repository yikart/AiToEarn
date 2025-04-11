import { useEffect, useMemo, useRef, useState } from 'react';
import { PubRecordModel } from '../../comment';
import styles from './pubRecord.module.scss';
import { icpGetPubRecordList } from '@/icp/publish';
import { Button, Image, Modal, Select, Table, TableProps, Tag } from 'antd';
import { getImgFile, IImgFile } from '@/components/Choose/ImgChoose';
import { formatTime, getFilePathName } from '@/utils';
import { AccountInfo } from '@/views/account/comment';
import WebView from '../../../../components/WebView';
import { PubType } from '../../../../../commont/publish/PublishEnum';
import PubRecordDetails, {
  IPubRecordDetailsRef,
} from './components/PubRecordDetails';

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
  const [imgUrl, setImgUrl] = useState('');

  useEffect(() => {
    if (prm.coverPath.includes('https://')) {
      setImgUrl(prm.coverPath);
    } else {
      getImgFile(prm.coverPath).then((res) => {
        setImgFile(res);
      });
    }
  }, []);

  const filename = useMemo(() => {
    return getFilePathName(prm.videoPath!).filename;
  }, []);

  return (
    <div
      className={styles['pubRecord-pubCon']}
      style={{ minHeight: height + 'px' }}
    >
      {imgUrl ? (
        <Image src={imgUrl} height={height} width={width} />
      ) : (
        <>
          {imgFile && (
            <Image src={imgFile.imgUrl} height={height} width={width} />
          )}
          <span title={filename} className="pubRecord-pubCon-name">
            {filename}
          </span>
        </>
      )}
    </div>
  );
};

export interface IExamineVideo {
  account?: AccountInfo;
  url: string;
  open: boolean;
  jsCode: string;
  videoSrc?: string;
}

export default function Page({
  hegiht = '75vh',
  onChange,
  defaultPubType,
}: {
  hegiht?: string;
  onChange?: (pubRecordModel: PubRecordModel) => void;
  defaultPubType?: PubType;
}) {
  const [pulRecardList, setRecardList] = useState<PubRecordModel[]>([]);
  const [examineVideo, setExamineVideo] = useState<IExamineVideo>({
    videoSrc: '',
    account: undefined,
    url: '',
    open: false,
    jsCode: '',
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const pubRecordDetailsRef = useRef<IPubRecordDetailsRef>(null);
  // 发布类型的筛选
  const [pubType, setPubType] = useState<PubType | undefined>(defaultPubType);

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
        title: '发布类型',
        dataIndex: 'type',
        key: 'type',
        render: (_, prm) => {
          switch (prm.type) {
            case PubType.ARTICLE:
              return <>文章发布</>;
            case PubType.VIDEO:
              return <>视频发布</>;
            case PubType.ImageText:
              return <>图文发布</>;
          }
        },
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
                pubRecordDetailsRef.current?.oepnPubRecordDetails(prm);
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
  }, [pubType]);

  async function GetPubList() {
    const res = await icpGetPubRecordList(
      {
        page_no: 1,
        page_size: 10,
      },
      {
        type: pubType,
      },
    );
    setRecardList(res.list);
  }

  useEffect(() => {
    if (onChange)
      onChange(pulRecardList.find((v) => v.id === selectedRowKeys[0])!);
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
            newState.account = undefined;
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
              {examineVideo.account ? (
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

      {!onChange && (
        <div className="pubRecord-options">
          <Select
            style={{ width: 120 }}
            placeholder="发布类型"
            allowClear
            onChange={(e) => {
              setPubType(e as PubType);
            }}
            options={[
              { value: PubType.ARTICLE, label: '文章' },
              { value: PubType.ImageText, label: '图文' },
              { value: PubType.VIDEO, label: '视频' },
            ]}
          />
        </div>
      )}

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

      <PubRecordDetails
        ref={pubRecordDetailsRef}
        onExamineVideoClick={(e) => {
          setExamineVideo((prevState) => {
            return {
              ...prevState,
              ...e,
            };
          });
        }}
      />
    </div>
  );
}
