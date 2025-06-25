import {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./publishDialog.module.scss";
import { Button, Modal } from "antd";
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

export interface IPublishDialogRef {}

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
        })),
      );

      useEffect(() => {
        if (open) {
          init(accounts);
        } else {
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
        return pubListChoosed.length !== 0;
      }, [pubListChoosed]);

      return (
        <>
          <Modal
            className={styles.publishDialog}
            closeIcon={false}
            open={open}
            onCancel={closeDialog}
            footer={null}
          >
            <CSSTransition
              in={openLeft}
              timeout={300}
              classNames="left"
              unmountOnExit
            >
              <PublishDialogAi />
            </CSSTransition>

            <div className="publishDialog-wrapper">
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
                        onClick={() => {
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
                        // <div style={{ height: "500px" }}>
                        //   {accountChoosed[0].type}
                        // </div>
                      )}
                      {pubListChoosed.length >= 2 && (
                        <PubParmasTextarea
                          rows={16}
                          desValue={commonPubParams.des}
                          videoFileValue={commonPubParams.video}
                          imageFileListValue={commonPubParams.images}
                          onChange={(values) => {
                            setAccountAllParams({
                              ...values,
                            });
                          }}
                        />
                        // <div style={{ height: "500px" }}>通用参数</div>
                      )}
                    </>
                  ) : (
                    <>第二部</>
                  )}

                  {pubListChoosed.length === 0 && (
                    <div className="publishDialog-con-tips">
                      你的工作被保存了，选择一个账号来创建一个帖子。
                    </div>
                  )}
                </div>
              </div>
              <div className="publishDialog-footer">
                time
                <div className="publishDialog-footer-btns">
                  {step === 0 && pubListChoosed.length >= 2 ? (
                    <Button
                      size="large"
                      onClick={() => {
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
                      <Button size="large" type="primary">
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
