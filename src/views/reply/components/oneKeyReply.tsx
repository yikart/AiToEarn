/*
 * @Author: nevin
 * @Date: 2025-03-18 21:02:38
 * @LastEditTime: 2025-03-25 13:41:14
 * @LastEditors: nevin
 * @Description: 一键评论
 */
import { icpReplyCommentList, WorkData } from '@/icp/reply';
import { Modal } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { SendChannelEnum } from '@@/UtilsEnum';
import {
  AutorReplyCommentScheduleEvent,
  AutorReplyCommentScheduleEventTagStrMap,
} from '@@/types/reply';

export interface OneKeyReplyRef {
  init: (accountId: number, data: WorkData) => Promise<void>;
}

const Com = forwardRef<OneKeyReplyRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [infoText, setInfoText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [workData, setWorkData] = useState<WorkData | null>(null);
  async function init(accountId: number, data: WorkData) {
    window.ipcRenderer.on(SendChannelEnum.CommentRelyProgress, onGetNotice);
    setWorkData(data);
    setIsModalOpen(true);
    replyCommentList(accountId, data);
  }

  /**
   * 一键AI评论
   */
  async function replyCommentList(inAccountId: number, inWorkData: WorkData) {
    if (!workData?.dataId) return;
    const res = await icpReplyCommentList(inAccountId, inWorkData?.dataId);
    console.log('------ res', res);
  }

  /**
   * 返回值处理
   * @param e
   * @param args
   */
  function onGetNotice(
    e: any,
    args: {
      tag: AutorReplyCommentScheduleEvent;
      status: -1 | 0 | 1;
      data?: any;
      error?: any;
    },
  ) {
    switch (args.tag) {
      case AutorReplyCommentScheduleEvent.Start:
        setInfoText('开始评论');
        break;
      case AutorReplyCommentScheduleEvent.End:
        setInfoText('评论结束');
        break;
      case AutorReplyCommentScheduleEvent.Error:
        setErrorText(args.error?.message || '未知错误');
        break;
      default:
        const tagStr =
          AutorReplyCommentScheduleEventTagStrMap.get(args.tag) || '';
        setInfoText(`${tagStr}`);
        break;
    }
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  function handleCancel() {
    window.ipcRenderer.off(SendChannelEnum.CommentRelyProgress, onGetNotice);
    setIsModalOpen(false);
  }

  return (
    <>
      <Modal
        title="一键评论"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <div className="p-2 mb-4 border border-green-500 rounded-md shadow-md">
          <p className="text-green-500">{infoText}</p>
        </div>
        <div className="p-2 mb-4 border border-red-500 rounded-md shadow-md">
          <p className="text-red-500">{errorText}</p>
        </div>
      </Modal>
    </>
  );
});
export default Com;
