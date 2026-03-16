/**
 * usePlatParamsCommon - 平台参数通用 Hook
 */
import type {
  IChangeParams,
  IPubParmasTextareaProps,
} from '@/components/PublishDialog/compoents/PubParmasTextarea'
import type { IImgFile, PubItem } from '@/components/PublishDialog/publishDialog.type'
import { Info } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { PubParamsVerifyInfo } from '@/components/PublishDialog/hooks/usePubParamsVerify'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { parseTopicString } from '@/utils'

export default function usePlatParamsCommon(
  pubItem: PubItem,
  onImageToImage?: (imageFile: IImgFile) => void,
  isMobile?: boolean,
) {
  const { setOnePubParams, errParamsMap, pubListChoosed, warningParamsMap } = usePublishDialog(
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
      const { topics } = parseTopicString(values.value || '')
      setOnePubParams(
        {
          images: values.imgs,
          des: values.value,
          video: values.video,
          topics,
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
      onImageToImage,
      isMobile,
      beforeExtend: (
        <>
          <PubParamsVerifyInfo errItem={currErrItem} />
        </>
      ),
      centerExtend: currWarningItem && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-800/50">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <span className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            {currWarningItem?.parErrMsg}
          </span>
        </div>
      ),
    }
    return props
  }, [currErrItem, onChange, pubItem, currWarningItem, onImageToImage, isMobile])

  return { pubParmasTextareaCommonParams, setOnePubParams }
}
