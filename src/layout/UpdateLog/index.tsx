import React, { ForwardedRef, forwardRef, memo, useRef, useState } from 'react';
import styles from './updateLog.module.scss';
import { Form, Input, message, Modal } from 'antd';
import { CreatefeedbackParmas, operateApi } from '../../api/feedback';
import Uploadimages, { IUploadimagesRef } from '../../components/UploadImages';
import { ipcGetLogFlies } from '../../icp/tools';
import { icpGetFileStream } from '../../icp/view';
import { toolsApi } from '../../api/tools';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

export interface IUpdatelogRef {}

export interface IUpdatelogProps {}

const { TextArea } = Input;

const Updatelog = memo(
  forwardRef(({}: IUpdatelogProps, ref: ForwardedRef<IUpdatelogRef>) => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const [imgList, setImgList] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const uploadimagesRef = useRef<IUploadimagesRef>(null);

    return (
      <>
        <Modal
          open={open}
          title="意见反馈"
          width={600}
          onCancel={() => setOpen(false)}
          onOk={async () => {
            await form.validateFields();
            setLoading(true);
            const filelogs = await ipcGetLogFlies();
            let fileList: string[] = [];
            for (const filelog of filelogs) {
              const buffer = await icpGetFileStream(filelog);
              const blob = new Blob([buffer], {
                type: `text/plain`,
              });
              const res = await toolsApi.uploadFile(blob);
              fileList = fileList.concat([`${FILE_BASE_URL}${res.name}`]);
            }
            const feddbackRes = await operateApi
              .createfeedback({
                ...form.getFieldsValue(),
                imgUrlList: imgList,
                fileUrlList: fileList,
              })
              .catch(() => false);
            setLoading(false);
            if (!feddbackRes) return;

            setOpen(false);
            message.success('反馈成功，感谢您的反馈！');
            uploadimagesRef.current?.clear();
            form.resetFields();
          }}
          confirmLoading={loading}
        >
          <Form
            form={form}
            labelCol={{ span: 4 }}
            autoComplete="off"
            style={{ marginTop: '20px' }}
          >
            <Form.Item<CreatefeedbackParmas>
              label="反馈内容："
              name="content"
              rules={[{ required: true, message: '请输入反馈内容！' }]}
            >
              <TextArea
                placeholder="请详细描述您的反馈内容，它将成为我们改进产品的最大动力！"
                maxLength={1000}
                style={{ height: 150 }}
              />
            </Form.Item>
            <Form.Item<CreatefeedbackParmas> label="上传图片：">
              <Uploadimages
                maxCount={4}
                ref={uploadimagesRef}
                onUploadChange={(fileList) => {
                  setImgList(fileList.map((v) => v.url) as string[]);
                }}
              />
            </Form.Item>
          </Form>
        </Modal>
        <div
          className={styles.updateLog}
          onClick={() => {
            setLoading(false);
            setOpen(true);
          }}
        >
          意见反馈
        </div>
      </>
    );
  }),
);
Updatelog.displayName = 'Updatelog';

export default Updatelog;
