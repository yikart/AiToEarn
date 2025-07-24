"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  message,
  Input,
  Button,
  Select,
  Spin,
  Tabs,
  Row,
  Col,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  RobotOutlined,
  FireOutlined,
  PictureOutlined,
  FileTextOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import styles from "./ai-generate.module.scss";
import {
  textToImage,
  getTextToImageTaskResult,
  textToFireflyCard,
} from "@/api/ai";
import { getOssUrl } from "@/utils/oss";
import { getMediaGroupList, createMedia } from "@/api/media";
import { useTransClient } from "@/app/i18n/client";

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

export default function AIGeneratePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTransClient('material');
  const albumId = params.id as string;

  const [prompt, setPrompt] = useState("");
  const [width, setWidth] = useState(520);
  const [height, setHeight] = useState(520);
  // TODO: 由用户自行传入
  const [sessionIds, setSessionIds] = useState<string[]>([
    "0e2bdef17755a3f121b608ec8a763f6b",
    "7e90a4c9bb3c6c8b7056267f27395c78",
  ]);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<string[] | null>(null);
  const [polling, setPolling] = useState(false);

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [temp, setTemp] = useState("tempA");
  const [loadingFirefly, setLoadingFirefly] = useState(false);
  const [fireflyResult, setFireflyResult] = useState<string | null>(null);

  const [mediaGroups, setMediaGroups] = useState<any[]>([]);
  const [selectedMediaGroup, setSelectedMediaGroup] = useState<string | null>(
    null,
  );
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingMediaGroups, setLoadingMediaGroups] = useState(false);

  const fetchMediaGroups = async () => {
    try {
      setLoadingMediaGroups(true);
      const response: any = await getMediaGroupList(1, 100);
      if (response.data) {
        setMediaGroups(response.data.list || []);
      }
    } catch (error) {
      message.error(t('aiGenerate.getMediaGroupListFailed'));
    } finally {
      setLoadingMediaGroups(false);
    }
  };

  const handleTextToImage = async () => {
    if (!prompt) {
      message.error(t('aiGenerate.pleaseEnterPrompt'));
      return;
    }

    try {
      setLoading(true);
      const response: any = await textToImage({
        prompt,
        width,
        height,
        sessionIds,
      });

      if (response.data) {
        setTaskId(response.data);
        setPolling(true);
        pollTaskResult(response.data);
      } else {
        message.error("生成任务创建失败");
      }
    } catch (error) {
      message.error("生成任务创建失败");
    } finally {
      setLoading(false);
    }
  };

  const pollTaskResult = async (id: string) => {
    try {
      const response = await getTextToImageTaskResult(id);
      if (!response) return; 
      if (response.data.status === "success") {
        setResult(response.data.imgList);
        setPolling(false);
      } else if (response.data.status === "failed") {
        message.error("生成任务失败");
        setPolling(false);
      } else {
        setTimeout(() => pollTaskResult(id), 2000);
      }
    } catch (error) {
      message.error("获取任务结果失败");
      setPolling(false);
    }
  };

  const handleTextToFireflyCard = async () => {
    if (!content || !title) {
      message.error("请输入内容和标题");
      return;
    }

    try {
      setLoadingFirefly(true);
      const response: any = await textToFireflyCard({
        content,
        temp,
        title,
      });

      if (response.data) {
        setFireflyResult(response.data);
      } else {
        message.error("生成流光卡片失败");
      }
    } catch (error) {
      message.error("生成流光卡片失败");
    } finally {
      setLoadingFirefly(false);
    }
  };

  const handleUploadToMediaGroup = async () => {
    setSelectedMediaGroup(null);
    await fetchMediaGroups();
    setUploadModalVisible(true);
  };

  const handleUploadConfirm = async () => {
    if (!selectedMediaGroup) {
      message.error("请选择媒体组");
      return;
    }

    try {
      setUploading(true);
      const response: any = await createMedia({
        groupId: selectedMediaGroup,
        url: fireflyResult,
        type: "img",
        title: title,
        desc: "",
      });

      if (response.data) {
        message.success(t('aiGenerate.uploadSuccess'));
        setUploadModalVisible(false);
      } else {
        message.error(t('aiGenerate.uploadFailed'));
      }
    } catch (error) {
      message.error(t('aiGenerate.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <ArrowLeftOutlined />
          </button>
          <p>
            <RobotOutlined /> {t('aiGenerate.title')}
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <Tabs defaultActiveKey="textToImage" className={styles.tabs}>
          <TabPane
            tab={
              <span>
                <PictureOutlined /> {t('aiGenerate.textToImage')}
              </span>
            }
            key="textToImage"
          >
            <div className={styles.section}>
              <div className={styles.form}>
                <TextArea
                  placeholder={t('aiGenerate.promptPlaceholder')}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
                <div className={styles.dimensions}>
                  <Input
                    type="number"
                    placeholder={t('aiGenerate.width')}
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    min={520}
                  />
                  <Input
                    type="number"
                    placeholder={t('aiGenerate.height')}
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    min={520}
                  />
                </div>
                <Button
                  type="primary"
                  onClick={handleTextToImage}
                  loading={loading}
                  disabled={!prompt}
                  icon={<PictureOutlined />}
                >
                  {t('aiGenerate.generate')}
                </Button>
              </div>
              {polling && (
                <div className={styles.polling}>
                  <Spin tip={t('aiGenerate.generating')} />
                </div>
              )}
              {result && (
                <div className={styles.result}>
                  <Row gutter={[16, 16]}>
                    {result.map((img, index) => (
                      <Col key={index} xs={24} sm={12} md={8} lg={6}>
                        <img
                          src={img}
                          alt={`${t('aiGenerate.textToImage')} ${index + 1}`}
                          style={{ width: "100%", borderRadius: "8px" }}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </div>
          </TabPane>
          <TabPane
            tab={
              <span>
                <FireOutlined /> {t('aiGenerate.fireflyCard')}
              </span>
            }
            key="textToFireflyCard"
          >
            <div className={styles.section}>
              <div className={styles.form}>
                <Input
                  placeholder={t('aiGenerate.titlePlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  prefix={<FileTextOutlined />}
                />
                <TextArea
                  placeholder={t('aiGenerate.contentPlaceholder')}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
                <Select
                  value={temp}
                  onChange={setTemp}
                  style={{ width: "100%" }}
                >
                  <Option value="tempA">{t('aiGenerate.template')} A</Option>
                  <Option value="tempB">{t('aiGenerate.template')} B</Option>
                  <Option value="tempC">{t('aiGenerate.template')} C</Option>
                </Select>
                <Button
                  type="primary"
                  onClick={handleTextToFireflyCard}
                  loading={loadingFirefly}
                  disabled={!content || !title}
                  icon={<FireOutlined />}
                >
                  {t('aiGenerate.generate')}
                </Button>
              </div>
              {fireflyResult && (
                <div className={styles.result}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <img
                      src={getOssUrl(fireflyResult)}
                      alt={t('aiGenerate.fireflyCard')}
                      style={{ maxWidth: "100%", borderRadius: "8px" }}
                    />
                    <Button
                      type="primary"
                      onClick={handleUploadToMediaGroup}
                      icon={<UploadOutlined />}
                      style={{
                        padding: "1px",
                      }}
                    >
                      {t('aiGenerate.uploadToMediaGroup')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>

      <Modal
        title={t('aiGenerate.selectMediaGroup')}
        open={uploadModalVisible}
        onOk={handleUploadConfirm}
        onCancel={() => setUploadModalVisible(false)}
        confirmLoading={uploading}
      >
        <Select
          placeholder={t('aiGenerate.selectMediaGroupPlaceholder')}
          value={selectedMediaGroup}
          onChange={setSelectedMediaGroup}
          style={{ width: "100%" }}
          loading={loadingMediaGroups}
        >
          {mediaGroups.map((group) => (
            <Option key={group._id} value={group._id}>
              {group.title}
            </Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}
