"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Progress,
} from "antd";
import {
  ArrowLeftOutlined,
  RobotOutlined,
  FireOutlined,
  PictureOutlined,
  FileTextOutlined,
  UploadOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import styles from "./ai-generate.module.scss";
import {
  generateImage,
  generateFireflyCard,
  getImageGenerationModels,
  generateVideo,
  getVideoTaskStatus,
  getVideoGenerationModels,
  generateMd2Card,
} from "@/api/ai";
import { getOssUrl } from "@/utils/oss";
import { getMediaGroupList, createMedia } from "@/api/media";
import { useTransClient } from "@/app/i18n/client";
import { md2CardTemplates, defaultMarkdown } from "./md2card";

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

export default function AIGeneratePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTransClient('material');
  const albumId = params.id as string;

  // 从URL参数获取默认标签
  const defaultTab = searchParams.get('tab') || 'textToImage';

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
  const TEMPLATE_BASE = "https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/firefly";
  const templateList = [
    { key: "tempA", name: t('aiGenerate.templateA') },
    { key: "tempB", name: t('aiGenerate.templateB') },
    { key: "tempC", name: t('aiGenerate.templateC') },
    { key: "tempJin", name: t('aiGenerate.templateJin') },
    { key: "tempMemo", name: t('aiGenerate.templateMemo') },
    { key: "tempEasy", name: t('aiGenerate.templateEasy') },
    { key: "tempE", name: t('aiGenerate.templateE') },
    { key: "tempWrite", name: t('aiGenerate.templateWrite') },
    { key: "tempD", name: t('aiGenerate.templateD') },
  ];

  // 视频生成相关状态
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoModel, setVideoModel] = useState("");
  const [videoSize, setVideoSize] = useState("1024x576");
  const [videoDuration, setVideoDuration] = useState(4);
  const [videoMode, setVideoMode] = useState("text2video");
  const [videoImage, setVideoImage] = useState("");
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoTaskId, setVideoTaskId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>("");
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // md2card相关状态
  const [markdownContent, setMarkdownContent] = useState(defaultMarkdown);
  const [selectedTheme, setSelectedTheme] = useState("apple-notes");
  const [themeMode, setThemeMode] = useState("light");
  const [cardWidth, setCardWidth] = useState(440);
  const [cardHeight, setCardHeight] = useState(586);
  const [splitMode, setSplitMode] = useState("noSplit");
  const [mdxMode, setMdxMode] = useState(false);
  const [overHiddenMode, setOverHiddenMode] = useState(false);
  const [loadingMd2Card, setLoadingMd2Card] = useState(false);
  const [md2CardResult, setMd2CardResult] = useState<string | null>(null);

  const [mediaGroups, setMediaGroups] = useState<any[]>([]);
  const [selectedMediaGroup, setSelectedMediaGroup] = useState<string | null>(
    null,
  );
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingMediaGroups, setLoadingMediaGroups] = useState(false);

  const [imageModels, setImageModels] = useState<any[]>([]);
  const [videoModels, setVideoModels] = useState<any[]>([]);

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

  // 获取视频生成模型
  const fetchVideoModels = async () => {
    try {
      const response: any = await getVideoGenerationModels();
      if (response.data) {
        setVideoModels(response.data);
        if (response.data.length > 0) {
          setVideoModel(response.data[0].name);
        }
      }
    } catch (error) {
      console.error("获取视频生成模型失败:", error);
    }
  };

  useEffect(() => {
    fetchImageModels();
    fetchVideoModels();
  }, []);

  const fetchMediaGroups = async (type: "video" | "img" = 'img') => {
    try {
      setLoadingMediaGroups(true);
      const response: any = await getMediaGroupList(1, 100, type);
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
        message.error(t('aiGenerate.imageGenerationFailed'));
      }
    } catch (error) {
      message.error(t('aiGenerate.imageGenerationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleTextToFireflyCard = async () => {
    if (!content || !title) {
      message.error(t('aiGenerate.pleaseEnterContentAndTitle'));
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
        message.error(t('aiGenerate.fireflyCardGenerationFailed'));
      }
    } catch (error) {
      message.error(t('aiGenerate.fireflyCardGenerationFailed'));
    } finally {
      setLoadingFirefly(false);
    }
  };

  const handleVideoGeneration = async () => {
    if (!videoPrompt) {
      message.error(t('aiGenerate.pleaseEnterVideoDescription'));
      return;
    }

    if (!videoModel) {
      message.error(t('aiGenerate.pleaseSelectVideoModel'));
      return;
    }

    try {
      setLoadingVideo(true);
      setVideoStatus("submitted");
      setVideoProgress(10);

      const requestData: any = {
        model: videoModel,
        prompt: videoPrompt,
        size: videoSize,
        duration: videoDuration,
        mode: videoMode,
      };

      if (videoImage) {
        requestData.image = videoImage;
      }

      const response: any = await generateVideo(requestData);

      if (response.data && response.data.task_id) {
        setVideoTaskId(response.data.task_id);
        setVideoStatus(response.data.status);
        message.success(t('aiGenerate.taskSubmittedSuccess'));
        
        // 开始轮询任务状态
        pollVideoTaskStatus(response.data.task_id);
      } else {
        message.error(t('aiGenerate.videoGenerationFailed'));
        setVideoStatus("");
      }
    } catch (error) {
      message.error(t('aiGenerate.videoGenerationFailed'));
      setVideoStatus("");
    } finally {
      setLoadingVideo(false);
    }
  };

  const pollVideoTaskStatus = async (taskId: string) => {
    const checkStatus = async () => {
      try {
        setCheckingStatus(true);
        const response: any = await getVideoTaskStatus(taskId);
        
        if (response.data) {
          const { status, fail_reason } = response.data;
          setVideoStatus(status);
          
          if (status === "SUCCESS") {
            setVideoResult(fail_reason); // 成功时fail_reason字段包含视频URL
            setVideoProgress(100);
            message.success(t('aiGenerate.videoGenerationSuccess'));
            return true;
          } else if (status === "FAILED") {
            setVideoProgress(0);
            message.error(fail_reason || t('aiGenerate.videoGenerationFailed'));
            return true;
          } else {
            // 处理中，继续轮询
            setVideoProgress(response.data.progress);
            return false;
          }
        }
        return false;
      } catch (error) {
        console.error(t('aiGenerate.checkVideoTaskStatusFailed'), error);
        return false;
      } finally {
        setCheckingStatus(false);
      }
    };

    // 轮询逻辑
    const poll = async () => {
      const isCompleted = await checkStatus();
      if (!isCompleted) {
        setTimeout(poll, 5000); // 每5秒检查一次
      }
    };

    poll();
  };

  const handleMd2CardGeneration = async () => {
    if (!markdownContent) {
      message.error(t('aiGenerate.pleaseEnterMarkdown'));
      return;
    }

    try {
      setLoadingMd2Card(true);
      const response: any = await generateMd2Card({
        markdown: markdownContent,
        theme: selectedTheme,
        themeMode,
        width: cardWidth,
        height: cardHeight,
        splitMode,
        mdxMode,
        overHiddenMode,
      });

      if (response.data && response.data.images && response.data.images.length > 0) {
        setMd2CardResult(response.data.images[0].url);
      } else {
        message.error(t('aiGenerate.cardGenerationFailed'));
      }
    } catch (error) {
      message.error(t('aiGenerate.cardGenerationFailed'));
    } finally {
      setLoadingMd2Card(false);
    }
  };

  const handleUploadToMediaGroup = async (type: string = 'img') => {
    setSelectedMediaGroup(null);
    await fetchMediaGroups(type as "video" | "img");
    setUploadModalVisible(true);
  };

  const handleUploadConfirm = async () => {
    if (!selectedMediaGroup) {
      message.error(t('aiGenerate.pleaseSelectMediaGroup'));
      return;
    }

    try {
      setUploading(true);
      const mediaUrl = videoResult || fireflyResult || md2CardResult;
      const mediaType = videoResult ? "video" : "img";
      
      const response: any = await createMedia({
        groupId: selectedMediaGroup,
        url: mediaUrl,
        type: mediaType,
        title: videoResult ? videoPrompt : title,
        desc: "",
      });

      if (response.data) {
        message.success(videoResult ? t('aiGenerate.videoUploadSuccess') : md2CardResult ? t('aiGenerate.cardUploadSuccess') : t('aiGenerate.uploadSuccess'));
        setUploadModalVisible(false);
      } else {
        message.error(videoResult ? t('aiGenerate.videoUploadFailed') : md2CardResult ? t('aiGenerate.cardUploadFailed') : t('aiGenerate.uploadFailed'));
      }
    } catch (error) {
      message.error(videoResult ? t('aiGenerate.videoUploadFailed') : md2CardResult ? t('aiGenerate.cardUploadFailed') : t('aiGenerate.uploadFailed'));
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
        <Tabs defaultActiveKey={defaultTab} className={styles.tabs}>
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
                    placeholder={t('aiGenerate.selectSizePlaceholder')}
                    value={size}
                    onChange={setSize}
                    style={{ width: "100%" }}
                  >
                    <Option value="1024x1024">1024x1024</Option>
                    <Option value="1792x1024">1792x1024</Option>
                    <Option value="1024x1792">1024x1792</Option>
                  </Select>
                  <Select
                    placeholder={t('aiGenerate.generateCountPlaceholder')}
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
                    placeholder={t('aiGenerate.imageQualityPlaceholder')}
                    value={quality}
                    onChange={setQuality}
                    style={{ width: "100%" }}
                  >
                    <Option value="standard">{t('aiGenerate.standard')}</Option>
                    <Option value="hd">{t('aiGenerate.hd')}</Option>
                  </Select>
                  <Select
                    placeholder={t('aiGenerate.imageStylePlaceholder')}
                    value={style}
                    onChange={setStyle}
                    style={{ width: "100%" }}
                  >
                    <Option value="vivid">{t('aiGenerate.vivid')}</Option>
                    <Option value="natural">{t('aiGenerate.natural')}</Option>
                  </Select>
                </div>
                {imageModels.length > 0 && (
                  <Select
                    placeholder={t('aiGenerate.selectModelPlaceholder')}
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
                <div className={styles.templateGrid}>
                  {templateList.map((item) => (
                    <div
                      key={item.key}
                      className={`${styles.templateCard} ${temp === item.key ? styles.templateCardActive : ""}`}
                      onClick={() => setTemp(item.key)}
                    >
                      <div className={styles.templateThumb}>
                        <img
                          src={`${TEMPLATE_BASE}/${item.key}.png`}
                          alt={`${t('aiGenerate.template')} ${item.name}`}
                        />
                      </div>
                      <div className={styles.templateLabel}>
                        {item.name}
                      </div>
                    </div>
                  ))}
                </div>
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
                      onClick={() => handleUploadToMediaGroup('img')}
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
          <TabPane
            tab={
              <span>
                <VideoCameraOutlined /> {t('aiGenerate.videoGeneration')}
              </span>
            }
            key="videoGeneration"
          >
            <div className={styles.section}>
              <div className={styles.form}>
                <TextArea
                  placeholder={t('aiGenerate.videoPromptPlaceholder')}
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  rows={4}
                />
                <div className={styles.dimensions}>
                  <Select
                    placeholder={t('aiGenerate.videoSize')}
                    value={videoSize}
                    onChange={setVideoSize}
                    style={{ width: "100%" }}
                  >
                    <Option value="1024x576">1024x576 (16:9)</Option>
                    <Option value="576x1024">576x1024 (9:16)</Option>
                    <Option value="1024x1024">1024x1024 (1:1)</Option>
                  </Select>
                  <Select
                    placeholder={t('aiGenerate.videoDuration')}
                    value={videoDuration}
                    onChange={setVideoDuration}
                    style={{ width: "100%" }}
                  >
                    <Option value={4}>4{t('aiGenerate.seconds')}</Option>
                    <Option value={8}>8{t('aiGenerate.seconds')}</Option>
                    <Option value={12}>12{t('aiGenerate.seconds')}</Option>
                    <Option value={16}>16{t('aiGenerate.seconds')}</Option>
                  </Select>
                </div>
                <div className={styles.options}>
                  <Select
                    placeholder={t('aiGenerate.videoMode')}
                    value={videoMode}
                    onChange={setVideoMode}
                    style={{ width: "100%" }}
                  >
                    <Option value="text2video">{t('aiGenerate.textToVideo')}</Option>
                    <Option value="image2video">{t('aiGenerate.imageToVideo')}</Option>
                  </Select>
                  {videoMode === "image2video" && (
                    <Input
                      placeholder={t('aiGenerate.imageUrlPlaceholder')}
                      value={videoImage}
                      onChange={(e) => setVideoImage(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  )}
                </div>
                {videoModels.length > 0 && (
                  <Select
                    placeholder={t('aiGenerate.selectVideoModelPlaceholder')}
                    value={videoModel}
                    onChange={setVideoModel}
                    style={{ width: "100%" }}
                  >
                    {videoModels.map((modelItem) => (
                      <Option key={modelItem.name} value={modelItem.name}>
                        {modelItem.description || modelItem.name}
                      </Option>
                    ))}
                  </Select>
                )}
                <Button
                  type="primary"
                  onClick={handleVideoGeneration}
                  loading={loadingVideo}
                  disabled={!videoPrompt || !videoModel}
                  icon={<VideoCameraOutlined />}
                >
                  {t('aiGenerate.generate')}
                </Button>
              </div>
              
              {/* 视频生成状态和结果 */}
              {(videoStatus || videoResult) && (
                <div className={styles.result}>
                  {videoStatus && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>{t('aiGenerate.taskStatus')}: </strong>
                        {videoStatus === "submitted" && t('aiGenerate.taskSubmitted')}
                        {videoStatus === "processing" && t('aiGenerate.taskProcessing')}
                        {videoStatus === "completed" && t('aiGenerate.taskCompleted')}
                        {videoStatus === "failed" && t('aiGenerate.taskFailed')}
                      </div>
                      {videoProgress > 0 && videoProgress < 100 && (
                        <Progress percent={videoProgress} status="active" />
                      )}
                    </div>
                  )}
                  
                  {videoResult && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <video
                        src={getOssUrl(videoResult)}
                        controls
                        style={{ maxWidth: "100%", borderRadius: "8px" }}
                      />
                      <Button
                        type="primary"
                        onClick={() => handleUploadToMediaGroup('video')}
                        icon={<UploadOutlined />}
                        style={{
                          padding: "1px",
                        }}
                      >
                        {t('aiGenerate.uploadToMediaGroup')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabPane>
          <TabPane
            tab={
              <span>
                <FileTextOutlined /> {t('aiGenerate.markdownToCard')}
              </span>
            }
            key="md2card"
          >
            <div className={styles.section}>
              <div className={styles.form}>
                <TextArea
                  placeholder={t('aiGenerate.markdownPlaceholder')}
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  rows={8}
                />
                <div className={styles.dimensions}>
                  <Select
                    placeholder={t('aiGenerate.selectThemePlaceholder')}
                    value={selectedTheme}
                    onChange={setSelectedTheme}
                    style={{ width: "100%" }}
                  >
                    {md2CardTemplates.map((theme) => (
                      <Option key={theme.id} value={theme.id}>
                        {theme.nameCn}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    placeholder={t('aiGenerate.themeModePlaceholder')}
                    value={themeMode}
                    onChange={setThemeMode}
                    style={{ width: "100%" }}
                  >
                    <Option value="light">{t('aiGenerate.lightMode')}</Option>
                    <Option value="dark">{t('aiGenerate.darkMode')}</Option>
                  </Select>
                </div>
                <div className={styles.options}>
                  <Input
                    placeholder={t('aiGenerate.cardWidthPlaceholder')}
                    type="number"
                    value={cardWidth}
                    onChange={(e) => setCardWidth(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <Input
                    placeholder={t('aiGenerate.cardHeightPlaceholder')}
                    type="number"
                    value={cardHeight}
                    onChange={(e) => setCardHeight(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div className={styles.options}>
                  <Select
                    placeholder={t('aiGenerate.splitModePlaceholder')}
                    value={splitMode}
                    onChange={setSplitMode}
                    style={{ width: "100%" }}
                  >
                    <Option value="noSplit">{t('aiGenerate.noSplit')}</Option>
                    <Option value="split">{t('aiGenerate.split')}</Option>
                  </Select>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={mdxMode}
                        onChange={(e) => setMdxMode(e.target.checked)}
                      />
                      {t('aiGenerate.mdxMode')}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={overHiddenMode}
                        onChange={(e) => setOverHiddenMode(e.target.checked)}
                      />
                      {t('aiGenerate.overHiddenMode')}
                    </label>
                  </div>
                </div>
                <Button
                  type="primary"
                  onClick={handleMd2CardGeneration}
                  loading={loadingMd2Card}
                  disabled={!markdownContent}
                  icon={<FileTextOutlined />}
                >
                  {t('aiGenerate.generateCard')}
                </Button>
              </div>
              {md2CardResult && (
                <div className={styles.result}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <img
                      src={getOssUrl(md2CardResult)}
                      alt={t('aiGenerate.markdownCard')}
                      style={{ maxWidth: "100%", borderRadius: "8px" }}
                    />
                    <Button
                      type="primary"
                      onClick={() => handleUploadToMediaGroup('img')}
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
              {group.title} - {group.type}
            </Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}
