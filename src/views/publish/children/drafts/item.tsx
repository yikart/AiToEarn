/*
 * @Author: nevin
 * @Date: 2025-02-17 19:28:13
 * @LastEditTime: 2025-02-17 22:30:22
 * @LastEditors: nevin
 * @Description: 草稿数据详情
 */
import { forwardRef, useImperativeHandle, useState } from 'react';
import {
  icpGetPubRecordItemList,
  icpPublishDelPubRecordById,
  icpPublishDelPubRecordItem,
} from '@/icp/publish';
import { icpGetAccountListByIds } from '@/icp/account';
import { AccountInfo, AccountPlatInfoMap } from '@/views/account/comment';
import { Avatar, Button, Drawer, Spin } from 'antd';
import styles from './pubRecord.module.scss';
import { PubRecordModel } from '../../comment';

export interface PubItemRef {
  init: (pubRecord: PubRecordModel) => Promise<void>;
}

export default forwardRef<PubItemRef>((props, ref) => {
  const [open, setOpen] = useState(false);
  const [recordLoaidng, setRecordLoaidng] = useState(false);
  const [pubRecord, setPubRecord] = useState<PubRecordModel | null>(null);
  const [accountList, setAccountList] = useState<AccountInfo[]>([]);

  function close() {
    setOpen(false);
  }

  async function init(info: PubRecordModel) {
    setPubRecord(info);

    setRecordLoaidng(true);

    const res = await icpGetPubRecordItemList(
      {
        page_no: 1,
        page_size: 10,
      },
      info.id,
    );

    getAccountListByIds(res.list.map((item) => item.accountId));

    setOpen(true);
    setRecordLoaidng(false);
  }

  async function getAccountListByIds(ids: number[]) {
    const res = await icpGetAccountListByIds(ids);
    setAccountList(res);
  }

  async function delPubRecord() {
    if (!pubRecord) return;
    const res = await icpPublishDelPubRecordById(pubRecord.id);
    if (!res) setPubRecord(null);
  }

  /**
   * 删除账户
   * @param info
   */
  async function delPubRecordAccount(accountInfo: AccountInfo) {
    if (!pubRecord) return;

    const res = await icpPublishDelPubRecordItem(
      pubRecord.id,
      pubRecord.type,
      accountInfo.id,
    );
    if (!res) setPubRecord(null);
  }

  /**
   * TODO: 发布
   */
  async function pul() {}

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  return (
    <div className={styles.pubRecord}>
      <Drawer title="关联账号" onClose={close} open={open} width={600}>
        <Spin spinning={recordLoaidng}>
          <div className={styles.pubRecord} style={{ padding: '0' }}>
            <ul className="pubRecord-record">
              {accountList.map((account) => {
                const plat = AccountPlatInfoMap.get(account.type);
                return (
                  <li className="pubRecord-record-item" key={account.id}>
                    <div className="pubRecord-record-item-con">
                      <div className="pubRecord-record-item-con-avatar">
                        <Avatar size="large" src={account?.avatar} />
                        <img src={plat?.icon} />
                        <p>{account.uid}</p>
                        <p>{account.nickname}</p>
                      </div>
                    </div>
                    <div className="pubRecord-record-item-btns">
                      <Button
                        type="link"
                        onClick={() => delPubRecordAccount(account)}
                      >
                        删除
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '20px',
              }}
            >
              <Button onClick={pul}>发布</Button>
              <Button onClick={delPubRecord}>删除</Button>
            </div>
          </div>
        </Spin>
      </Drawer>
    </div>
  );
});
