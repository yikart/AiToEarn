import styles from './image.module.scss';
import { useShallow } from 'zustand/react/shallow';
import { useImagePageStore } from './useImagePageStore';
import ImageLeftSetting from './components/ImageLeftSetting/ImageLeftSetting';
import ImageRightSetting from './components/ImageRightSetting/ImageRightSetting';
import { Button, message, Popconfirm } from 'antd';
import { useEffect } from 'react';
import usePubParamsVerify from '../../hooks/usePubParamsVerify';

export default function Page() {
  const {
    clear,
    images,
    imageAccounts,
    setActivePlat,
    setPlatActiveAccountMap,
    setErrParamsMap,
  } = useImagePageStore(
    useShallow((state) => ({
      clear: state.clear,
      images: state.images,
      imageAccounts: state.imageAccounts,
      setPlatActiveAccountMap: state.setPlatActiveAccountMap,
      setActivePlat: state.setActivePlat,
      setErrParamsMap: state.setErrParamsMap,
    })),
  );
  const { errParamsMap } = usePubParamsVerify(
    imageAccounts.map((v) => {
      return {
        id: v.account.id,
        account: v.account,
        pubParams: v.pubParams,
      };
    }),
  );

  useEffect(() => {
    setErrParamsMap(errParamsMap);
  }, [errParamsMap]);

  useEffect(() => {
    return () => {
      // clear();
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
        <Button
          type="primary"
          disabled={imageAccounts.length === 0 || images.length === 0}
          onClick={() => {
            for (const [key, errVideoItem] of errParamsMap) {
              if (errVideoItem) {
                const imageAccount = imageAccounts.find(
                  (v) => v.account.id === +key,
                )!;
                const platType = imageAccount!.account.type;
                const platActiveAccountMap = new Map(
                  useImagePageStore.getState().platActiveAccountMap,
                );
                setActivePlat(platType);
                platActiveAccountMap.set(platType, imageAccount);
                setPlatActiveAccountMap(platActiveAccountMap);
                message.warning(errVideoItem.parErrMsg);
                return;
              }
            }
            console.log(errParamsMap);
            console.log('images：', images);
            console.log('imageAccounts：', imageAccounts);
          }}
        >
          一键发布
        </Button>
      </div>
    </div>
  );
}
