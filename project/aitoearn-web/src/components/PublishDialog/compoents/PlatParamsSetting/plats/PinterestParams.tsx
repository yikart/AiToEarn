/**
 * PinterestParams - Pinterest 平台参数设置
 */
import type { ForwardedRef } from 'react'
import type {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type'
import { Loader2, Pin, Plus, Search } from 'lucide-react'
import { forwardRef, memo, useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { createPinterestBoardApi } from '@/api/pinterest'
import { PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import CommonTitleInput from '@/components/PublishDialog/compoents/PlatParamsSetting/common/CommonTitleInput'
import usePlatParamsCommon from '@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon'
import PubParmasTextarea from '@/components/PublishDialog/compoents/PubParmasTextarea'
import { usePublishDialogData } from '@/components/PublishDialog/usePublishDialogData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'

const PinterestParams = memo(
  forwardRef(
    (
      { pubItem, onImageToImage, isMobile }: IPlatsParamsProps,
      ref: ForwardedRef<IPlatsParamsRef>,
    ) => {
      const { t } = useTransClient('pinterest')
      const { pubParmasTextareaCommonParams, setOnePubParams } = usePlatParamsCommon(
        pubItem,
        onImageToImage,
        isMobile,
      )
      const { getPinterestBoards, pinterestBoards } = usePublishDialogData(
        useShallow(state => ({
          getPinterestBoards: state.getPinterestBoards,
          pinterestBoards: state.pinterestBoards,
        })),
      )

      // 弹窗状态
      const [boardPopoverOpen, setBoardPopoverOpen] = useState(false)
      const [searchKeyword, setSearchKeyword] = useState('')
      const [newBoardName, setNewBoardName] = useState('')
      const [creatingBoard, setCreatingBoard] = useState(false)

      useEffect(() => {
        getPinterestBoards(false, pubItem.account.id)
      }, [getPinterestBoards, pubItem.account.id])

      // 初始化Pinterest参数
      useEffect(() => {
        const option = pubItem.params.option
        if (!option.pinterest) {
          option.pinterest = {}
        }
        setOnePubParams(
          {
            option,
          },
          pubItem.account.id,
        )
      }, [pubItem.account.id])

      // 默认选择第一个Board
      useEffect(() => {
        if (pinterestBoards.length > 0 && !pubItem.params.option.pinterest?.boardId) {
          const option = pubItem.params.option
          if (!option.pinterest) {
            option.pinterest = {}
          }
          option.pinterest.boardId = pinterestBoards[0].id
          setOnePubParams(
            {
              option,
            },
            pubItem.account.id,
          )
        }
      }, [pinterestBoards, pubItem.params.option.pinterest?.boardId, pubItem.account.id])

      // 获取当前选中的Board信息
      const selectedBoard = pinterestBoards.find(
        board => board.id === pubItem.params.option.pinterest?.boardId,
      )

      // 过滤Board列表
      const filteredBoards = pinterestBoards.filter(board =>
        board.name.toLowerCase().includes(searchKeyword.toLowerCase()),
      )

      // 创建新Board
      const handleCreateBoard = async () => {
        if (!newBoardName.trim()) {
          toast.error(t('validation.boardNameRequired'))
          return
        }

        const pinterestAccount = useAccountStore
          .getState()
          .accountList
          .find(v => v.type === PlatType.Pinterest)

        if (!pinterestAccount) {
          toast.error(t('messages.noAccountFound'))
          return
        }

        try {
          setCreatingBoard(true)
          const response = await createPinterestBoardApi(
            { name: newBoardName.trim() },
            pinterestAccount.id,
          )

          if (response?.code === 0) {
            toast.success(t('messages.boardCreateSuccess'))
            setNewBoardName('')
            // 重新获取Board列表
            await getPinterestBoards(true, pubItem.account.id)
          }
          else {
            toast.error(t('messages.boardCreateFailed'))
          }
        }
        catch (error) {
          toast.error(t('messages.boardCreateFailed'))
        }
        finally {
          setCreatingBoard(false)
        }
      }

      // 选择Board
      const handleSelectBoard = (boardId: string) => {
        const option = pubItem.params.option
        if (!option.pinterest) {
          option.pinterest = {}
        }
        option.pinterest.boardId = boardId
        setOnePubParams(
          {
            option,
          },
          pubItem.account.id,
        )
        setBoardPopoverOpen(false)
        setSearchKeyword('')
      }

      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={(
              <>
                <CommonTitleInput pubItem={pubItem} isMobile={isMobile} />

                {/* Board 选择 */}
                <div
                  className={cn('flex mt-2.5', isMobile ? 'flex-col gap-1.5' : 'items-center h-8')}
                >
                  <div
                    className={cn('shrink-0', isMobile ? 'text-sm font-medium' : 'w-[90px] mr-2.5')}
                  >
                    {t('pin.selectBoard')}
                    <span className="text-destructive ml-1">*</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Pin className="h-4 w-4" />
                      {selectedBoard?.name || t('pin.selectBoardPlaceholder')}
                    </Button>

                    <Popover open={boardPopoverOpen} onOpenChange={setBoardPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="secondary" size="sm" className="cursor-pointer">
                          {t('actions.change')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-3" align="start" allowInnerScroll>
                        {/* 搜索框 */}
                        <div className="relative mb-3">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t('actions.search')}
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e.target.value)}
                            className="pl-8 h-8"
                          />
                        </div>

                        {/* Board列表 */}
                        <ScrollArea className="h-[200px]">
                          {filteredBoards.length > 0 ? (
                            <div className="space-y-1">
                              {filteredBoards.map(board => (
                                <div
                                  key={board.id}
                                  className={cn(
                                    'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm',
                                    'hover:bg-accent transition-colors',
                                    board.id === pubItem.params.option.pinterest?.boardId
                                    && 'bg-accent',
                                  )}
                                  onClick={() => handleSelectBoard(board.id)}
                                >
                                  <Pin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{board.name}</span>
                                  {board.id === pubItem.params.option.pinterest?.boardId && (
                                    <span className="text-primary text-xs ml-auto shrink-0">
                                      (
                                      {t('badges.selected')}
                                      )
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              {t('empty.noBoards')}
                            </div>
                          )}
                        </ScrollArea>

                        {/* 创建新Board */}
                        <div className="border rounded-md p-2 mt-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder={t('board.namePlaceholder')}
                              value={newBoardName}
                              onChange={e => setNewBoardName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleCreateBoard()}
                              className="h-8"
                            />
                            <Button
                              size="sm"
                              onClick={handleCreateBoard}
                              disabled={creatingBoard}
                              className="shrink-0 cursor-pointer"
                            >
                              {creatingBoard ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                              {t('board.createButton')}
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </>
            )}
          />
        </>
      )
    },
  ),
)

export default PinterestParams
