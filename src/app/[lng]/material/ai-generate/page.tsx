"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { message, Input, Button, Select, Spin, Tabs, Row, Col, Modal } from "antd";
import { ArrowLeftOutlined, RobotOutlined, FireOutlined, PictureOutlined, FileTextOutlined, UploadOutlined } from "@ant-design/icons";
import styles from "./ai-generate.module.scss";
import { textToImage, getTextToImageTaskResult, textToFireflyCard } from "@/api/ai";
import { getOssUrl } from "@/utils/oss";
import { getMediaGroupList, createMedia } from "@/api/media";

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

export default function AIGeneratePage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params.id as string;

  const [prompt, setPrompt] = useState("");
  const [width, setWidth] = useState(520);
  const [height, setHeight] = useState(520);
  const [sessionIds, setSessionIds] = useState<string[]>([]);
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
  const [selectedMediaGroup, setSelectedMediaGroup] = useState<string | null>(null);
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
      message.error("获取媒体组列表失败");
    } finally {
      setLoadingMediaGroups(false);
    }
  };

  const handleTextToImage = async () => {
    if (!prompt) {
      message.error("请输入提示词");
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
      const response: any = await getTextToImageTaskResult(id);
      if (response.data.status === "completed") {
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
        desc: ''
      });

      if (response.data) {
        message.success("上传成功");
        setUploadModalVisible(false);
      } else {
        message.error("上传失败");
      }
    } catch (error) {
      message.error("上传失败");
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
          <p><RobotOutlined /> AI生成素材</p>
        </div>
      </div>

      <div className={styles.content}>
        <Tabs defaultActiveKey="textToImage" className={styles.tabs}>
          <TabPane 
            tab={
              <span>
                <PictureOutlined /> 文生图
              </span>
            } 
            key="textToImage"
          >
            <div className={styles.section}>
              <div className={styles.form}>
                <TextArea
                  placeholder="请输入提示词"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
                <div className={styles.dimensions}>
                  <Input
                    type="number"
                    placeholder="宽度"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    min={520}
                  />
                  <Input
                    type="number"
                    placeholder="高度"
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
                  生成图片
                </Button>
              </div>
              {polling && (
                <div className={styles.polling}>
                  <Spin tip="正在生成图片，请稍候..." />
                </div>
              )}
              {result && (
                <div className={styles.result}>
                  <Row gutter={[16, 16]}>
                    {result.map((img, index) => (
                      <Col key={index} xs={24} sm={12} md={8} lg={6}>
                        <img src={img} alt={`生成的图片 ${index + 1}`} style={{ width: '100%', borderRadius: '8px' }} />
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
                <FireOutlined /> 文生图文（流光卡片）
              </span>
            } 
            key="textToFireflyCard"
          >
            <div className={styles.section}>
              <div className={styles.form}>
                <Input
                  placeholder="请输入标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  prefix={<FileTextOutlined />}
                />
                <TextArea
                  placeholder="请输入内容"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
                <Select
                  value={temp}
                  onChange={setTemp}
                  style={{ width: "100%" }}
                >
                  <Option value="tempA">模板A</Option>
                  <Option value="tempB">模板B</Option>
                  <Option value="tempC">模板C</Option>
                </Select>
                <Button
                  type="primary"
                  onClick={handleTextToFireflyCard}
                  loading={loadingFirefly}
                  disabled={!content || !title}
                  icon={<FireOutlined />}
                >
                  生成流光卡片
                </Button>
              </div>
              {fireflyResult && (
                <div className={styles.result}>
                  <img src={getOssUrl(fireflyResult)} alt="生成的流光卡片" />
                  <Button
                    type="primary"
                    onClick={handleUploadToMediaGroup}
                    icon={<UploadOutlined />}
                    style={{ marginTop: '16px' }}
                  >
                    上传至媒体组
                  </Button>
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>

      <Modal
        title="选择媒体组"
        open={uploadModalVisible}
        onOk={handleUploadConfirm}
        onCancel={() => setUploadModalVisible(false)}
        confirmLoading={uploading}
      >
        <Select
          placeholder="请选择媒体组"
          value={selectedMediaGroup}
          onChange={setSelectedMediaGroup}
          style={{ width: '100%' }}
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