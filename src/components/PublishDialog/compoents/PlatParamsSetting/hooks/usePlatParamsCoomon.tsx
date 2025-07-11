import { usePublishDialog } from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";
import { useCallback, useMemo } from "react";
import {
  IChangeParams,
  IPubParmasTextareaProps,
} from "@/components/PublishDialog/compoents/PubParmasTextarea";
import { PubItem } from "@/components/PublishDialog/publishDialog.type";
import { PubParamsVerifyInfo } from "@/components/PublishDialog/hooks/usePubParamsVerify";

export default function usePlatParamsCommon(pubItem: PubItem) {
  const { setOnePubParams, errParamsMap, pubListChoosed } = usePublishDialog(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      step: state.step,
      errParamsMap: state.errParamsMap,
      pubListChoosed: state.pubListChoosed,
    })),
  );

  // 当前组件的错误消息
  const currErrItem = useMemo(() => {
    return errParamsMap?.get(pubItem.account.id);
  }, [errParamsMap, pubItem, pubListChoosed]);

  const onChange = useCallback(
    (values: IChangeParams) => {
      setOnePubParams(
        {
          images: values.imgs,
          des: values.value,
          video: values.video,
        },
        pubItem.account.id,
      );
    },
    [pubItem, setOnePubParams],
  );

  const pubParmasTextareaCommonParams = useMemo(() => {
    const props: IPubParmasTextareaProps = {
      platType: pubItem.account.type,
      onChange,
      desValue: pubItem.params.des,
      imageFileListValue: pubItem.params.images,
      videoFileValue: pubItem.params.video,
      beforeExtend: (
        <>
          <PubParamsVerifyInfo errItem={currErrItem} />
        </>
      ),
    };
    return props;
  }, [currErrItem, onChange, pubItem]);

  return { pubParmasTextareaCommonParams };
}
