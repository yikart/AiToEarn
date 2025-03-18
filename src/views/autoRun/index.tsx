/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-18 22:25:37
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import { Button, Card, Col, Row } from 'antd';
import { useCallback, useRef, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import styles from './reply.module.scss';
import AddAutoRun, { AddAutoRunRef } from './components/addAutoRun';
import {
  AutoRun,
  AutoRunRecord,
  ipcGetAutoRunList,
  ipcGetAutoRunRecordList,
} from '@/icp/autoRun';

export default function Page() {
  const [autoRunList, setAutoRunList] = useState<AutoRun[]>([]);
  const [autoRunRecordList, setAutoRunRecordList] = useState<AutoRunRecord[]>(
    [],
  );
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);

  const Ref_AddAutoRun = useRef<AddAutoRunRef>(null);

  async function getAutoRunList() {
    if (activeAccountId === -1) return;
    setAutoRunList([]);
    const res = await ipcGetAutoRunList();
    setAutoRunList(res);
  }

  async function getAutoRunRecordList() {
    setAutoRunRecordList([]);
    const res = await ipcGetAutoRunRecordList();
    setAutoRunRecordList(res);
  }

  /**
   * 运行
   */
  async function runAutoRun(data: AutoRun) {
    // const res = await icpCreateCommentList(activeAccountId, data.dataId);
    // console.log('------ res', res);
  }

  /**
   * 打开评论回复
   * @param data
   */
  function openAddAutoRun() {
    Ref_AddAutoRun.current?.init(activeAccountId);
  }

  return (
    <div className={styles.reply}>
      <Button
        type="primary"
        onClick={() => {
          openAddAutoRun();
        }}
      >
        创建自动化
      </Button>
      <Row>
        <Col span={4}>
          <AccountSidebar
            activeAccountId={activeAccountId}
            onAccountChange={useCallback(
              (info) => {
                setActiveAccountId(info.id);
                getAutoRunList();
              },
              [getAutoRunList],
            )}
          />
        </Col>
        <Col span={10}>
          <div>
            {autoRunList.map((item) => (
              <Card
                key={item.id}
                style={{ width: 300 }}
                actions={[
                  <Button type="primary" onClick={() => runAutoRun(item)}>
                    执行
                  </Button>,
                  <Button type="primary">删除</Button>,
                  <Button type="primary" onClick={() => getAutoRunRecordList()}>
                    查看记录
                  </Button>,
                ]}
              ></Card>
            ))}
          </div>
        </Col>
        <Col span={10}>
          <div>
            {autoRunRecordList.map((item) => (
              <Card key={item.id} style={{ width: 300 }}>
                {item.cycleType}
              </Card>
            ))}
          </div>
        </Col>
      </Row>

      <AddAutoRun ref={Ref_AddAutoRun} />
    </div>
  );
}
