/*
 * @Author: nevin
 * @Date: 2025-02-13 19:11:37
 * @LastEditTime: 2025-02-17 22:31:25
 * @LastEditors: nevin
 * @Description: 草稿列表
 */
import { useEffect, useRef, useState } from 'react';
import { PubRecordModel } from '../../comment';
import styles from './pubRecord.module.scss';
import { icpGetPubRecordDraftsList } from '@/icp/publish';
import { Button, Table, TableProps } from 'antd';
import { getImgFile, IImgFile } from '@/components/Choose/ImgChoose';
import { formatTime, getFilePathName } from '@/utils';
import { PubType } from '../../../../../commont/publish/PublishEnum';
import PubItem, { PubItemRef } from './item';

const PubTypeNameMap = new Map<PubType, string>([
  [PubType.ARTICLE, '图文'],
  [PubType.VIDEO, '视频'],
]);

const PubStatusNameMap = new Map<number, string>([
  [0, '未发布'],
  [1, '已发布'],
  [2, '发布失败'],
]);

/**
 * 发布的图片
 * @param param0
 * @returns
 */
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

  const Ref_PubItem = useRef<PubItemRef>(null);

  async function GetPubList() {
    const res = await icpGetPubRecordDraftsList({
      page_no: 1,
      page_size: 10,
    });
    setRecardList(res.list);
  }

  useEffect(() => {
    GetPubList();
  }, []);

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
      title: '类型',
      render: (text, prm) => (
        <>
          <p>{PubTypeNameMap.get(prm.type) || ''}</p>
        </>
      ),
      width: 200,
      key: '发布类型',
    },
    {
      title: '创建时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      render: (text, prm) => formatTime(prm.publishTime),
      width: 200,
    },
    {
      title: '发布状态',
      render: (text, prm) => (
        <>
          <p>{PubStatusNameMap.get(prm.status) || ''}</p>
        </>
      ),
      width: 200,
      key: '发布状态',
    },
    {
      title: '操作',
      width: 100,
      key: '操作',
      render: (text, prm) => (
        <>
          <Button type="link" onClick={() => Ref_PubItem.current?.init(prm)}>
            详情
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className={styles.pubRecord}>
      <Table<PubRecordModel>
        columns={columns}
        dataSource={pulRecardList}
        scroll={{ y: '78vh' }}
        rowKey="id"
      />

      {/*发布记录详情*/}
      <PubItem ref={Ref_PubItem} />
    </div>
  );
}
