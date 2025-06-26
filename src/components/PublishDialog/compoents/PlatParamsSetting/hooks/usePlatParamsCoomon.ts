import {
  PubItem,
  usePublishDialog,
} from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";
import { useCallback, useMemo } from "react";
import {
  IChangeParams,
  IPubParmasTextareaProps,
} from "@/components/PublishDialog/compoents/PubParmasTextarea";

export default function usePlatParamsCommon(pubItem: PubItem) {
  const { setOnePubParams } = usePublishDialog(
    useShallow((state) => ({
      setOnePubParams: state.setOnePubParams,
      step: state.step,
    })),
  );

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
    [setOnePubParams],
  );

  const pubParmasTextareaCommonParams = useMemo(() => {
    const props: IPubParmasTextareaProps = {
      onChange,
      desValue: pubItem.params.des,
      imageFileListValue: pubItem.params.images,
      videoFileValue: pubItem.params.video,
    };
    return props;
  }, [pubItem]);

  return { pubParmasTextareaCommonParams };
}
