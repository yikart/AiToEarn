import type {
  IChangeParams,
  IPubParmasTextareaProps,
} from '@/components/PublishDialog/compoents/PubParmasTextarea'
import type { PubItem } from '@/components/PublishDialog/publishDialog.type'
import { Alert } from 'antd'
import { useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { PubParamsVerifyInfo } from '@/components/PublishDialog/hooks/usePubParamsVerify'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'

export default function usePlatParamsCommon(pubItem: PubItem) {
  const { setOnePubParams, errParamsMap, pubListChoosed, warningParamsMap }
    = usePublishDialog(
      useShallow(state => ({
        setOnePubParams: state.setOnePubParams,
        step: state.step,
        errParamsMap: state.errParamsMap,
        pubListChoosed: state.pubListChoosed,
        warningParamsMap: state.warningParamsMap,
      })),
    )

  // 当前组件的错误消息
  const currErrItem = useMemo(() => {
    return errParamsMap?.get(pubItem.account.id)
  }, [errParamsMap, pubItem, pubListChoosed])

  // 当前组件的警告消息
  const currWarningItem = useMemo(() => {
    return warningParamsMap?.get(pubItem.account.id)
  }, [warningParamsMap, pubItem, pubListChoosed])

  const onChange = useCallback(
    (values: IChangeParams) => {
      setOnePubParams(
        {
          images: values.imgs,
          des: values.value,
          video: values.video,
        },
        pubItem.account.id,
      )
    },
    [pubItem, setOnePubParams],
  )

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
      centerExtend: currWarningItem && (
        <Alert
          type="info"
          showIcon
          message={
            <p style={{ textAlign: 'left' }}>{currWarningItem?.parErrMsg}</p>
          }
          style={{
            fontSize: '12px',
            borderRadius: 0,
            border: 'none',
          }}
        />
      ),
    }
    return props
  }, [currErrItem, onChange, pubItem, currWarningItem])

  return { pubParmasTextareaCommonParams, setOnePubParams }
}
