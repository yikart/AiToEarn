import { useEffect, useRef, useState } from 'react';
import { PubRecordModel } from '../../comment';
import styles from './pubRecord.module.scss';
import { icpGetPubRecordList, icpGetPubVideoRecord } from '@/icp/publish';
import { Avatar, Button, Drawer, Spin, Table, TableProps, Tooltip } from 'antd';
import { getImgFile, IImgFile } from '@/components/Choose/ImgChoose';
import { formatTime, getFilePathName } from '@/utils';
import { VideoPul } from '@/views/publish/children/videoPage/comment';
import { icpGetAccountList } from '@/icp/account';
import { AccountInfo, AccountPlatInfoMap } from '@/views/account/comment';

const PubCon = ({ prm }: { prm: PubRecordModel }) => {
  const [imgFile, setImgFile] = useState<IImgFile>();
  useEffect(() => {
    getImgFile(prm.coverPath).then((res) => {
      setImgFile(res);
    });
  }, []);
  return (
    <div className="pubRecord-pubCon">
      {imgFile && <img src={imgFile.imgUrl} />}
      <span
        title={getFilePathName(prm.videoPath)}
        className="pubRecord-pubCon-name"
      >
        {getFilePathName(prm.videoPath)}
      </span>
    </div>
  );
};

export default function Page() {
  const [pulRecardList, setRecardList] = useState<PubRecordModel[]>([]);
  const [open, setOpen] = useState(false);
  const [currPubRecordModel, setCurrPubRecordModel] =
    useState<PubRecordModel>();
  const [recordLoaidng, setRecordLoaidng] = useState(false);
  const [pubRecordList, setPubRecordList] = useState<VideoPul[]>([]);
  // id=账户id，val=账户item数据
  const accountMap = useRef<Map<number, AccountInfo>>(new Map());

  const columns: TableProps<PubRecordModel>['columns'] = [
    {
      title: '序号',
      render: (text, prm, ind) => ind + 1,
      width: 70,
      key: '序号',
    },
    {
      title: '发布内容',
      render: (text, prm) => <PubCon prm={prm} />,
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
      title: '操作',
      width: 100,
      key: '操作',
      render: (text, prm) => (
        <>
          <Button
            type="link"
            onClick={async () => {
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
    icpGetAccountList().then((res) => {
      res.map((v) => {
        accountMap.current.set(v.id, v);
      });
      GetPubList();
    });
  }, []);

  return (
    <div className={styles.pubRecord}>
      <Table<PubRecordModel>
        columns={columns}
        dataSource={pulRecardList}
        scroll={{ y: '78vh' }}
        rowKey="id"
      />

      {/*发布记录详情*/}
      <Drawer title="发布记录" onClose={close} open={open} width={600}>
        <Spin spinning={recordLoaidng}>
          <div className={styles.pubRecord} style={{ padding: '0' }}>
            <PubCon prm={currPubRecordModel!} />

            <ul className="pubRecord-record">
              {pubRecordList.map((v) => {
                const account = accountMap.current.get(v.accountId);
                const plat = AccountPlatInfoMap.get(v.type);
                return (
                  <li className="pubRecord-record-item" key={v.id}>
                    <div
                      className={`pubRecord-record-item-status ${v.status === 1 ? 'pubRecord-record-item--success' : 'pubRecord-record-item--fail'}`}
                    >
                      {v.status === 1 ? '发布成功' : '发布失败'}
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
                            {formatTime(v.publishTime)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="pubRecord-record-item-btns">
                      <Button type="link">查看</Button>
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
