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
import { Button, message, Modal, List, Spin } from "antd";
import {
  ArrowRightOutlined,
  ExclamationCircleFilled,
  FileTextOutlined,
  FolderOpenOutlined,
  PictureOutlined,
} from "@ant-design/icons";
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
import { apiGetMaterialGroupList, apiGetMaterialList } from "@/api/material";
import { getMediaGroupList, getMediaList } from "@/api/media";
import { getOssUrl } from "@/utils/oss";
import { toolsApi } from "@/api/tools";

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
        setOnePubParams,
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
          setOnePubParams: state.setOnePubParams,
        })),
      );
      const { errParamsMap } = usePubParamsVerify(pubListChoosed);
      const [createLoading, setCreateLoading] = useState(false);
      // 内容安全检测状态
      const [moderationLoading, setModerationLoading] = useState(false);
      const [moderationResult, setModerationResult] = useState<boolean | null>(null);
      const [moderationDesc, setModerationDesc] = useState<string>("");
      const [moderationLevel, setModerationLevel] = useState<any>(null);
      const { t } = useTransClient("publish");

      // 内容安全检测函数
      const handleContentModeration = useCallback(async () => {
        // 获取当前描述内容
        let contentToCheck = "";
        if (step === 0 && pubListChoosed.length >= 2) {
          contentToCheck = commonPubParams.des || "";
        } else if (step === 1 && expandedPubItem) {
          contentToCheck = expandedPubItem.params.des || "";
        } else if (pubListChoosed.length === 1) {
          contentToCheck = pubListChoosed[0].params.des || "";
        }

        if (!contentToCheck.trim()) {
          message.warning("请先输入内容");
          return;
        }
        
        try {
          setModerationLoading(true);
          setModerationResult(null);
          setModerationDesc("");
          const result = await toolsApi.textModeration(contentToCheck);
          console.log("result",result);
          
          if (result?.code === 0) {
            const data: any = result?.data || {} as any;
            const descriptions: string = (data && (data.descriptions as string)) || "";
            const labels: string = (data && (data.labels as string)) || "";
            const reason: any = (data && JSON.parse(data.reason)) || "";
            const isSafe = !descriptions && !labels && !reason;
            setModerationResult(isSafe);

            setModerationLevel(reason);
            setModerationDesc(isSafe ? "" : (descriptions || reason || "内容不安全"));
            if (isSafe) {
              message.success("内容安全");
            } else {
              message.error("内容不安全");
            }
          }
        } catch (error) {
          console.error("内容安全检测失败:", error);
          message.error("内容安全检测失败，请稍后重试");
        } finally {
          setModerationLoading(false);
        }
      }, [step, pubListChoosed, commonPubParams, expandedPubItem, t]);

      // 检查是否有描述内容
      const hasDescription = useMemo(() => {
        if (step === 0 && pubListChoosed.length >= 2) {
          return !!(commonPubParams.des && commonPubParams.des.trim());
        } else if (step === 1 && expandedPubItem) {
          return !!(expandedPubItem.params.des && expandedPubItem.params.des.trim());
        } else if (pubListChoosed.length === 1) {
          return !!(pubListChoosed[0].params.des && pubListChoosed[0].params.des.trim());
        }
        return false;
      }, [step, pubListChoosed, commonPubParams, expandedPubItem]);

      // 监听内容变化，重置内容安全检测状态
      useEffect(() => {
        setModerationResult(null);
        setModerationDesc("");
      }, [commonPubParams.des, expandedPubItem?.params.des, pubListChoosed.map(item => item.params.des).join(',')]);

      // 当内容被清空时，也重置检测状态
      useEffect(() => {
        if (!hasDescription) {
          setModerationResult(null);
          setModerationDesc("");
        }
      }, [hasDescription]);

      // 草稿选择弹窗/数据
      const [draftModalOpen, setDraftModalOpen] = useState(false);
      const [groupLoading, setGroupLoading] = useState(false);
      const [groups, setGroups] = useState<any[]>([]);
      const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
      const [draftLoading, setDraftLoading] = useState(false);
      const [drafts, setDrafts] = useState<any[]>([]);

      // 素材库选择弹窗/数据
      const [libraryModalOpen, setLibraryModalOpen] = useState(false);
      const [libraryGroupLoading, setLibraryGroupLoading] = useState(false);
      const [libraryGroups, setLibraryGroups] = useState<any[]>([]);
      const [selectedLibraryGroup, setSelectedLibraryGroup] = useState<
        any | null
      >(null);
      const [libraryLoading, setLibraryLoading] = useState(false);
      const [libraryItems, setLibraryItems] = useState<any[]>([]);

      // 过滤可用类型（根据当前步骤和账户选择）
      const allowImage = useMemo(() => {
        if (step === 1 && expandedPubItem) {
          const platConfig = AccountPlatInfoMap.get(
            expandedPubItem.account.type,
          )!;
          return platConfig.pubTypes.has(PubType.ImageText);
        }
        if (pubListChoosed.length === 1) {
          const platConfig = AccountPlatInfoMap.get(
            pubListChoosed[0].account.type,
          )!;
          return platConfig.pubTypes.has(PubType.ImageText);
        }
        return true;
      }, [step, expandedPubItem, pubListChoosed]);

      const allowVideo = useMemo(() => {
        if (step === 1 && expandedPubItem) {
          const platConfig = AccountPlatInfoMap.get(
            expandedPubItem.account.type,
          )!;
          return platConfig.pubTypes.has(PubType.VIDEO);
        }
        if (pubListChoosed.length === 1) {
          const platConfig = AccountPlatInfoMap.get(
            pubListChoosed[0].account.type,
          )!;
          return platConfig.pubTypes.has(PubType.VIDEO);
        }
        return true;
      }, [step, expandedPubItem, pubListChoosed]);

      const fetchGroups = useCallback(async () => {
        try {
          setGroupLoading(true);
          const res: any = await apiGetMaterialGroupList(1, 100);
          const list = res?.data?.list || [];
          const filtered = list.filter((g: any) => {
            if (g.type === PubType.ImageText) return allowImage;
            if (g.type === PubType.VIDEO) return allowVideo;
            return true;
          });
          setGroups(filtered);
        } catch (e) {
        } finally {
          setGroupLoading(false);
        }
      }, [allowImage, allowVideo]);

      const fetchDrafts = useCallback(async (groupId: string) => {
        try {
          setDraftLoading(true);
          const res: any = await apiGetMaterialList(groupId, 1, 100);
          setDrafts(res?.data?.list || []);
        } catch (e) {
        } finally {
          setDraftLoading(false);
        }
      }, []);

      // 获取素材库组列表
      const fetchLibraryGroups = useCallback(async () => {
        try {
          setLibraryGroupLoading(true);
          const res: any = await getMediaGroupList(1, 100);
          const list = res?.data?.list || [];
          const filtered = list.filter((g: any) => {
            if (g.type === "img") return allowImage;
            if (g.type === "video") return allowVideo;
            return true;
          });
          setLibraryGroups(filtered);
        } catch (e) {
        } finally {
          setLibraryGroupLoading(false);
        }
      }, [allowImage, allowVideo]);

      // 获取素材库内容
      const fetchLibraryItems = useCallback(async (groupId: string) => {
        try {
          setLibraryLoading(true);
          const res: any = await getMediaList(groupId, 1, 100);
          setLibraryItems(res?.data?.list || []);
        } catch (e) {
        } finally {
          setLibraryLoading(false);
        }
      }, []);

      useEffect(() => {
        if (draftModalOpen) {
          setSelectedGroup(null);
          setDrafts([]);
          fetchGroups();
        }
      }, [draftModalOpen, fetchGroups]);

      useEffect(() => {
        if (selectedGroup?._id) {
          fetchDrafts(selectedGroup._id);
        }
      }, [selectedGroup, fetchDrafts]);

      // 素材库弹窗打开时获取组列表
      useEffect(() => {
        if (libraryModalOpen) {
          setSelectedLibraryGroup(null);
          setLibraryItems([]);
          fetchLibraryGroups();
        }
      }, [libraryModalOpen, fetchLibraryGroups]);

      // 选中素材库组后加载组内素材
      useEffect(() => {
        if (selectedLibraryGroup?._id) {
          fetchLibraryItems(selectedLibraryGroup._id);
        }
      }, [selectedLibraryGroup, fetchLibraryItems]);

      useEffect(() => {
        if (open) {
          init(accounts, defaultAccountId);
        } else {
          setPubListChoosed([]);
          clear();
        }
      }, [accounts, open]);

      // 离线账号（status === 0）不可参与发布：如被默认选中则自动移除
      useEffect(() => {
        const filtered = pubListChoosed.filter((item) => item.account.status !== 0);
        if (filtered.length !== pubListChoosed.length) {
          setPubListChoosed(filtered);
        }
      }, [pubListChoosed, setPubListChoosed]);

      // 过滤PC端不支持的平台账户：如被默认选中则自动移除
      useEffect(() => {
        const filtered = pubListChoosed.filter((item) => {
          const plat = AccountPlatInfoMap.get(item.account.type);
          return !(plat && plat.pcNoThis === true);
        });
        if (filtered.length !== pubListChoosed.length) {
          setPubListChoosed(filtered);
        }
      }, [pubListChoosed, setPubListChoosed]);

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

      // 选择草稿后填充参数
      const applyDraft = useCallback(
        (draft: any) => {
          const nextParams: any = {};
          if (draft.title) nextParams.title = draft.title;
          if (draft.desc) nextParams.des = draft.desc;

          // 处理媒体内容
          if (Array.isArray(draft.mediaList) && draft.mediaList.length > 0) {
            const videos = draft.mediaList.filter(
              (m: any) => m.type === PubType.VIDEO,
            );
            const images = draft.mediaList.filter(
              (m: any) => m.type !== PubType.VIDEO,
            );

            // 如果有视频，设置视频参数
            if (videos.length > 0) {
              const firstVideo = videos[0];
              const ossUrl = getOssUrl(firstVideo.url);
              const coverOss = getOssUrl(draft.coverUrl);
              nextParams.video = {
                ossUrl: ossUrl,
                videoUrl: ossUrl,
                cover: {
                  ossUrl: coverOss,
                  imgUrl: coverOss,
                },
              };
            }

            // 如果有图片，设置图片参数
            if (images.length > 0) {
              nextParams.images = images.map((v: any) => {
                const ossUrl = getOssUrl(v.url);
                return {
                  ossUrl,
                  imgUrl: ossUrl,
                };
              });
            }
          }

          if (step === 1 && expandedPubItem) {
            setOnePubParams(nextParams, expandedPubItem.account.id);
          } else {
            setAccountAllParams(nextParams);
          }
          setDraftModalOpen(false);
          message.success(t("draft.selectDraftSuccess"));
        },
        [setAccountAllParams, setOnePubParams, step, expandedPubItem],
      );

      // 选择素材库内容后填充参数
      const applyLibraryItem = useCallback(
        (item: any) => {
          const nextParams: any = {};
          const ossUrl = getOssUrl(item.url);

          // 处理媒体内容
          if (item.type === "video") {
            const coverOss = item.cover;
            nextParams.video = {
              ossUrl,
              videoUrl: ossUrl,
              cover: {
                ossUrl: coverOss,
                imgUrl: coverOss,
              },
            };
          } else if (item.type === "img") {
            nextParams.images = [{ ossUrl, imgUrl: ossUrl }];
          }

          if (step === 1 && expandedPubItem) {
            setOnePubParams(nextParams, expandedPubItem.account.id);
          } else {
            setAccountAllParams(nextParams);
          }
          setLibraryModalOpen(false);
          message.success(t("draft.selectLibrarySuccess"));
        },
        [setAccountAllParams, setOnePubParams, step, expandedPubItem],
      );

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
            accountId: item.account.id,
            accountType: item.account.type,
            videoUrl: item.params.video?.ossUrl,
            coverUrl:
              item.params.video?.cover.ossUrl || (item.params.images && item.params.images.length > 0 ? item.params.images[0].ossUrl : undefined),
            imgUrlList: item.params.images?.map((v) => v.ossUrl).filter((url): url is string => url !== undefined) || [],
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
                <div
                  className="publishDialog-con-head"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span className="publishDialog-con-head-title">
                    {t("title")}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      size="small"
                      icon={<PictureOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLibraryModalOpen(true);
                      }}
                    >
                      {t("actions.selectMaterial")}
                    </Button>
                    <Button
                      size="small"
                      icon={<FileTextOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDraftModalOpen(true);
                      }}
                    >
                      {t("actions.selectDraft")}
                    </Button>
                  </div>
                </div>
                <div className="publishDialog-con-acconts">
                  {pubList
                    .filter((pubItem) => {
                      const plat = AccountPlatInfoMap.get(pubItem.account.type);
                      return !(plat && plat.pcNoThis === true);
                    })
                    .map((pubItem) => {
                    const platConfig = AccountPlatInfoMap.get(
                      pubItem.account.type,
                    )!;
                    const isChoosed = pubListChoosed.find(
                      (v) => v.account.id === pubItem.account.id,
                    );
                    const isOffline = pubItem.account.status === 0;

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
                          if (isOffline) {
                            message.warning("该账号已离线，无法发布");
                            return;
                          }
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
                        {/* 账号头像：离线显示遮罩并禁用 */}
                        <div style={{ position: "relative" }}>
                          <AvatarPlat
                            className={`publishDialog-con-acconts-item-avatar ${!isChoosed || isOffline ? 'disabled' : ''}`}
                            account={pubItem.account}
                            size="large"
                            disabled={isOffline || !isChoosed}
                          />
                          {isOffline && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(0,0,0,0.45)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 600,
                                pointerEvents: "none",
                              }}
                            >
                              已离线
                            </div>
                          )}
                        </div>
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
                          key={`${commonPubParams.images?.length || 0}-${commonPubParams.video ? "video" : "no-video"}-${commonPubParams.des?.length || 0}`}
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

                <div className="publishDialog-footer-btns" style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {moderationResult !== null && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ 
                              fontSize: 14, 
                              color: moderationResult ? '#52c41a' : '#ff4d4f',
                              fontWeight: 500,
                            }}>
                              {moderationResult ? "内容安全" : "等级:" + moderationLevel.riskLevel}
                            </span>
                            {!moderationResult && !!moderationDesc && (
                              <span style={{ fontSize: 12, color: '#ff4d4f', maxWidth: 360, whiteSpace: 'pre-wrap' }}>{moderationDesc}</span>
                            )}
                          </div>
                        )}

                        {hasDescription && (
                          <Button
                            size="large"
                            loading={moderationLoading}
                            onClick={handleContentModeration}
                            type={moderationResult === true ? "primary" : moderationResult === false ? "default" : "default"}
                            style={{
                              backgroundColor: moderationResult === true ? '#52c41a' : moderationResult === false ? '#ff4d4f' : undefined,
                              borderColor: moderationResult === true ? '#52c41a' : moderationResult === false ? '#ff4d4f' : undefined,
                              color: moderationResult === true || moderationResult === false ? '#fff' : undefined
                            }}
                          >
                            {moderationLoading ? "检测中..." : "内容安全检测"}
                          </Button>
                        )}
                        
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
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
                      </div>
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

          {/* Draft Selection Modal */}
          <Modal
            open={draftModalOpen}
            onCancel={() => setDraftModalOpen(false)}
            footer={null}
            title={selectedGroup ? t("draft.selectDraftItem") : t("draft.selectDraftGroup")}
            width={720}
          >
            {!selectedGroup ? (
              <div>
                {groupLoading ? (
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <Spin />
                  </div>
                ) : (
                  <List
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={groups}
                    locale={{ emptyText: t("draft.noDraftGroups") }}
                    renderItem={(item: any) => (
                      <List.Item>
                        <div
                          style={{
                            background: "#FAEFFC",
                            border: "2px solid transparent",
                            padding: "16px",
                            borderRadius: "12px",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            minHeight: "80px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            position: "relative",
                          }}
                          onClick={() => setSelectedGroup(item)}
                        >
                          <div
                            style={{
                              fontSize: 24,
                              marginBottom: 8,
                              color: "#667eea",
                            }}
                          >
                            <FolderOpenOutlined />
                          </div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 16,
                              color: "#2c3e50",
                              marginBottom: 4,
                            }}
                          >
                            {item.name || item.title}
                          </div>
                          {item.desc && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#7f8c8d",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.desc}
                            </div>
                          )}
                          <div
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: 10,
                              color: "#fff",
                              background:
                                item.type === PubType.ImageText
                                  ? "#52c41a"
                                  : "#1890ff",
                            }}
                          >
                            {item.type === PubType.ImageText
                              ? t("draft.imageGroup")
                              : t("draft.videoGroup")}
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Button type="link" onClick={() => setSelectedGroup(null)}>
                    {t("draft.backToGroups")}
                  </Button>
                </div>
                {draftLoading ? (
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <Spin />
                  </div>
                ) : (
                  <List
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={drafts}
                    locale={{ emptyText: t("draft.noDrafts") }}
                    renderItem={(item: any) => (
                      <List.Item>
                        <div
                          style={{
                            border: "1px solid #eee",
                            borderRadius: 8,
                            overflow: "hidden",
                            cursor: "pointer",
                          }}
                          onClick={() => applyDraft(item)}
                        >
                          <div
                            style={{
                              width: "100%",
                              paddingTop: "56%",
                              position: "relative",
                              background: "#f7f7f7",
                            }}
                          >
                            {Array.isArray(item.mediaList) &&
                              item.mediaList[0] && (
                                <img
                                  src={getOssUrl(item.coverUrl)}
                                  alt=""
                                  style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              )}
                          </div>
                          <div style={{ padding: 8 }}>
                            <div style={{ fontWeight: 600 }}>
                              {item.title || "-"}
                            </div>
                            <div style={{ fontSize: 12, color: "#999" }}>
                              {item.desc || ""}
                            </div>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )}
          </Modal>

          {/* Material Library Selection Modal */}
          <Modal
            open={libraryModalOpen}
            onCancel={() => setLibraryModalOpen(false)}
            footer={null}
            title={selectedLibraryGroup ? t("draft.selectLibraryItem") : t("draft.selectLibraryGroup")}
            width={720}
          >
            {!selectedLibraryGroup ? (
              <div>
                {libraryGroupLoading ? (
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <Spin />
                  </div>
                ) : (
                  <List
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={libraryGroups}
                    locale={{ emptyText: t("draft.noLibraryGroups") }}
                    renderItem={(item: any) => (
                      <List.Item>
                        <div
                          style={{
                            background: "#F0F8FF",
                            border: "2px solid transparent",
                            padding: "16px",
                            borderRadius: "12px",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            minHeight: "80px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            position: "relative",
                          }}
                          onClick={() => setSelectedLibraryGroup(item)}
                        >
                          <div
                            style={{
                              fontSize: 24,
                              marginBottom: 8,
                              color: "#1890ff",
                            }}
                          >
                            <PictureOutlined />
                          </div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 16,
                              color: "#2c3e50",
                              marginBottom: 4,
                            }}
                          >
                            {item.title}
                          </div>
                          {item.desc && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#7f8c8d",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.desc}
                            </div>
                          )}
                          <div
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: 10,
                              color: "#fff",
                              background:
                                item.type === "img" ? "#52c41a" : "#1890ff",
                            }}
                          >
                            {item.type === "img" ? t("draft.imageGroup") : t("draft.videoGroup")}
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Button
                    type="link"
                    onClick={() => setSelectedLibraryGroup(null)}
                  >
                    {t("draft.backToLibraryGroups")}
                  </Button>
                </div>
                {libraryLoading ? (
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <Spin />
                  </div>
                ) : (
                  <List
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={libraryItems}
                    locale={{ emptyText: t("draft.noLibraryItems") }}
                    renderItem={(item: any) => (
                      <List.Item>
                        <div
                          style={{
                            border: "1px solid #eee",
                            borderRadius: 8,
                            overflow: "hidden",
                            cursor: "pointer",
                          }}
                          onClick={() => applyLibraryItem(item)}
                        >
                          <div
                            style={{
                              width: "100%",
                              paddingTop: "56%",
                              position: "relative",
                              background: "#f7f7f7",
                            }}
                          >
                            <img
                              src={getOssUrl(item.url)}
                              alt=""
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                          <div style={{ padding: 8 }}>
                            <div style={{ fontWeight: 600 }}>
                              {item.title || "-"}
                            </div>
                            <div style={{ fontSize: 12, color: "#999" }}>
                              {item.desc || ""}
                            </div>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )}
          </Modal>
        </>
      );
    },
  ),
);

export default PublishDialog;
