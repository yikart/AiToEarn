import {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import styles from "./publishDialog.module.scss";
import { Button, message, Modal } from "antd";
import { ArrowRightOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import PublishDialogAi from "@/components/PublishDialog/compoents/PublishDialogAi";
import PublishDialogPreview from "@/components/PublishDialog/compoents/PublishDialogPreview";
import { CSSTransition } from "react-transition-group";
import { SocialAccount } from "@/api/types/account.type";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import AvatarPlat from "@/components/AvatarPlat";
import { usePublishDialog } from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";
import PlatParamsSetting from "@/components/PublishDialog/compoents/PlatParamsSetting";
import PubParmasTextarea from "@/components/PublishDialog/compoents/PubParmasTextarea";
import usePubParamsVerify from "@/components/PublishDialog/hooks/usePubParamsVerify";
import PublishDialogDataPicker from "@/components/PublishDialog/compoents/PublishDialogDataPicker";

export interface IPublishDialogRef {
  // 设置发布时间
  setPubTime: (pubTime?: string) => void;
}

export interface IPublishDialogProps {
  open: boolean;
  onClose: () => void;
  accounts: SocialAccount[];
}

const { confirm } = Modal;

// 发布作品弹框
const PublishDialog = memo(
  forwardRef(
    (
      { open, onClose, accounts }: IPublishDialogProps,
      ref: ForwardedRef<IPublishDialogRef>,
    ) => {
      const [openLeft, setOpenLeft] = useState(false);
      const {
        pubListChoosed,
        setPubListChoosed,
        init,
        clear,
        pubList,
        setStep,
        step,
        setAccountAllParams,
        commonPubParams,
        setExpandedPubItem,
        expandedPubItem,
        setErrParamsMap,
        setPubTime,
      } = usePublishDialog(
        useShallow((state) => ({
          pubListChoosed: state.pubListChoosed,
          setPubListChoosed: state.setPubListChoosed,
          init: state.init,
          clear: state.clear,
          pubList: state.pubList,
          setStep: state.setStep,
          step: state.step,
          setAccountAllParams: state.setAccountAllParams,
          commonPubParams: state.commonPubParams,
          setExpandedPubItem: state.setExpandedPubItem,
          expandedPubItem: state.expandedPubItem,
          setErrParamsMap: state.setErrParamsMap,
          setPubTime: state.setPubTime,
        })),
      );
      const { errParamsMap } = usePubParamsVerify(pubListChoosed);

      useEffect(() => {
        if (open) {
          init(accounts);
        } else {
          setPubListChoosed([]);
          clear();
        }
      }, [accounts, open]);

      // 关闭弹框并确认关闭
      const closeDialog = useCallback(() => {
        confirm({
          title: "放弃更改？",
          icon: <ExclamationCircleFilled />,
          content: "您所做的任何更改都将永久丢失",
          okType: "danger",
          okButtonProps: {
            type: "primary",
          },
          cancelButtonProps: {
            type: "text",
          },
          centered: true,
          onOk() {
            onClose();
          },
        });
      }, [onClose]);

      // 是否打开右侧预览
      const openRight = useMemo(() => {
        if (step === 0) {
          return pubListChoosed.length !== 0;
        } else {
          return expandedPubItem !== undefined;
        }
      }, [pubListChoosed, expandedPubItem, step]);

      useEffect(() => {
        setErrParamsMap(errParamsMap);
      }, [errParamsMap]);

      const pubClick = useCallback(() => {
        console.log("发布：", pubListChoosed);
      }, [pubListChoosed]);

      const imperativeHandle: IPublishDialogRef = {
        setPubTime,
      };
      useImperativeHandle(ref, () => imperativeHandle);

      return (
        <>
          <Modal
            className={styles.publishDialog}
            closeIcon={false}
            open={open}
            onCancel={closeDialog}
            footer={null}
            styles={{ wrapper: { textAlign: "center" } }}
          >
            <CSSTransition
              in={openLeft}
              timeout={300}
              classNames="left"
              unmountOnExit
            >
              <PublishDialogAi />
            </CSSTransition>

            <div
              className="publishDialog-wrapper"
              onClick={() => {
                if (step === 1) {
                  setExpandedPubItem(undefined);
                }
              }}
            >
              <div className="publishDialog-con">
                <div className="publishDialog-con-head">
                  <span className="publishDialog-con-head-title">发布作品</span>
                </div>
                <div className="publishDialog-con-acconts">
                  {pubList.map((pubItem) => {
                    const platConfig = AccountPlatInfoMap.get(
                      pubItem.account.type,
                    )!;
                    const isChoosed = pubListChoosed.find(
                      (v) => v.account.id === pubItem.account.id,
                    );

                    return (
                      <div
                        className={[
                          "publishDialog-con-acconts-item",
                          isChoosed
                            ? "publishDialog-con-acconts-item--active"
                            : "",
                        ].join(" ")}
                        style={{
                          borderColor: isChoosed
                            ? platConfig.themeColor
                            : "transparent",
                        }}
                        key={pubItem.account.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newPubListChoosed = [...pubListChoosed];
                          // 查找当前账户是否已被选择
                          const index = newPubListChoosed.findIndex(
                            (v) => v.account.id === pubItem.account.id,
                          );
                          if (index !== -1) {
                            newPubListChoosed.splice(index, 1);
                          } else {
                            newPubListChoosed.push(pubItem);
                          }
                          if (newPubListChoosed.length === 0 && step === 1) {
                            const isBack = newPubListChoosed.every(
                              (v) =>
                                !v.params.des &&
                                !v.params.video &&
                                !v.params.images?.length,
                            );
                            if (isBack) {
                              setStep(0);
                            }
                          }
                          if (step === 0) {
                            const isFront = newPubListChoosed.every(
                              (v) =>
                                v.params.des ||
                                v.params.video ||
                                v.params.images?.length,
                            );
                            if (isFront) {
                              setStep(1);
                            }
                          }
                          if (newPubListChoosed.length === 1) {
                            setExpandedPubItem(newPubListChoosed[0]);
                          }
                          setPubListChoosed(newPubListChoosed);
                        }}
                      >
                        <AvatarPlat
                          className="publishDialog-con-acconts-item-avatar"
                          account={pubItem.account}
                          size="large"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="publishDialog-paramsSet">
                  {step === 0 ? (
                    <>
                      {pubListChoosed.length == 1 && (
                        <PlatParamsSetting pubItem={pubListChoosed[0]} />
                      )}
                      {pubListChoosed.length >= 2 && (
                        <PubParmasTextarea
                          rows={16}
                          desValue={commonPubParams.des}
                          videoFileValue={commonPubParams.video}
                          imageFileListValue={commonPubParams.images}
                          onChange={(values) => {
                            setAccountAllParams({
                              des: values.value,
                              images: values.imgs,
                              video: values.video,
                            });
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {pubListChoosed.map((v) => {
                        return (
                          <PlatParamsSetting
                            pubItem={v}
                            key={v.account.id}
                            style={{ marginBottom: "12px" }}
                          />
                        );
                      })}
                    </>
                  )}

                  {pubListChoosed.length === 0 && (
                    <div className="publishDialog-con-tips">
                      你的工作被保存了，选择一个账号来创建一个帖子。
                    </div>
                  )}
                </div>
              </div>
              <div
                className="publishDialog-footer"
                onClick={(e) => e.stopPropagation()}
              >
                <PublishDialogDataPicker />

                <div className="publishDialog-footer-btns">
                  {step === 0 && pubListChoosed.length >= 2 ? (
                    <Button
                      size="large"
                      onClick={() => {
                        setExpandedPubItem(undefined);
                        setStep(1);
                      }}
                    >
                      针对每个账户进行定制
                      <ArrowRightOutlined />
                    </Button>
                  ) : (
                    <>
                      <Button size="large" onClick={closeDialog}>
                        取消发布
                      </Button>
                      <Button
                        size="large"
                        type="primary"
                        onClick={() => {
                          for (const [key, errVideoItem] of errParamsMap) {
                            if (errVideoItem) {
                              const pubItem = pubListChoosed.find(
                                (v) => v.account.id === key,
                              )!;
                              if (step === 1) {
                                setExpandedPubItem(pubItem);
                              }
                              message.warning(errVideoItem.parErrMsg);
                              return;
                            }
                          }
                          pubClick();
                        }}
                      >
                        计划发布
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <CSSTransition
              in={openRight}
              timeout={300}
              classNames="right"
              unmountOnExit
            >
              <PublishDialogPreview />
            </CSSTransition>
          </Modal>
        </>
      );
    },
  ),
);

export default PublishDialog;
