import { ForwardedRef, forwardRef, memo, useEffect, useState } from "react";
import {
  IPlatsParamsProps,
  IPlatsParamsRef,
} from "@/components/PublishDialog/compoents/PlatParamsSetting/plats/plats.type";
import PubParmasTextarea from "@/components/PublishDialog/compoents/PubParmasTextarea";
import usePlatParamsCommon from "@/components/PublishDialog/compoents/PlatParamsSetting/hooks/usePlatParamsCoomon";
import CommonTitleInput from "@/components/PublishDialog/compoents/PlatParamsSetting/common/CommonTitleInput";
import { usePublishDialogData } from "@/components/PublishDialog/usePublishDialogData";
import { useShallow } from "zustand/react/shallow";
import styles from "../platParamsSetting.module.scss";
import { Button, Tooltip, Input, List, message } from "antd";
import { useTransClient } from "@/app/i18n/client";
import { PushpinOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { createPinterestBoardApi } from "@/api/pinterest";
import { useAccountStore } from "@/store/account";
import { PlatType } from "@/app/config/platConfig";

const PinterestParams = memo( 
  forwardRef(
    ({ pubItem }: IPlatsParamsProps, ref: ForwardedRef<IPlatsParamsRef>) => {
      const { t } = useTransClient("pinterest");
      const { pubParmasTextareaCommonParams, setOnePubParams } =
        usePlatParamsCommon(pubItem);
      const { getPinterestBoards, pinterestBoards } =
        usePublishDialogData(
          useShallow((state) => ({
            getPinterestBoards: state.getPinterestBoards,
            pinterestBoards: state.pinterestBoards,
          })),
        );

      // 弹窗状态
      const [boardTooltipVisible, setBoardTooltipVisible] = useState(false);
      const [searchKeyword, setSearchKeyword] = useState("");
      const [newBoardName, setNewBoardName] = useState("");
      const [creatingBoard, setCreatingBoard] = useState(false);

      useEffect(() => {
        getPinterestBoards();
      }, [getPinterestBoards]);

      // 初始化Pinterest参数
      useEffect(() => {
        const option = pubItem.params.option;
        if (!option.pinterest) {
          option.pinterest = {};
        }
        setOnePubParams(
          {
            option,
          },
          pubItem.account.id,
        );
      }, [pubItem.account.id]);

      // 默认选择第一个Board
      useEffect(() => {
        if (pinterestBoards.length > 0 && !pubItem.params.option.pinterest?.boardId) {
          const option = pubItem.params.option;
          option.pinterest!.boardId = pinterestBoards[0].id;
          setOnePubParams(
            {
              option,
            },
            pubItem.account.id,
          );
        }
      }, [pinterestBoards, pubItem.params.option.pinterest?.boardId, pubItem.account.id]);

      // 获取当前选中的Board信息
      const selectedBoard = pinterestBoards.find(
        board => board.id === pubItem.params.option.pinterest?.boardId
      );

      // 过滤Board列表
      const filteredBoards = pinterestBoards.filter(board => 
        board.name.toLowerCase().includes(searchKeyword.toLowerCase())
      );

      // 创建新Board
      const handleCreateBoard = async () => {
        if (!newBoardName.trim()) {
          message.error(t("validation.boardNameRequired"));
          return;
        }

        const pinterestAccount = useAccountStore
          .getState()
          .accountList.find((v) => v.type === PlatType.Pinterest);

        if (!pinterestAccount) {
          message.error(t("messages.noAccountFound"));
          return;
        }

        try {
          setCreatingBoard(true);
          const response = await createPinterestBoardApi(
            { name: newBoardName.trim() }, 
            pinterestAccount.account
          );
          
          if (response?.code === 0) {
            message.success(t("messages.boardCreateSuccess"));
            setNewBoardName("");
            // 重新获取Board列表
            await getPinterestBoards(true);
          } else {
            message.error(t("messages.boardCreateFailed"));
          }
        } catch (error) {
          message.error(t("messages.boardCreateFailed"));
        } finally {
          setCreatingBoard(false);
        }
      };

             
       // 选择Board
       const handleSelectBoard = (boardId: string) => {
         const option = pubItem.params.option;
         option.pinterest!.boardId = boardId;
         setOnePubParams(
           {
             option,
           },
           pubItem.account.id,
         );
         setBoardTooltipVisible(false);
         setSearchKeyword("");
       };

      return (
        <>
          <PubParmasTextarea
            {...pubParmasTextareaCommonParams}
            extend={
              <>
                <CommonTitleInput pubItem={pubItem} />
                <div
                  className={styles.commonTitleInput}
                  style={{ marginTop: "10px" }}
                >
                  <div className="platParamsSetting-label">{t("pin.selectBoard")}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Button
                      icon={<PushpinOutlined />}
                      style={{ 
                       border: "none"
                      }}
                    >
                      {selectedBoard?.name || t("pin.selectBoardPlaceholder")}
                    </Button>
                                         <Tooltip
                                               title={
                          <div style={{ maxHeight: "400px", overflow: "auto" }}>
                            <div style={{ marginBottom: "1px" }}>
                              <Input
                                placeholder={t("actions.search")}
                                prefix={<SearchOutlined />}
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                size="small"
                                style={{ marginBottom: "12px" }}
                              />
                            </div>

                            {/* Board列表 */}
                            <List
                              dataSource={filteredBoards}
                              size="small"
                              style={{ maxHeight: "200px", overflow: "auto" }}
                              renderItem={(board) => (
                                <List.Item
                                  style={{ 
                                    cursor: "pointer",
                                    padding: "6px 8px",
                                    borderRadius: "4px",
                                    backgroundColor: board.id === pubItem.params.option.pinterest?.boardId ? "#f0f0f0" : "transparent"
                                  }}
                                  onClick={() => handleSelectBoard(board.id)}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <PushpinOutlined style={{ fontSize: "12px" }} />
                                    <span style={{ fontSize: "12px" }}>{board.name}</span>
                                    {board.id === pubItem.params.option.pinterest?.boardId && (
                                      <span style={{ color: "#1890ff", fontSize: "10px" }}>({t("badges.selected")})</span>
                                    )}
                                  </div>
                                </List.Item>
                              )}
                              locale={{
                                emptyText: t("empty.noBoards")
                              }}
                            />
                            
                            {/* 创建新Board */}
                            <div style={{ 
                              border: "1px solid #d9d9d9", 
                              borderRadius: "4px", 
                              padding: "8px",
                              marginTop: "12px"
                            }}>

                              <div style={{ display: "flex", gap: "6px" }}>
                                <Input
                                  placeholder={t("board.namePlaceholder")}
                                  value={newBoardName}
                                  onChange={(e) => setNewBoardName(e.target.value)}
                                  onPressEnter={handleCreateBoard}
                                  size="small"
                                />
                                <Button
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  onClick={handleCreateBoard}
                                  loading={creatingBoard}
                                  size="small"
                                >
                                  {t("board.createButton")}
                                </Button>
                              </div>
                            </div>
                          </div>
                        }
                        open={boardTooltipVisible}
                        onOpenChange={setBoardTooltipVisible}
                        placement="top"
                        trigger="click"
                     >
                       <Button
                         onClick={() => setBoardTooltipVisible(!boardTooltipVisible)}
                         style={{ 
                           backgroundColor: "#f5f5f5", 
                           border: "none",
                           color: "#666"
                         }}
                       >
                         {t("actions.change")}
                       </Button>
                     </Tooltip>
                  </div>
                </div>
              </>
            }
                     />
        </>
      );
    },
  ),
);

export default PinterestParams;
