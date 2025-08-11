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
  generateImage,
  generateFireflyCard,
  getImageGenerationModels,
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
  const [size, setSize] = useState("1024x1024");
  const [n, setN] = useState(1);
  const [quality, setQuality] = useState<"standard" | "hd">("standard");
  const [style, setStyle] = useState<"vivid" | "natural">("vivid");
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);

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

  const [imageModels, setImageModels] = useState<any[]>([]);

  // 获取图片生成模型
  const fetchImageModels = async () => {
    try {
      const response: any = await getImageGenerationModels();
      if (response.data) {
        setImageModels(response.data);
        if (response.data.length > 0) {
          setModel(response.data[0].name);
        }
      }
    } catch (error) {
      console.error("获取图片生成模型失败:", error);
    }
  };

  useEffect(() => {
    fetchImageModels();
  }, []);

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
      const response: any = await generateImage({
        prompt,
        n,
        quality,
        style,
        size,
        model,
        response_format: "url",
      });

      if (response.data && response.data.list) {
        const imageUrls = response.data.list.map((item: any) => item.url);
        setResult(imageUrls);
      } else {
        message.error("生成图片失败");
      }
    } catch (error) {
      message.error("生成图片失败");
    } finally {
      setLoading(false);
    }
  };

  const handleTextToFireflyCard = async () => {
    if (!content || !title) {
      message.error("请输入内容和标题");
      return;
    }

    try {
      setLoadingFirefly(true);
      const response: any = await generateFireflyCard({

        
        content,
        temp,
        title,
      });

      if (response.data && response.data.image) {
        setFireflyResult(response.data.image);
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
      // 将base64数据转换为可用的URL格式
      const imageUrl = `data:image/png;base64,${fireflyResult}`;
      const response: any = await createMedia({
        groupId: selectedMediaGroup,
        url: imageUrl,
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
                  <Select
                    placeholder="选择尺寸"
                    value={size}
                    onChange={setSize}
                    style={{ width: "100%" }}
                  >
                    <Option value="1024x1024">1024x1024</Option>
                    <Option value="1792x1024">1792x1024</Option>
                    <Option value="1024x1792">1024x1792</Option>
                  </Select>
                  <Select
                    placeholder="生成数量"
                    value={n}
                    onChange={setN}
                    style={{ width: "100%" }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <Option key={num} value={num}>{num}</Option>
                    ))}
                  </Select>
                </div>
                <div className={styles.options}>
                  <Select
                    placeholder="图片质量"
                    value={quality}
                    onChange={setQuality}
                    style={{ width: "100%" }}
                  >
                    <Option value="standard">标准</Option>
                    <Option value="hd">高清</Option>
                  </Select>
                  <Select
                    placeholder="图片风格"
                    value={style}
                    onChange={setStyle}
                    style={{ width: "100%" }}
                  >
                    <Option value="vivid">生动</Option>
                    <Option value="natural">自然</Option>
                  </Select>
                </div>
                {imageModels.length > 0 && (
                  <Select
                    placeholder="选择模型"
                    value={model}
                    onChange={setModel}
                    style={{ width: "100%" }}
                  >
                    {imageModels.map((modelItem) => (
                      <Option key={modelItem.name} value={modelItem.name}>
                        {modelItem.description || modelItem.name}
                      </Option>
                    ))}
                  </Select>
                )}
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
                  <Option value="tempJin">金卡模板</Option>
                  <Option value="tempMemo">备忘录模板</Option>
                  <Option value="tempEasy">简约模板</Option>
                  <Option value="tempBlackSun">黑日模板</Option>
                  <Option value="tempE">模板 E</Option>
                  <Option value="tempWrite">写作模板</Option>
                  <Option value="code">代码模板</Option>
                  <Option value="tempD">模板 D</Option>
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
                      src={`data:image/png;base64,${fireflyResult}`}
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
