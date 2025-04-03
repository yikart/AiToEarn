/*
 * @Author: nevin
 * @Date: 2025-03-18 21:02:38
 * @LastEditTime: 2025-03-31 11:02:12
 * @LastEditors: nevin
 * @Description: 一键互动
 */
import { WorkData } from '@/icp/reply';
import { message, Modal } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { SendChannelEnum } from '@@/UtilsEnum';
import {
  AutorReplyCommentScheduleEvent,
  AutorReplyCommentScheduleEventTagStrMap,
} from '@@/types/reply';
import { icpCreateInteractionOneKey } from '@/icp/replyother';

export interface InteractionOneKeyRef {
  init: (accountId: number, data: WorkData[]) => Promise<void>;
}

const Com = forwardRef<InteractionOneKeyRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [infoText, setInfoText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [workDataList, setWorkDataList] = useState<WorkData[]>([]);
  async function init(accountId: number, dataList: WorkData[]) {
    window.ipcRenderer.on(SendChannelEnum.CommentRelyProgress, onGetNotice);
    setWorkDataList(dataList);
    setIsModalOpen(true);

    createInteractionOneKey(accountId, dataList);
  }

  /**
   * 一键互动
   */
  async function createInteractionOneKey(
    inAccountId: number,
    inWorkDataList: WorkData[] = [],
  ) {
    if (!inWorkDataList.length) return;
    const res = await icpCreateInteractionOneKey(inAccountId, workDataList, {
      commentContent: '不错啊!收藏了!',
    });
    console.log('------ res', res);
  }

  function closeShow() {
    // 关闭界面
    setTimeout(() => {
      handleCancel();
    }, 1000);

    setTimeout(() => {
      setErrorText('');
      setInfoText('');
    }, 2000);
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
      data?: {
        content: string;
        aiContent: string;
      };
      error?: any;
    },
  ) {
    switch (args.tag) {
      case AutorReplyCommentScheduleEvent.Start:
        setInfoText(`开始评论:${args.data?.content || ''}`);
        break;
      case AutorReplyCommentScheduleEvent.End:
        setInfoText(`评论结束:${args.data?.aiContent || ''}`);
        message.success(`部分平台评论需要审核,评论后的数据可能存在延时`);
        closeShow();
        break;
      case AutorReplyCommentScheduleEvent.Error:
        setErrorText(args.error?.message || '未知错误');
        closeShow();
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
        {errorText && (
          <div className="p-2 mb-4 border border-red-500 rounded-md shadow-md">
            <p className="text-red-500">{errorText}</p>
          </div>
        )}
      </Modal>
    </>
  );
});
export default Com;
