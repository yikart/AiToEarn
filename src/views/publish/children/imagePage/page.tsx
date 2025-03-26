import styles from './image.module.scss';
import { useShallow } from 'zustand/react/shallow';
import { useImagePageStore } from './useImagePageStore';
import ImageLeftSetting from './components/ImageLeftSetting/ImageLeftSetting';
import ImageRightSetting from './components/ImageRightSetting/ImageRightSetting';
import { Button, message, Popconfirm } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import usePubParamsVerify from '../../hooks/usePubParamsVerify';
import PubAccountDetModule, {
  IPubAccountDetModuleRef,
} from '../../components/PubAccountDetModule/PubAccountDetModule';

export default function Page() {
  const {
    clear,
    images,
    imageAccounts,
    setActivePlat,
    setPlatActiveAccountMap,
    setErrParamsMap,
    updateAccounts,
  } = useImagePageStore(
    useShallow((state) => ({
      clear: state.clear,
      images: state.images,
      imageAccounts: state.imageAccounts,
      setPlatActiveAccountMap: state.setPlatActiveAccountMap,
      setActivePlat: state.setActivePlat,
      setErrParamsMap: state.setErrParamsMap,
      updateAccounts: state.updateAccounts,
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
  const pubAccountDetModuleRef = useRef<IPubAccountDetModuleRef>(null);
  const [loading, setLoading] = useState(false);
  const [pubProgressModuleOpen, setPubProgressModuleOpen] = useState(false);

  useEffect(() => {
    setErrParamsMap(errParamsMap);
  }, [errParamsMap]);

  useEffect(() => {
    return () => {
      // clear();
    };
  }, []);

  const pubCore = () => {
    console.log('pubCore');
  };

  // const pubProgressData = useMemo(() => {
  //   return videoListChoose
  //     .filter((v) => v.account && v.video)
  //     .map((v) => {
  //       const progress = pubProgressMap.get(v.account!.id);
  //       return {
  //         account: v.account!,
  //         progress: progress?.progress || 0,
  //         msg: progress?.msg || '',
  //       };
  //     });
  // }, [pubProgressMap, videoListChoose]);

  return (
    <div className={styles.image}>
      {/*<PubProgressModule*/}
      {/*  pubProgressData={pubProgressData}*/}
      {/*  open={pubProgressModuleOpen}*/}
      {/*  onClose={() => setPubProgressModuleOpen(false)}*/}
      {/*/>*/}
      <PubAccountDetModule
        ref={pubAccountDetModuleRef}
        accounts={imageAccounts
          .map((v) => v.account)
          .filter((v) => v !== undefined)}
        onClose={() => {
          setLoading(false);
        }}
        onPubClick={() => {
          pubCore();
        }}
        onRestartLoginFinish={(account) => {
          updateAccounts([account]);
        }}
        onDetFinish={(accounts) => {
          updateAccounts(accounts);
        }}
      />
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
            pubAccountDetModuleRef.current!.startDet();
            setLoading(true);
          }}
        >
          一键发布
        </Button>
      </div>
    </div>
  );
}
