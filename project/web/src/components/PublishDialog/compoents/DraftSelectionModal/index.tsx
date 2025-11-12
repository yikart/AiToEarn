import {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button, List, message, Modal, Spin } from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";
import { PubType } from "@/app/config/publishConfig";
import { getOssUrl } from "@/utils/oss";
import { apiGetMaterialGroupList, apiGetMaterialList } from "@/api/material";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import { useTransClient } from "@/app/i18n/client";
import { usePublishDialog } from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";

export interface IDraftSelectionModalRef {}

export interface IDraftSelectionModalProps {
  draftModalOpen: boolean;
  onCancel: () => void;
  onSelectDraft?: (draft: any) => void; // 新增：选择草稿后的回调函数
}

const DraftSelectionModal = memo(
  forwardRef(
    (
      { draftModalOpen, onCancel, onSelectDraft }: IDraftSelectionModalProps,
      ref: ForwardedRef<IDraftSelectionModalRef>,
    ) => {
      const {
        pubListChoosed,
        step,
        setAccountAllParams,
        expandedPubItem,
        setOnePubParams,
      } = usePublishDialog(
        useShallow((state) => ({
          pubListChoosed: state.pubListChoosed,
          step: state.step,
          setAccountAllParams: state.setAccountAllParams,
          expandedPubItem: state.expandedPubItem,
          setOnePubParams: state.setOnePubParams,
        })),
      );
      const { t } = useTransClient("publish");
      const [groupLoading, setGroupLoading] = useState(false);
      const [groups, setGroups] = useState<any[]>([]);
      const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
      const [draftLoading, setDraftLoading] = useState(false);
      const [drafts, setDrafts] = useState<any[]>([]);

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

      // 选择草稿后填充参数
      const applyDraft = useCallback(
        (draft: any) => {
          // 如果有自定义回调，优先使用自定义回调
          if (onSelectDraft) {
            onSelectDraft(draft);
            onCancel();
            message.success(t("draft.selectDraftSuccess"));
            return;
          }

          // 否则使用默认的填充逻辑
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
          onCancel();
          message.success(t("draft.selectDraftSuccess"));
        },
        [setAccountAllParams, setOnePubParams, step, expandedPubItem, onSelectDraft, onCancel, t],
      );

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

      return (
        <Modal
          open={draftModalOpen}
          onCancel={() => onCancel()}
          footer={null}
          title={
            selectedGroup
              ? t("draft.selectDraftItem")
              : t("draft.selectDraftGroup")
          }
          width={720}
          zIndex={20}
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
      );
    },
  ),
);

export default DraftSelectionModal;
