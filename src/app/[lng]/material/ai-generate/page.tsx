"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import { uploadToOss } from "@/api/oss";
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
  const lng = (params as any).lng as string;
  const isEnglishLang = typeof lng === "string" ? lng.toLowerCase().startsWith("en") : false;

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
  const [videoSize, setVideoSize] = useState("720p");
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoMode, setVideoMode] = useState("text2video");
  const [videoImage, setVideoImage] = useState("");
  const [videoImageTail, setVideoImageTail] = useState("");
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoTaskId, setVideoTaskId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>("");
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // 首帧/尾帧上传相关
  const firstFrameInputRef = useRef<HTMLInputElement | null>(null);
  const tailFrameInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingFirstFrame, setUploadingFirstFrame] = useState(false);
  const [uploadingTailFrame, setUploadingTailFrame] = useState(false);

  // 文件大小限制常量（字节）
  const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB

  /**
   * 检查文件大小是否在限制范围内
   */
  const checkFileSize = (file: File): boolean => {
    if (file.size > MAX_IMAGE_SIZE) {
      const sizeInMB = (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0);
      message.error(`图片大小限制: ${sizeInMB}MB`);
      return false;
    }
    return true;
  };

  /**
   * 检查图片文件格式
   */
  const checkImageFormat = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      message.error(`支持格式: JPG, PNG, WEBP`);
      return false;
    }
    return true;
  };

  const handlePickFirstFrame = () => {
    firstFrameInputRef.current?.click();
  };

  const handlePickTailFrame = () => {
    tailFrameInputRef.current?.click();
  };

  const handleFirstFrameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    // 检查文件大小和格式
    if (!checkFileSize(file) || !checkImageFormat(file)) {
      if (e.target) e.target.value = "";
      return;
    }
    
    try {
      setUploadingFirstFrame(true);
      const key = await uploadToOss(file);
      const url = getOssUrl(key);
      setVideoImage(url);
      message.success(t('aiGenerate.uploadSuccess'));
    } catch (err) {
      message.error(t('aiGenerate.uploadFailed'));
    } finally {
      setUploadingFirstFrame(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleTailFrameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    // 检查文件大小和格式
    if (!checkFileSize(file) || !checkImageFormat(file)) {
      if (e.target) e.target.value = "";
      return;
    }
    
    try {
      setUploadingTailFrame(true);
      const key = await uploadToOss(file);
      const url = getOssUrl(key);
      setVideoImageTail(url);
      message.success(t('aiGenerate.uploadSuccess'));
    } catch (err) {
      message.error(t('aiGenerate.uploadFailed'));
    } finally {
      setUploadingTailFrame(false);
      if (e.target) e.target.value = "";
    }
  };

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

  // 根据模式过滤视频模型列表
  const filteredVideoModels = useMemo(() => {
    if (!Array.isArray(videoModels)) return [] as any[];
    if (videoMode === "text2video") {
      return (videoModels as any[]).filter((m: any) => (m?.modes || []).includes("text2video"));
    }
    return (videoModels as any[]).filter((m: any) => {
      const modes: string[] = m?.modes || [];
      return modes.includes("image2video");
    });
  }, [videoModels, videoMode]);

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
          const first = response.data[0];
          setVideoModel(first.name);
          // 根据第一个模型的 modes 设置默认模式
          if (first?.modes?.length) {
            if (first.modes.includes("text2video")) {
              setVideoMode("text2video");
            } else if (first.modes.includes("image2video")) {
              setVideoMode("image2video");
            }
          }
          if (first?.durations?.length) {
            setVideoDuration(first.durations[0]);
          }
          if (first?.sizes?.length) {
            setVideoSize(first.sizes[0]);
          }
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

  // 模式变化时，重置模型为过滤后的第一个；切换到文生视频时清空图片
  useEffect(() => {
    if ((filteredVideoModels as any[]).length > 0) {
      if (!(filteredVideoModels as any[]).find((m: any) => m.name === videoModel)) {
        setVideoModel((filteredVideoModels as any[])[0].name);
      }
    }
    if (videoMode === 'text2video') {
      setVideoImage("");
      setVideoImageTail("");
    }
  }, [videoMode, filteredVideoModels]);

  // 切换模型时，根据模型能力校正模式/时长/尺寸（仅校正 size/duration）
  useEffect(() => {
    if (!videoModel || !videoModels?.length) return;
    const current = (videoModels as any[]).find((m) => m.name === videoModel);
    if (!current) return;
    const { durations = [], sizes = [] } = current || {};
    if (durations.length && !durations.includes(videoDuration)) {
      setVideoDuration(durations[0]);
    }
    if (sizes.length && !sizes.includes(videoSize)) {
      setVideoSize(sizes[0]);
    }
    // 按模型能力清理不支持的首/尾帧，避免带上无效参数
    const supportedParams: string[] = (current as any)?.supportedParameters || [];
    if (!supportedParams.includes('image') && videoImage) {
      setVideoImage("");
    }
    if (!supportedParams.includes('image_tail') && videoImageTail) {
      setVideoImageTail("");
    }
  }, [videoModel, videoModels]);

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

    // 检查必传参数 - 只在 image2video 模式下检查图片参数
    if (videoMode === 'image2video') {
      const current: any = (filteredVideoModels as any[]).find((m: any) => m.name === videoModel) || {};
      const supportedParams: string[] = current?.supportedParameters || [];
      
      // 如果模型要求 image 参数但用户没有上传首帧，则拦截
      if (supportedParams.includes('image') && !videoImage) {
        message.error(t('aiGenerate.pleaseUploadFirstFrame'));
        return;
      }
      
      // 如果模型要求 image_tail 参数但用户没有上传尾帧，则拦截
      if (supportedParams.includes('image_tail') && !videoImageTail) {
        message.error(t('aiGenerate.pleaseUploadTailFrame'));
        return;
      }
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
      };

      // 根据当前模型能力和模式决定携带哪些帧参数
      const current: any = (filteredVideoModels as any[]).find((m: any) => m.name === videoModel) || {};
      const supportedParams: string[] = current?.supportedParameters || [];
      
      // 只在 image2video 模式下携带图片参数
      if (videoMode === 'image2video') {
        if (supportedParams.includes('image') && videoImage) {
          requestData.image = videoImage;
        }
        if (supportedParams.includes('image_tail') && videoImageTail) {
          requestData.image_tail = videoImageTail;
        }
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
          const { status, fail_reason, progress } = response.data;
          // 规范化状态以匹配UI展示
          const up = typeof status === 'string' ? status.toUpperCase() : '';
          const normalizedStatus = up === 'SUCCESS' ? 'completed'
            : up === 'FAILED' ? 'failed'
            : up === 'PROCESSING' ? 'processing'
            : up === 'NOT_START' || up === 'NOT_STARTED' || up === 'QUEUED' || up === 'PENDING' ? 'submitted'
            : (status || '').toString().toLowerCase();
          setVideoStatus(normalizedStatus);

          // 解析进度：可能是 "0%"、0-1 或 0-100
          let percent = 0;
          if (typeof progress === 'string') {
            const m = progress.match(/(\d+)/);
            percent = m ? Number(m[1]) : 0;
          } else if (typeof progress === 'number') {
            percent = progress > -1 ? Math.round(progress) : Math.round(progress * 100);
          }

          if (normalizedStatus === 'completed') {
            setVideoResult(fail_reason); // 成功时 fail_reason 字段包含视频URL
            setVideoProgress(100);
            message.success(t('aiGenerate.videoGenerationSuccess'));
            return true;
          }
          if (normalizedStatus === 'failed') {
            setVideoProgress(0);
            message.error(fail_reason || t('aiGenerate.videoGenerationFailed'));
            return true;
          }
          setVideoProgress(percent);
          return false;
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
                        {modelItem.name}
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

                {/* 模式选择：仅显示两项 Tab 下拉：文生成视频/图文转视频 */}
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
                </div>

                {Array.isArray(filteredVideoModels) && filteredVideoModels.length > 0 && (
                  <div style={{ width: "100%" }}>
                    <Select
                      placeholder={t('aiGenerate.selectVideoModelPlaceholder')}
                      value={videoModel}
                      onChange={setVideoModel}
                      style={{ width: "100%" }}
                    >
                      {(filteredVideoModels as any[]).map((modelItem: any) => (
                        <Option key={modelItem.name} value={modelItem.name}>
                          {modelItem.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}
                <div className={styles.dimensions}>
                  <Select
                    placeholder={t('aiGenerate.videoSize')}
                    value={videoSize}
                    onChange={setVideoSize}
                    style={{ width: "100%" }}
                  >
                    {(() => {
                      const selected: any = (filteredVideoModels as any[]).find((m: any) => m.name === videoModel) || {};
                      const sizes: string[] = selected?.sizes || [];
                      return sizes.map((s) => (
                        <Option key={s} value={s}>{s}</Option>
                      ));
                    })()}
                  </Select>
                  <Select
                    placeholder={t('aiGenerate.videoDuration')}
                    value={videoDuration}
                    onChange={setVideoDuration}
                    style={{ width: "100%" }}
                  >
                    {(() => {
                      const selected: any = (filteredVideoModels as any[]).find((m: any) => m.name === videoModel) || {};
                      const durations: number[] = selected?.durations || [];
                      return durations.map((d) => (
                        <Option key={d} value={d}>{d}{t('aiGenerate.seconds')}</Option>
                      ));
                    })()}
                  </Select>
                </div>

                {/* 首帧/尾帧上传控件：按选择的模式显示 */}
                <div className={styles.options}>
                  {(() => {
                    const selected: any = (filteredVideoModels as any[]).find((m: any) => m.name === videoModel) || {};
                    const supportedParams: string[] = selected?.supportedParameters || [];
                    return (
                      <>
                        {videoMode === 'image2video' && supportedParams.includes('image') && (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                            <Button onClick={handlePickFirstFrame} loading={uploadingFirstFrame}>
                              {t('aiGenerate.uploadImage')} - {t('aiGenerate.firstFrame')}
                            </Button>
                            {videoImage && (
                              <img
                                src={videoImage}
                                alt={t('aiGenerate.firstFrame')}
                                style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }}
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              ref={firstFrameInputRef}
                              onChange={handleFirstFrameChange}
                              style={{ display: "none" }}
                            />
                          </div>
                        )}
                        {videoMode === 'image2video' && supportedParams.includes('image_tail') && (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                            <Button onClick={handlePickTailFrame} loading={uploadingTailFrame}>
                              {t('aiGenerate.uploadImage')} - {t('aiGenerate.tailFrame')}
                            </Button>
                            {videoImageTail && (
                              <img
                                src={videoImageTail}
                                alt={t('aiGenerate.tailFrame')}
                                style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }}
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              ref={tailFrameInputRef}
                              onChange={handleTailFrameChange}
                              style={{ display: "none" }}
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
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
              
              {/* 图片要求提示 */}
              <div className={styles.imageRequirements}>
                <h4>图片要求</h4>
                <div className={styles.requirementsList}>
                  <div className={styles.requirementItem}>
                    <span className={styles.requirementLabel}>宽高比范围:</span>
                    <span className={styles.requirementValue}>(0.4, 2.5)</span>
                  </div>
                  <div className={styles.requirementItem}>
                    <span className={styles.requirementLabel}>宽高长度范围:</span>
                    <span className={styles.requirementValue}>(300px, 6000px)</span>
                  </div>
                  <div className={styles.requirementItem}>
                    <span className={styles.requirementLabel}>图片大小限制:</span>
                    <span className={styles.requirementValue}>小于30MB</span>
                  </div>
                  <div className={styles.requirementItem}>
                    <span className={styles.requirementLabel}>支持格式:</span>
                    <span className={styles.requirementValue}>JPG, PNG, WEBP</span>
                  </div>
                </div>
              </div>
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
                    placeholder={t('aiGenerate.themeModePlaceholder')}
                    value={themeMode}
                    onChange={setThemeMode}
                    style={{ width: "100%" }}
                  >
                    <Option value="light">{t('aiGenerate.lightMode')}</Option>
                    <Option value="dark">{t('aiGenerate.darkMode')}</Option>
                  </Select>
                </div>
                <div className={styles.templateGrid}>
                  {md2CardTemplates.map((theme) => (
                    <div
                      key={theme.id}
                      className={`${styles.templateCard} ${selectedTheme === theme.id ? styles.templateCardActive : ""}`}
                      onClick={() => setSelectedTheme(theme.id)}
                    >
                      <div className={styles.templateThumb}>
                        <img src={theme.preview} alt={isEnglishLang ? theme.nameEn : theme.nameCn} />
                      </div>
                      <div className={styles.templateLabel}>{isEnglishLang ? theme.nameEn : theme.nameCn}</div>
                    </div>
                  ))}
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
