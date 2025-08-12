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
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import AvatarPlat from "@/components/AvatarPlat";
import { usePublishDialog } from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";
import PlatParamsSetting from "@/components/PublishDialog/compoents/PlatParamsSetting";
import PubParmasTextarea from "@/components/PublishDialog/compoents/PubParmasTextarea";
import usePubParamsVerify from "@/components/PublishDialog/hooks/usePubParamsVerify";
import PublishDialogDataPicker from "@/components/PublishDialog/compoents/PublishDialogDataPicker";
import { apiCreatePublish } from "@/api/plat/publish";
import { PubType } from "@/app/config/publishConfig";
import {
  getDays,
  getUtcDays,
} from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";
import { generateUUID } from "@/utils";
import { useTransClient } from "@/app/i18n/client";

export interface IPublishDialogRef {
  // 设置发布时间
  setPubTime: (pubTime?: string) => void;
}

export interface IPublishDialogProps {
  open: boolean;
  onClose: () => void;
  accounts: SocialAccount[];
  // 发布成功事件
  onPubSuccess?: () => void;
  // 默认选中的账户Id
  defaultAccountId?: string;
}

const { confirm } = Modal;

// 发布作品弹框
const PublishDialog = memo(
  forwardRef(
    (
      {
        open,
        onClose,
        accounts,
        onPubSuccess,
        defaultAccountId,
      }: IPublishDialogProps,
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
        pubTime,
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
          pubTime: state.pubTime,
        })),
      );
      const { errParamsMap } = usePubParamsVerify(pubListChoosed);
      const [createLoading, setCreateLoading] = useState(false);
      const { t } = useTransClient("publish");

      useEffect(() => {
        if (open) {
          init(accounts, defaultAccountId);
        } else {
          setPubListChoosed([]);
          clear();
        }
      }, [accounts, open]);

      // 关闭弹框并确认关闭
      const closeDialog = useCallback(() => {
        confirm({
          title: t("confirmClose.title"),
          icon: <ExclamationCircleFilled />,
          content: t("confirmClose.content"),
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
      }, [onClose, t]);

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

      const pubClick = useCallback(async () => {
        setCreateLoading(true);
        const publishTime = getUtcDays(
          pubTime ? pubTime : getDays().add(6, "minute"),
        ).format();

        const flowId = generateUUID();
        for (const item of pubListChoosed) {
          const res = await apiCreatePublish({
            topics: [],
            flowId: flowId,
            type: item.params.video?.cover.ossUrl
              ? PubType.VIDEO
              : PubType.ImageText,
            title: item.params.title || "",
            desc: item.params.des,
            accountId: item.account.account,
            accountType: item.account.type,
            videoUrl: item.params.video?.ossUrl,
            coverUrl:
              item.params.video?.cover.ossUrl || item.params.images![0].ossUrl!,
            imgUrlList: item.params.images?.map((v) => v.ossUrl!),
            publishTime,
            option: item.params.option,
          });
          if (res?.code !== 0) {
            return setCreateLoading(false);
          }
        }
        onClose();
        setCreateLoading(false);

        if (onPubSuccess) onPubSuccess();
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
                   <span className="publishDialog-con-head-title">{t("title")}</span>
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
                          // 是否自动回到第一步
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
                          // 是否自动前往第二步
                          if (step === 0 && newPubListChoosed.length !== 0) { 
                            const isFront = newPubListChoosed.every(
                              (v) =>
                                v.params.des ||
                                v.params.video ||
                                v.params.images?.length !== 0,
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
                          platType={PlatType.Instagram}
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
                       {t("tips.workSaved")}
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
                       {t("buttons.customizePerAccount")}
                       <ArrowRightOutlined />
                     </Button>
                  ) : (
                    <>
                                             <Button size="large" onClick={closeDialog}>
                         {t("buttons.cancelPublish")}
                       </Button>
                                             <Button
                         size="large"
                         type="primary"
                         loading={createLoading}
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
                         {t("buttons.schedulePublish")}
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
