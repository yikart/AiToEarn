import styles from './image.module.scss';
import { useShallow } from 'zustand/react/shallow';
import { useImagePageStore } from './useImagePageStore';
import ImageLeftSetting from './components/ImageLeftSetting/ImageLeftSetting';
import ImageRightSetting from './components/ImageRightSetting/ImageRightSetting';
import { Button, Popconfirm } from 'antd';
import { useEffect } from 'react';

export default function Page() {
  const { clear } = useImagePageStore(
    useShallow((state) => ({
      clear: state.clear,
    })),
  );

  useEffect(() => {
    return () => {
      clear();
    };
  }, []);

  return (
    <div className={styles.image}>
      <div className="image-wrapper">
        <ImageLeftSetting />
        <ImageRightSetting />
      </div>
      <div className="image-footer">
        <Popconfirm
          title="温馨提示"
          description="是否确认清空内容和账号？"
          onConfirm={() => {
            clear();
          }}
          okText="确认"
          cancelText="取消"
        >
          <Button style={{ marginRight: '20px' }}>一键清空</Button>
        </Popconfirm>
        <Button type="primary">一键发布</Button>
      </div>
    </div>
  );
}
