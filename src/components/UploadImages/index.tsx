import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
} from 'react';
import styles from './uploadImages.module.scss';
import React, { useState } from 'react';
import { Image, Upload } from 'antd';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useUserStore } from '../../store/user';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;
const VITE_APP_URL = import.meta.env.VITE_APP_URL;
type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export interface IUploadimagesRef {
  clear: () => void;
}

export interface IUploadimagesProps extends UploadProps {
  onUploadChange: (files: UploadFile[]) => void;
  fileListValue?: UploadFile[];
}

const Uploadimages = memo(
  forwardRef(
    (
      { onUploadChange, ...props }: IUploadimagesProps,
      ref: ForwardedRef<IUploadimagesRef>,
    ) => {
      const [previewOpen, setPreviewOpen] = useState(false);
      const [previewImage, setPreviewImage] = useState('');
      const [fileList, setFileList] = useState<UploadFile[]>([]);
      const token = useUserStore((state) => state.token);

      const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
          file.preview = await getBase64(file.originFileObj as FileType);
        }

        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
      };

      const handleChange: UploadProps['onChange'] = ({
        fileList: newFileList,
      }) => {
        newFileList = newFileList.map((v) => {
          if (v.status === 'done') {
            v.url = FILE_BASE_URL + v.response?.data.name;
            return v;
          }
          return v;
        });
        setFileList(newFileList);
      };

      const imperativeHandle: IUploadimagesRef = {
        clear() {
          setFileList([]);
        },
      };
      useImperativeHandle(ref, () => imperativeHandle);

      useEffect(() => {
        onUploadChange(fileList.filter((v) => v.url && v.status === 'done'));
      }, [fileList]);

      const uploadButton = (
        <button
          style={{ border: 0, background: 'none', cursor: 'pointer' }}
          type="button"
        >
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传</div>
        </button>
      );
      return (
        <div className={styles.uploadImages}>
          <Upload
            {...props}
            action={`${VITE_APP_URL}/oss/upload/permanent`}
            accept=".png,.jpg,.jpeg"
            listType="picture-card"
            headers={{
              Authorization: `Bearer ${token}`,
            }}
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
            multiple={true}
          >
            {fileList.length >= 8 ? null : uploadButton}
          </Upload>
          {previewImage && (
            <Image
              wrapperStyle={{ display: 'none' }}
              preview={{
                visible: previewOpen,
                onVisibleChange: (visible) => setPreviewOpen(visible),
                afterOpenChange: (visible) => !visible && setPreviewImage(''),
              }}
              src={previewImage}
            />
          )}
        </div>
      );
    },
  ),
);
Uploadimages.displayName = 'Uploadimages';

export default Uploadimages;
