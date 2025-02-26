/*
 * @Author: nevin
 * @Date: 2025-01-22 21:37:00
 * @LastEditTime: 2025-02-17 20:31:04
 * @LastEditors: nevin
 * @Description:
 */
import styles from './kwai.module.scss';
import WebView from '@/components/WebView';
import React, { useRef, useState } from 'react';
import { Button, message } from 'antd';
import { AccountInfo } from '@/views/account/comment';

import VideoChoose from '@/components/Choose/VideoChoose';
import {
  icpCreatePubRecord,
  icpCreateVideoPubRecord,
  icpPubVideo,
} from '@/icp/publish';
import { AccountType } from '../../../../commont/AccountEnum';
import {
  PubType,
  VisibleTypeEnum,
} from '../../../../commont/publish/PublishEnum';

export default function Kwai() {
  const [pubLoading, setPubLoading] = useState(false);
  const url = useRef('https://cp.kuaishou.com/article/publish/video?tabType=1');
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const videoPath = useRef('');

  return (
    <div className={styles.kwai}>
      <div className="kwai-options">
        <VideoChoose
          onChoose={(res) => {
            videoPath.current = res.videoPath;
          }}
        />
        <Button
          onClick={async () => {
            try {
            } catch (error) {
              message.error('获取账户信息失败');
              console.error(error);
            }
            console.log('获取');
          }}
        >
          获取cookie
        </Button>
        <Button
          loading={pubLoading}
          onClick={async () => {
            if (!videoPath.current) {
              return message.warning('请选择视频');
            }

            setPubLoading(true);

            const finish = () => {
              setPubLoading(false);
            };

            const params = {
              coverPath: '/',
              videoPath: videoPath.current,
              desc: '#事故现场记录  #风sir',
              title: '/',
            };
            // 一级记录
            const recordRes = await icpCreatePubRecord({
              ...params,
              type: PubType.VIDEO,
            }).catch((err) => {
              message.error(err);
              finish();
            });
            if (!recordRes) return finish();
            // 二级视频记录添加
            await icpCreateVideoPubRecord({
              ...params,
              type: AccountType.KWAI,
              accountId: 3,
              pubRecordId: recordRes.id,
              publishTime: new Date(),
              visibleType: VisibleTypeEnum.Private,
            });
            // 发布core
            await icpPubVideo(recordRes.id).catch(() => finish());
            finish();
          }}
        >
          发布
        </Button>
      </div>
      <div className="kwai-webview">
        <WebView url={url.current} />
      </div>
    </div>
  );
}
