"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { message, Input, Button, Select, Row, Col, Modal, Progress } from "antd";
import { ArrowLeftOutlined, RobotOutlined, FireOutlined, PictureOutlined, FileTextOutlined, UploadOutlined, VideoCameraOutlined, DownloadOutlined, MessageOutlined } from "@ant-design/icons";
import styles from "./ai-generate.module.scss";
import { generateImage, generateFireflyCard, getImageGenerationModels, generateVideo, getVideoTaskStatus, getVideoGenerationModels, generateMd2Card, getVideoGenerations, getImageTaskStatus, editImage, getImageEditTaskStatus, getImageEditModels } from "@/api/ai";
import { getOssUrl } from "@/utils/oss";
import { uploadToOss } from "@/api/oss";
import { getMediaGroupList, createMedia } from "@/api/media";
import { useTransClient } from "@/app/i18n/client";
import { md2CardTemplates, defaultMarkdown } from "./md2card";
import Chat from "@/components/Chat";
import { OSS_URL } from "@/constant";
import VipContentModal from "@/components/modals/VipContentModal";

const { TextArea } = Input;
const { Option } = Select;

// 示例图片 URL 常量
const SAMPLE_IMAGE_URLS = {
  shili21: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/shili/image-ai-sample-2-1.webp',
  shili22: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/shili/image-ai-sample-2-2.jpeg',
  shili23: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/shili/image-ai-sample-2-3.jpeg',
  shili24: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/web/shili/image-ai-sample-2-4.jpeg',
};




/**
 * AI 工具页（左右布局）
 * - 左侧：图标切换 图片/视频 两个模块
 * - 右侧：根据模块展示对应功能（复用原有功能逻辑，不改动接口与状态流转）
 */
export default function AIGeneratePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTransClient("material");
  const lng = (params as any).lng as string;
  const isEnglishLang = typeof lng === "string" ? lng.toLowerCase().startsWith("en") : false;

  // 根据 URL 初始化模块与子标签
  const queryTab = (searchParams.get("tab") || "").toString();
  const initIsVideo = ["videoGeneration", "text2video", "image2video"].includes(queryTab);
  const initImageTab = ["textToImage", "imageToImage", "textToFireflyCard", "md2card", "chat"].includes(queryTab) ? (queryTab as any) : "textToImage";
  const initVideoTab = ["image2video"].includes(queryTab) ? (queryTab as any) : "text2video";
  // 左侧模块切换
  const [activeModule, setActiveModule] = useState<"image" | "video">(initIsVideo ? "video" : "image");
  // 图片子模块切换
  const [activeImageTab, setActiveImageTab] = useState<"textToImage" | "imageToImage" | "textToFireflyCard" | "md2card" | "chat">(initImageTab);
  // 视频子模块切换
  const [activeVideoTab, setActiveVideoTab] = useState<"text2video" | "image2video">(initVideoTab);

    // VIP弹窗状态
    const [vipModalOpen, setVipModalOpen] = useState(false);

  // 文生图
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [n, setN] = useState(1);
  const [quality, setQuality] = useState<"standard" | "hd">("standard");
  const [style, setStyle] = useState<"vivid" | "natural">("vivid");
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);
  const [imageTaskId, setImageTaskId] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<string>("");
  const [imageProgress, setImageProgress] = useState(0);
  const [checkingImageStatus, setCheckingImageStatus] = useState(false);

  // Firefly 卡片
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [temp, setTemp] = useState("tempA");
  const [loadingFirefly, setLoadingFirefly] = useState(false);
  const [fireflyResult, setFireflyResult] = useState<string | null>(null);
  const TEMPLATE_BASE = "https://aitoearn.s3.ap-southeast-1.amazonaws.com/common/firefly";
  const templateList = [
    { key: "tempA", name: t("aiGenerate.templateA") },
    { key: "tempB", name: t("aiGenerate.templateB") },
    { key: "tempC", name: t("aiGenerate.templateC") },
    { key: "tempJin", name: t("aiGenerate.templateJin") },
    { key: "tempMemo", name: t("aiGenerate.templateMemo") },
    { key: "tempEasy", name: t("aiGenerate.templateEasy") },
    { key: "tempE", name: t("aiGenerate.templateE") },
    { key: "tempWrite", name: t("aiGenerate.templateWrite") },
    { key: "tempD", name: t("aiGenerate.templateD") },
  ];

  // 视频生成
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoModel, setVideoModel] = useState("");
  const [videoSize, setVideoSize] = useState("720p");
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoMode, setVideoMode] = useState("text2video");
  const [videoImage, setVideoImage] = useState("");
  const [videoImageTail, setVideoImageTail] = useState("");
  const [videoImages, setVideoImages] = useState<string[]>([]);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoTaskId, setVideoTaskId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>("");
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // 视频历史记录
  const [videoHistory, setVideoHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // 首/尾帧上传
  const firstFrameInputRef = useRef<HTMLInputElement | null>(null);
  const tailFrameInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingFirstFrame, setUploadingFirstFrame] = useState(false);
  const [uploadingTailFrame, setUploadingTailFrame] = useState(false);
  const MAX_IMAGE_SIZE = 30 * 1024 * 1024;
  const checkFileSize = (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      message.error(`${t("aiGenerate.imageSizeLimit" as any)}: 30MB`);
      return false;
    }
    return true;
  };
  const checkImageFormat = (file: File) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      message.error(`${t("aiGenerate.imageFormatSupport" as any)}: JPG, PNG, WEBP`);
      return false;
    }
    return true;
  };
  const handlePickFirstFrame = () => firstFrameInputRef.current?.click();
  const handlePickTailFrame = () => tailFrameInputRef.current?.click();
  const handleFirstFrameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!checkFileSize(file) || !checkImageFormat(file)) { if (e.target) e.target.value = ""; return; }
    try { setUploadingFirstFrame(true); const key = await uploadToOss(file); setVideoImage(getOssUrl(key)); message.success(t("aiGenerate.uploadSuccess")); }
    catch { message.error(t("aiGenerate.uploadFailed")); }
    finally { setUploadingFirstFrame(false); if (e.target) e.target.value = ""; }
  };
  const handleTailFrameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!checkFileSize(file) || !checkImageFormat(file)) { if (e.target) e.target.value = ""; return; }
    try { setUploadingTailFrame(true); const key = await uploadToOss(file); setVideoImageTail(getOssUrl(key)); message.success(t("aiGenerate.uploadSuccess")); }
    catch { message.error(t("aiGenerate.uploadFailed")); }
    finally { setUploadingTailFrame(false); if (e.target) e.target.value = ""; }
  };

  // 多图上传处理
  const handleMultiImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (checkFileSize(file) && checkImageFormat(file)) {
        validFiles.push(file);
      }
    }
    
    if (validFiles.length === 0) {
      if (e.target) e.target.value = "";
      return;
    }
    
    try {
      setUploadingFirstFrame(true);
      const uploadPromises = validFiles.map(file => uploadToOss(file));
      const keys = await Promise.all(uploadPromises);
      const urls = keys.map(key => getOssUrl(key));
      setVideoImages(prev => [...prev, ...urls]);
      message.success(`成功上传 ${validFiles.length} 张图片`);
    } catch (error) {
      message.error(t("aiGenerate.uploadFailed"));
    } finally {
      setUploadingFirstFrame(false);
      if (e.target) e.target.value = "";
    }
  };

  // 删除图片
  const handleRemoveImage = (index: number) => {
    setVideoImages(prev => prev.filter((_, i) => i !== index));
  };

  // 清空所有图片
  const handleClearAllImages = () => {
    setVideoImages([]);
  };

  // md2card
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
  const [selectedMediaGroup, setSelectedMediaGroup] = useState<string | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingMediaGroups, setLoadingMediaGroups] = useState(false);
  const [defaultMediaGroup, setDefaultMediaGroup] = useState<string | null>(null);
  const [uploadedContent, setUploadedContent] = useState<Set<string>>(new Set());

  const [imageModels, setImageModels] = useState<any[]>([]);
  const [videoModels, setVideoModels] = useState<any[]>([]);
  const [imageEditModels, setImageEditModels] = useState<any[]>([]);

  // 图生图相关状态
  const [imageEditPrompt, setImageEditPrompt] = useState("");
  const [imageEditModel, setImageEditModel] = useState("");
  const [imageEditSize, setImageEditSize] = useState("1024x1024");
  const [imageEditN, setImageEditN] = useState(1);
  const [imageEditLoading, setImageEditLoading] = useState(false);
  const [imageEditResult, setImageEditResult] = useState<string[] | null>(null);
  const [imageEditTaskId, setImageEditTaskId] = useState<string | null>(null);
  const [imageEditStatus, setImageEditStatus] = useState<string>("");
  const [imageEditProgress, setImageEditProgress] = useState(0);
  const [checkingImageEditStatus, setCheckingImageEditStatus] = useState(false);
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [uploadingSourceImage, setUploadingSourceImage] = useState(false);

  // 自定义模型下拉
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showVideoModelDropdown, setShowVideoModelDropdown] = useState(false);

  // 示例轮播
  const sampleImages = [SAMPLE_IMAGE_URLS.shili21, SAMPLE_IMAGE_URLS.shili22, SAMPLE_IMAGE_URLS.shili23, SAMPLE_IMAGE_URLS.shili24];
  const [sampleIdx, setSampleIdx] = useState(0);
  const handlePrevSample = () => setSampleIdx((p) => (p - 1 + sampleImages.length) % sampleImages.length);
  const handleNextSample = () => setSampleIdx((p) => (p + 1) % sampleImages.length);

  // 保存结果到本地
  const handleSaveResults = async () => {
    try {
      if (!result || !result.length) { message.warning(t('aiGenerate.imageGenerationFailed')); return; }
      for (let i = 0; i < result.length; i++) {
        const url = getOssUrl(result[i]);
        const link = document.createElement('a');
        link.href = url;
        link.download = `image_${i + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      message.success(t('aiGenerate.uploadSuccess'));
    } catch (e) {
      message.error(t('aiGenerate.uploadFailed'));
    }
  };

  const handleDownloadUrl = (url: string) => {
    const real = getOssUrl(url);
    const a = document.createElement('a');
    a.href = real;
    a.download = real.split('/').pop() || 'image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 图片编辑相关函数
  const handleSourceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // 检查当前模型的最大图片数量限制
    const selectedModel = imageEditModels.find((m: any) => m.name === imageEditModel);
    const maxImages = selectedModel?.maxInputImages || 1;
    
    // 计算可以上传的图片数量
    const remainingSlots = maxImages - sourceImages.length;
    if (remainingSlots <= 0) {
      message.warning(t('aiGenerate.maxUploadLimitReached' as any, { count: maxImages }));
      if (e.target) e.target.value = "";
      return;
    }
    
    const validFiles: File[] = [];
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      if (checkFileSize(file) && checkImageFormat(file)) {
        validFiles.push(file);
      }
    }
    
    if (validFiles.length === 0) {
      if (e.target) e.target.value = "";
      return;
    }
    
    if (filesToProcess.length < files.length) {
      message.warning(t('aiGenerate.autoSelectImages' as any, { count: remainingSlots }));
    }
    
    try {
      setUploadingSourceImage(true);
      const uploadPromises = validFiles.map(file => uploadToOss(file));
      const keys = await Promise.all(uploadPromises);
      const urls = keys.map(key => getOssUrl(key));
      setSourceImages(prev => [...prev, ...urls]);
      message.success(t('aiGenerate.uploadSuccessCount' as any, { count: validFiles.length }));
    } catch (error) {
      message.error(t("aiGenerate.uploadFailed"));
    } finally {
      setUploadingSourceImage(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveSourceImage = (index: number) => {
    setSourceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllSourceImages = () => {
    setSourceImages([]);
  };

  const handleImageEdit = async () => {
    if (!imageEditPrompt) { message.error(t("aiGenerate.pleaseEnterPrompt")); return; }
    if (!sourceImages.length) { message.error(t("aiGenerate.pleaseUploadFirstFrame")); return; }
    if (!imageEditModel) { message.error(t("aiGenerate.pleaseSelectVideoModel")); return; }

    const sourceImagess = sourceImages.map((item:string)=> replaceOssUrl(item));
    try {
      setImageEditLoading(true);
      setImageEditStatus("submitted");
      setImageEditProgress(10);
      const res: any = await editImage({ 
        model: imageEditModel, 
        image: sourceImagess, 
        prompt: imageEditPrompt, 
        n: imageEditN, 
        size: imageEditSize, 
        response_format: "url" 
      });
      if (res?.data?.logId) {
        setImageEditTaskId(res.data.logId);
        setImageEditStatus(res.data.status);
        message.success(t("aiGenerate.taskSubmittedSuccess"));
        pollImageEditTaskStatus(res.data.logId);
      } else {
        setVipModalOpen(true);
        setImageEditStatus("");
      }
    } catch { setImageEditStatus(""); } finally { setImageEditLoading(false); }
  };

  const pollImageEditTaskStatus = async (logId: string) => {
    const checkStatus = async () => {
      try {
        setCheckingImageEditStatus(true);
        const res: any = await getImageEditTaskStatus(logId);
        if (res.data) {
          const { status, fail_reason, response, images } = res.data;
          const up = typeof status === "string" ? status.toUpperCase() : "";
          const normalized = up === "SUCCESS" ? "completed" : up === "FAILED" ? "failed" : up === "PROCESSING" || up === "GENERATING" ? "processing" : up === "NOT_START" || up === "NOT_STARTED" || up === "QUEUED" || up === "PENDING" ? "submitted" : (status || "").toString().toLowerCase();
          setImageEditStatus(normalized);
          
          let percent = 0;
          if (normalized === "submitted") percent = 10;
          else if (normalized === "processing") percent = 50;
          else if (normalized === "completed") percent = 100;
          else if (normalized === "failed") percent = 0;
          
          if (normalized === "completed") { 
            const imageUrls = (images || response?.list || []).map((i: any) => i.url) || [];
            setImageEditResult(imageUrls); 
            setImageEditProgress(100); 
            message.success(t('aiGenerate.imageEditCompleted' as any));
            
            // 自动上传第一张图片到默认素材库组
            if (imageUrls.length > 0) {
              await autoUploadToDefaultGroup(imageUrls[0], "img", imageEditModel, imageEditPrompt);
            }
            return true; 
          }
          if (normalized === "failed") { 
            setImageEditProgress(0); 
            message.error(fail_reason || t("aiGenerate.imageGenerationFailed")); 
            return true; 
          }
          setImageEditProgress(percent); 
          return false;
        }
          return false;
      } catch { return false; } finally { setCheckingImageEditStatus(false); }
    };
    const poll = async () => { const done = await checkStatus(); if (!done) setTimeout(poll, 5000); };
    poll();
  };

  const getVideoModelCreditCost = (modelName: string, duration: number, size: string): number => {
    const m = videoModels.find((v) => v.name === modelName);
    if (!m) return 0;
    
    // 如果是 kling 模型，使用 mode 字段匹配
    if (m?.channel === 'kling' && m?.pricing) {
      const item = m.pricing.find((p: any) => p.duration === duration && p.mode === size);
      return item ? item.price : 0;
    }
    
    // 其他模型使用 resolution 字段匹配
    const item = m?.pricing?.find((p: any) => p.duration === duration && p.resolution === size);
    return item ? item.price : 0;
  };

  const filteredVideoModels = useMemo(() => {
    if (!Array.isArray(videoModels)) return [] as any[];
    if (videoMode === "text2video") return (videoModels as any[]).filter((m: any) => (m?.modes || []).includes("text2video"));
    if (videoMode === "image2video") {
      // 合并所有支持图片的视频模式
      return (videoModels as any[]).filter((m: any) => {
        const modes = m?.modes || [];
        return modes.includes("image2video") || modes.includes("flf2video") || modes.includes("lf2video") || modes.includes("multi-image2video");
      });
    }
    return (videoModels as any[]).filter((m: any) => (m?.modes || []).includes("image2video"));
  }, [videoModels, videoMode]);

  const fetchImageModels = async () => {
    try { const res: any = await getImageGenerationModels(); if (res.data) { setImageModels(res.data); if (res.data.length) setModel(res.data[0].name); } }
    catch (e) { console.error(e); }
  };
  const fetchImageEditModels = async () => {
    try { const res: any = await getImageEditModels(); if (res.data) { setImageEditModels(res.data); if (res.data.length) setImageEditModel(res.data[0].name); } }
    catch (e) { console.error(e); }
  };
  const fetchVideoModels = async () => {
    try {
      const res: any = await getVideoGenerationModels();
      if (res.data) {
        setVideoModels(res.data);
        if (res.data.length) {
          const first = res.data[0];
          setVideoModel(first.name);
          if (first?.durations?.length) setVideoDuration(first.durations[0]);
          if (first?.resolutions?.length) setVideoSize(first.resolutions[0]);
          if (first?.modes?.includes("image2video") || first?.modes?.includes("flf2video") || first?.modes?.includes("lf2video") || first?.modes?.includes("multi-image2video")) setVideoMode("image2video");
          else if (first?.modes?.includes("text2video")) setVideoMode("text2video");
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchVideoHistory = async () => {
    try {
      setLoadingHistory(true);
      const res: any = await getVideoGenerations({ page: 1, pageSize: 20 });
      if (res.data?.list) {
        setVideoHistory(res.data.list);
      }
    } catch (e) {
      console.error(e);
      message.error(t("aiGenerate.taskFailed"));
    } finally {
      setLoadingHistory(false);
    }
  };

  // 格式化时间戳
  const formatTime = (timestamp: number) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // 获取状态显示文本
  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return t('aiGenerate.completed' as any);
      case 'FAILED':
        return t('aiGenerate.failed' as any);
      case 'PROCESSING':
        return t('aiGenerate.processing' as any);
      case 'SUBMITTED':
      case 'PENDING':
      case 'QUEUED':
        return t('aiGenerate.submitted' as any);
      default:
        return status || '-';
    }
  };

  // 处理历史记录项点击
  const handleHistoryItemClick = async (item: any) => {
    if (item.status === 'SUCCESS' && item.data?.video_url) {
      setVideoResult(item.data.video_url);
      setVideoStatus('completed');
      setVideoProgress(100);
      
      // 自动上传到默认素材库组
      await autoUploadToDefaultGroup(item.data.video_url, "video", item.model || "Unknown Model", item.prompt || "");
    } else if (item.status === 'PROCESSING') {
      setVideoTaskId(item.task_id);
      setVideoStatus('processing');
      pollVideoTaskStatus(item.task_id);
    }
  };
  useEffect(() => { fetchImageModels(); fetchVideoModels(); fetchImageEditModels(); }, []);

  // 当切换到视频模块时自动加载历史记录
  useEffect(() => {
    if (activeModule === "video" && videoHistory.length === 0) {
      fetchVideoHistory();
    }
  }, [activeModule]);

  // 当模型切换时，自动设置合适的 quality 值和尺寸值
  useEffect(() => {
    if (!model || !imageModels.length) return;
    
    const selectedModel = imageModels.find((m: any) => m.name === model);
    const qualities = selectedModel?.qualities || [];
    const sizes = selectedModel?.sizes || [];
    
    if (qualities.length > 0) {
      // 如果当前 quality 不在模型的 qualities 列表中，则设置为第一个可用的 quality
      if (!qualities.includes(quality)) {
        setQuality(qualities[0]);
      }
    }
    
    if (sizes.length > 0) {
      // 如果当前尺寸不在模型的 sizes 列表中，则设置为第一个可用的尺寸
      if (!sizes.includes(size)) {
        setSize(sizes[0]);
      }
    }
  }, [model, imageModels, quality, size]);

  // 当图片编辑模型切换时，自动设置合适的尺寸值并处理图片数量限制
  useEffect(() => {
    if (!imageEditModel || !imageEditModels.length) return;
    
    const selectedModel = imageEditModels.find((m: any) => m.name === imageEditModel);
    const sizes = selectedModel?.sizes || [];
    const maxImages = selectedModel?.maxInputImages || 1;
    
    if (sizes.length > 0) {
      // 如果当前尺寸不在模型的 sizes 列表中，则设置为第一个可用的尺寸
      if (!sizes.includes(imageEditSize)) {
        setImageEditSize(sizes[0]);
      }
    }
    
    // 如果当前图片数量超过新模型的最大限制，则移除多余的图片
    if (sourceImages.length > maxImages) {
      const removedCount = sourceImages.length - maxImages;
      setSourceImages(prev => prev.slice(0, maxImages));
      message.warning(t('aiGenerate.autoRemoveExcessImages' as any, { maxCount: maxImages, removedCount: removedCount }));
    }
  }, [imageEditModel, imageEditModels, imageEditSize, sourceImages.length]);

  // 根据 URL ?tab=... 初始化/响应切换模块与子标签
  useEffect(() => {
    const tab = searchParams.get('tab') || '';
    if (!tab) return;
    if (tab === 'videoGeneration' || tab === 'text2video' || tab === 'image2video' || tab === 'flf2video' || tab === 'lf2video' || tab === 'multi-image2video') {
      setActiveModule('video');
      // 将所有图片相关的视频模式都映射到 image2video
      if (tab === 'flf2video' || tab === 'lf2video' || tab === 'multi-image2video') {
        setActiveVideoTab('image2video');
      } else {
        setActiveVideoTab(tab as any);
      }
    } else if (tab === 'textToImage' || tab === 'imageToImage' || tab === 'textToFireflyCard' || tab === 'md2card' || tab === 'chat') {
      setActiveModule('image');
      setActiveImageTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    if ((filteredVideoModels as any[]).length > 0) {
      if (!(filteredVideoModels as any[]).find((m: any) => m.name === videoModel)) {
        setVideoModel((filteredVideoModels as any[])[0].name);
      }
    }
    if (videoMode === "text2video") { setVideoImage(""); setVideoImageTail(""); setVideoImages([]); }
  }, [videoMode, filteredVideoModels]);

  useEffect(() => {
    if (!videoModel || !videoModels?.length) return;
    const current: any = (videoModels as any[]).find((m: any) => m.name === videoModel);
    if (!current) return;
    
    let durations: any[] = [];
    let resolutions: any[] = [];
    
    // 如果是 kling 模型，从 pricing 获取选项
    if (current?.channel === 'kling' && current?.pricing) {
      durations = [...new Set(current.pricing.map((p: any) => p.duration))];
      resolutions = [...new Set(current.pricing.map((p: any) => p.mode))];
    } else {
      // 其他模型从原有字段获取
      durations = current?.durations || [];
      resolutions = current?.resolutions || [];
    }
    
    const { supportedParameters = [] } = current || {};
    
    if (durations.length && !durations.includes(videoDuration)) setVideoDuration(durations[0]);
    if (resolutions.length && !resolutions.includes(videoSize)) setVideoSize(resolutions[0]);
    if (!supportedParameters.includes("image") && videoImage) setVideoImage("");
    if (!supportedParameters.includes("image_tail") && videoImageTail) setVideoImageTail("");
  }, [videoModel, videoModels]);

  const fetchMediaGroups = async (type: "video" | "img" = "img") => {
    try { 
      setLoadingMediaGroups(true); 
      const res: any = await getMediaGroupList(1, 100, type); 
      if (res.data) {
        const groups = res.data.list || [];
        setMediaGroups(groups);
        // 找到默认组
        const defaultGroup = groups.find((group: any) => group.isDefault === true);
        if (defaultGroup) {
          setDefaultMediaGroup(defaultGroup._id);
        }else{
          setDefaultMediaGroup(groups[0]._id);
        }
      }
    }
    catch { message.error(t("aiGenerate.getMediaGroupListFailed")); }
    finally { setLoadingMediaGroups(false); }
  };

  const handleTextToImage = async () => {
    if (!prompt) { message.error(t("aiGenerate.pleaseEnterPrompt")); return; }
    try {
      setLoading(true);
      setImageStatus("submitted");
      setImageProgress(10);
      const res: any = await generateImage({ prompt, n, quality, style, size, model, response_format: "url" });
      console.log('res', res)
      if (res?.data?.logId) {
        setImageTaskId(res.data.logId);
        setImageStatus(res.data.status);
        message.success(t("aiGenerate.taskSubmittedSuccess"));
        pollImageTaskStatus(res.data.logId);
      } else {
        setVipModalOpen(true);
        setImageStatus("");
      }
    } catch { 
      setImageStatus(""); 
    } finally { setLoading(false); }
  };

  const handleTextToFireflyCard = async () => {
    if (!content || !title) { message.error(t("aiGenerate.pleaseEnterContentAndTitle")); return; }
    try { 
      setLoadingFirefly(true); 
      const res: any = await generateFireflyCard({ content, temp, title }); 
      if (res.data?.image) {
        setFireflyResult(res.data.image);
        
        // 自动上传到默认素材库组
        await autoUploadToDefaultGroup(res.data.image, "img", "Firefly Card", `${title}: ${content}`);
      } else {
        message.error(t("aiGenerate.fireflyCardGenerationFailed"));
      }
    }
    catch { message.error(t("aiGenerate.fireflyCardGenerationFailed")); } finally { setLoadingFirefly(false); }
  };

  const replaceOssUrl = (url: string) => {
    return url.replace("/ossProxy/", OSS_URL);
  };

  const handleVideoGeneration = async () => {
    if (!videoPrompt) { message.error(t("aiGenerate.pleaseEnterVideoDescription")); return; }
    if (!videoModel) { message.error(t("aiGenerate.pleaseSelectVideoModel")); return; }
    if (videoMode === "image2video") {
      const current: any = (filteredVideoModels as any[]).find((m: any) => m.name === videoModel) || {};
      const supported: string[] = current?.supportedParameters || [];
      const modes: string[] = current?.modes || [];
      
      // 检查多图合成视频
      if (modes.includes('multi-image2video') && supported.includes("image") && videoImages.length === 0) {
        message.error(t('aiGenerate.pleaseUploadAtLeastOneImage' as any));
        return;
      }
      
      // 检查单图视频
      if (modes.includes('image2video') && !modes.includes('multi-image2video') && supported.includes("image") && !videoImage) {
        message.error(t("aiGenerate.pleaseUploadFirstFrame"));
        return;
      }
      
      // 检查首尾帧视频
      if (modes.includes('flf2video') && supported.includes("image") && !videoImage) {
        message.error(t("aiGenerate.pleaseUploadFirstFrame"));
        return;
      }
      if (modes.includes('flf2video') && supported.includes("image_tail") && !videoImageTail) {
        message.error(t("aiGenerate.pleaseUploadTailFrame"));
        return;
      }
      
      // 检查仅尾帧视频
      if (modes.includes('lf2video') && supported.includes("image_tail") && !videoImageTail) {
        message.error(t("aiGenerate.pleaseUploadTailFrame"));
        return;
      }
    }
    try {
      setLoadingVideo(true); setVideoStatus("submitted"); setVideoProgress(10);
      const current: any = (filteredVideoModels as any[]).find((m: any) => m.name === videoModel) || {};
      const data: any = { model: videoModel, prompt: videoPrompt, duration: videoDuration };
      
      // 如果是 kling 模型，传递 mode 参数而不是 size 参数
      if (current?.channel === 'kling') {
        data.mode = videoSize;
      } else {
        data.size = videoSize;
      }
      
      const supported: string[] = current?.supportedParameters || [];
      const modes: string[] = current?.modes || [];
      
      if (videoMode === "image2video") {
        // 多图合成视频
        if (modes.includes('multi-image2video') && supported.includes("image") && videoImages.length > 0) {
          data.image = videoImages.map((image: string) => replaceOssUrl(image));
        }
        // 单图视频
        else if (modes.includes('image2video') && !modes.includes('multi-image2video') && supported.includes("image") && videoImage) {
          
          data.image = replaceOssUrl(videoImage);
        }
        // 首尾帧视频
        else if (modes.includes('flf2video')) {
          if (supported.includes("image") && videoImage) data.image = replaceOssUrl(videoImage);
          if (supported.includes("image_tail") && videoImageTail) data.image_tail = replaceOssUrl(videoImageTail);
        }
        // 仅尾帧视频
        else if (modes.includes('lf2video') && supported.includes("image_tail") && videoImageTail) {
          data.image_tail = replaceOssUrl(videoImageTail);
        }
      }
      const res: any = await generateVideo(data);
      if (res?.data?.task_id) { setVideoTaskId(res.data.task_id); setVideoStatus(res.data.status); message.success(t("aiGenerate.taskSubmittedSuccess")); pollVideoTaskStatus(res.data.task_id); }
      else { setVipModalOpen(true); setVideoStatus(""); }
    } catch { setVideoStatus(""); } finally { setLoadingVideo(false); }
  };

  const pollVideoTaskStatus = async (taskId: string) => {
    const checkStatus = async () => {
      try {
        setCheckingStatus(true);
        const res: any = await getVideoTaskStatus(taskId);
        if (res.data) {
          const { status, fail_reason, video_url, progress } = res.data;
          const up = typeof status === "string" ? status.toUpperCase() : "";
          const normalized = up === "SUCCESS" ? "completed" : up === "FAILED" ? "failed" : up === "PROCESSING" ? "processing" : up === "NOT_START" || up === "NOT_STARTED" || up === "QUEUED" || up === "PENDING" ? "submitted" : (status || "").toString().toLowerCase();
          setVideoStatus(normalized);
          let percent = 0;
          if (typeof progress === "string") { const m = progress.match(/(\d+)/); percent = m ? Number(m[1]) : 0; }
          else if (typeof progress === "number") { percent = progress > -1 ? Math.round(progress) : Math.round(progress * 100); }
          if (normalized === "completed") { 
            const videoUrl = res.data?.data?.video_url;
            setVideoResult(videoUrl); 
            setVideoProgress(100); 
            message.success(t("aiGenerate.videoGenerationSuccess"));
            
            // 自动上传到默认素材库组
            if (videoUrl) {
              await autoUploadToDefaultGroup(videoUrl, "video", videoModel, videoPrompt);
            }
            return true; 
          }
          if (normalized === "failed") { setVideoProgress(0); message.error(fail_reason || t("aiGenerate.videoGenerationFailed")); return true; }
          setVideoProgress(percent); return false;
        }
          return false;
      } catch { return false; } finally { setCheckingStatus(false); }
    };
    const poll = async () => { const done = await checkStatus(); if (!done) setTimeout(poll, 5000); };
    poll();
  };

  const pollImageTaskStatus = async (logId: string) => {
    const checkStatus = async () => {
      try {
        setCheckingImageStatus(true);
        const res: any = await getImageTaskStatus(logId);
        if (res.data) {
          const { status, fail_reason, response, images } = res.data;
          const up = typeof status === "string" ? status.toUpperCase() : "";
          const normalized = up === "SUCCESS" ? "completed" : up === "FAILED" ? "failed" : up === "PROCESSING" || up === "GENERATING" ? "processing" : up === "NOT_START" || up === "NOT_STARTED" || up === "QUEUED" || up === "PENDING" ? "submitted" : (status || "").toString().toLowerCase();
          setImageStatus(normalized);
          
          // 计算进度 - 如果没有明确的progress字段，根据状态估算
          let percent = 0;
          if (normalized === "submitted") percent = 10;
          else if (normalized === "processing") percent = 50;
          else if (normalized === "completed") percent = 100;
          else if (normalized === "failed") percent = 0;
          
          if (normalized === "completed") { 
            // 优先使用 images 字段，如果没有则使用 response.list
            const imageUrls = (images || response?.list || []).map((i: any) => i.url) || [];
            setResult(imageUrls); 
            setImageProgress(100); 
            message.success(t('aiGenerate.imageGenerationCompleted' as any));
            
            // 自动上传第一张图片到默认素材库组
            if (imageUrls.length > 0) {
              await autoUploadToDefaultGroup(imageUrls[0], "img", model, prompt);
            }
            return true; 
          }
          if (normalized === "failed") { 
            setImageProgress(0); 
            message.error(fail_reason || t("aiGenerate.imageGenerationFailed")); 
            return true; 
          }
          setImageProgress(percent); 
          return false;
        }
          return false;
      } catch { return false; } finally { setCheckingImageStatus(false); }
    };
    const poll = async () => { const done = await checkStatus(); if (!done) setTimeout(poll, 5000); };
    poll();
  };

  const handleMd2CardGeneration = async () => {
    if (!markdownContent) { message.error(t("aiGenerate.pleaseEnterMarkdown")); return; }
    try { 
      setLoadingMd2Card(true); 
      const res: any = await generateMd2Card({ markdown: markdownContent, theme: selectedTheme, themeMode, width: cardWidth, height: cardHeight, splitMode, mdxMode, overHiddenMode }); 
      if (res?.data?.images?.length) {
        const cardUrl = res.data.image[0].url;
        setMd2CardResult(cardUrl);
        
        // 自动上传到默认素材库组
        await autoUploadToDefaultGroup(cardUrl, "img", "Markdown Card", markdownContent.substring(0, 100));
      } else {
        setVipModalOpen(true);
      }
    }
    catch { setVipModalOpen(true); } finally { setLoadingMd2Card(false); }
  };

  const [currentUploadUrl, setCurrentUploadUrl] = useState<string | null>(null);
  
  // 自动上传到默认素材库组
  const autoUploadToDefaultGroup = async (mediaUrl: string, mediaType: "video" | "img", modelName: string, description: string) => {
    try {
      // 检查是否已经上传过
      if (uploadedContent.has(mediaUrl)) {
        console.log('Content already uploaded:', mediaUrl);
        return;
      }
      
      // 获取素材库列表并找到默认组
      const res: any = await getMediaGroupList(1, 100, mediaType);
      let defaultGroupId = null;
      
      if (res.data) {
        const groups = res.data.list || [];
        const defaultGroup = groups.find((group: any) => group.isDefault === true);
        if (defaultGroup) {
          defaultGroupId = defaultGroup._id;
          setDefaultMediaGroup(defaultGroupId);
        }else{
          defaultGroupId = groups[0]._id;
          setDefaultMediaGroup(defaultGroupId);
        }
      }
      
      if (!defaultGroupId) {
        console.warn('No default media group found');
        message.error(t('aiGenerate.noDefaultMediaGroup' as any));
        return;
      }
      
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const uploadTitle = modelName ? `${modelName} ${timeStr}` : timeStr;
      
      console.log('开始上传到默认组:', defaultGroupId, mediaUrl);
      
      const uploadRes: any = await createMedia({ 
        groupId: defaultGroupId, 
        url: mediaUrl, 
        type: mediaType, 
        title: uploadTitle, 
        desc: description 
      });
      
      if (uploadRes.data) {
        // 标记为已上传
        setUploadedContent(prev => new Set([...prev, mediaUrl]));
        message.success(mediaType === "video" ? t("aiGenerate.videoUploadSuccess") : t("aiGenerate.uploadSuccess"));
        console.log('上传成功');
      } else {
        message.error(mediaType === "video" ? t("aiGenerate.videoUploadFailed") : t("aiGenerate.uploadFailed"));
        console.log('上传失败:', uploadRes);
      }
    } catch (error) {
      console.error('Auto upload failed:', error);
      message.error(mediaType === "video" ? t("aiGenerate.videoUploadFailed") : t("aiGenerate.uploadFailed"));
    }
  };
  
  const handleUploadToMediaGroup = async (type: string = "img", url?: string) => {
    setSelectedMediaGroup(null);
    setCurrentUploadUrl(url || (videoResult || fireflyResult || md2CardResult) || null);
    await fetchMediaGroups(type as any);
    setUploadModalVisible(true);
  };
  const handleUploadConfirm = async () => {
    if (!selectedMediaGroup) { message.error(t("aiGenerate.pleaseSelectMediaGroup")); return; }
    try {
      setUploading(true);
      const mediaUrl = currentUploadUrl || videoResult || fireflyResult || md2CardResult;
      const mediaType = videoResult ? "video" : "img";
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const usedModel = videoResult ? videoModel : model;
      const uploadTitle = usedModel ? `${usedModel} ${timeStr}` : timeStr;
      const uploadDesc = videoResult ? (videoPrompt || "") : (prompt || content || "");
      const res: any = await createMedia({ groupId: selectedMediaGroup, url: mediaUrl, type: mediaType, title: uploadTitle, desc: uploadDesc });
      if (res.data) { message.success(videoResult ? t("aiGenerate.videoUploadSuccess") : md2CardResult ? t("aiGenerate.cardUploadSuccess") : t("aiGenerate.uploadSuccess")); setUploadModalVisible(false); }
      else { message.error(videoResult ? t("aiGenerate.videoUploadFailed") : md2CardResult ? t("aiGenerate.cardUploadFailed") : t("aiGenerate.uploadFailed")); }
    } catch { message.error(videoResult ? t("aiGenerate.videoUploadFailed") : md2CardResult ? t("aiGenerate.cardUploadFailed") : t("aiGenerate.uploadFailed")); }
    finally { setUploading(false); }
  };

  return (
    <div className={styles.container}>
    

      <div className={styles.mainLayout}>
        <div className={styles.leftSidebar}>
          <div className={styles.moduleTabs}>
            <button title={t("aiGenerate.textToImage")} className={`${styles.moduleTab} ${activeModule === "image" ? styles.moduleTabActive : ""}`} onClick={() => setActiveModule("image")}>
              <PictureOutlined />
          </button>
            <button title={t("aiGenerate.videoGeneration")} className={`${styles.moduleTab} ${activeModule === "video" ? styles.moduleTabActive : ""}`} onClick={() => setActiveModule("video")}>
              <VideoCameraOutlined />
            </button>
        </div>
          {activeModule === "image" && (
            <div className={styles.imageSubTabs}>
              <button className={`${styles.subTab} ${activeImageTab==='textToImage' ? styles.subTabActive : ''}`} onClick={()=>setActiveImageTab('textToImage')}>
                <div className="subTabIcon"><PictureOutlined /></div>
                <div className={styles.subTabLabel}>{t("aiGenerate.textToImage")}</div>
              </button>
              <button className={`${styles.subTab} ${activeImageTab==='imageToImage' ? styles.subTabActive : ''}`} onClick={()=>setActiveImageTab('imageToImage')}>
                <div className="subTabIcon"><PictureOutlined /></div>
                <div className={styles.subTabLabel}>{t("aiGenerate.imageToImage" as any)}</div>
              </button>
              <button className={`${styles.subTab} ${activeImageTab==='textToFireflyCard' ? styles.subTabActive : ''}`} onClick={()=>setActiveImageTab('textToFireflyCard')}>
                <div className="subTabIcon"><FireOutlined /></div>
                <div className={styles.subTabLabel}>{t("aiGenerate.fireflyCard")}</div>
              </button>
              <button className={`${styles.subTab} ${activeImageTab==='md2card' ? styles.subTabActive : ''}`} onClick={()=>setActiveImageTab('md2card')}>
                <div className="subTabIcon"><FileTextOutlined /></div>
                <div className={styles.subTabLabel}>{t("aiGenerate.markdownToCard")}</div>
              </button>
              <button className={`${styles.subTab} ${activeImageTab==='chat' ? styles.subTabActive : ''}`} onClick={()=>setActiveImageTab('chat')}>
                <div className="subTabIcon"><MessageOutlined /></div>
                <div className={styles.subTabLabel}>Nano Banana</div>
              </button>
      </div>
          )}

          {activeModule === "video" && (
            <div className={styles.imageSubTabs}>
              <button className={`${styles.subTab} ${activeVideoTab==='text2video' ? styles.subTabActive : ''}`} onClick={()=>setActiveVideoTab('text2video')}>
                <div className="subTabIcon"><VideoCameraOutlined /></div>
                <div className={styles.subTabLabel}>{t('aiGenerate.textToVideo')}</div>
              </button>
              <button className={`${styles.subTab} ${activeVideoTab==='image2video' ? styles.subTabActive : ''}`} onClick={()=>setActiveVideoTab('image2video')}>
                <div className="subTabIcon"><PictureOutlined /></div>
                <div className={styles.subTabLabel}>{t('aiGenerate.imageToVideo')}</div>
              </button>
            </div>
          )}
        </div>

        <div className={styles.rightContent}>
          {activeModule === "image" ? (
            <>
              {activeImageTab === 'textToImage' && (
            <div className={styles.section}>
                  <div className={styles.twoColumn}>
                    <div className={styles.leftPanel}>
                      <div className={styles.blockTitle}>{t('aiGenerate.textToImage')}</div>

                      <div className={styles.blockTitle} style={{ marginTop: 12 }}>{t('aiGenerate.selectModelPlaceholder')}</div>
                      <div className={styles.modelSelect}>
                        <button className={styles.modelSelectBtn} onClick={()=>setShowModelDropdown((s)=>!s)}>
                          <div className={styles.modelIconSelect}><PictureOutlined style={{fontSize:'24px'}}/></div>
                          <div className={styles.modelMain}>
                            <div className={styles.modelHeader}>
                              <span className={styles.modelName}>{model || t('aiGenerate.selectModelPlaceholder')}</span>
                            </div>
                            <div className={styles.modelDesc} style={{ marginTop: 4 }}>
                              {(() => { const m:any = imageModels.find((x:any)=>x.name===model); return m?.description || ''; })()}</div>
                          </div>
                          <span className={styles.modelCaret}>▾</span>
                        </button>
                        {showModelDropdown && (
                          <div className={styles.modelDropdown}>
                            <div className={styles.modelListScrollable}>
                              {imageModels.map((m:any)=>{
                                const isActive = model === m.name;
                                return (
                                  <div key={m.name} className={`${styles.modelItem} ${isActive?styles.modelItemActive:''}`} onClick={()=>{ setModel(m.name); setShowModelDropdown(false); }}>
                                    
                                    <div className={styles.modelMain}>
                                      <div className={styles.modelHeader}>
                                        <div className={styles.modelIcon}><PictureOutlined /></div>
                                        <span className={styles.modelName}>{m.name || ''}</span>
                                        {m.mainTag ? <span className={styles.modelTag}>New</span> : null}
                                      </div>
                                      <div className={styles.modelDesc}>{m.description || ''}</div>

                                      <div className={styles.modelMeta}>
                                      {
                                        m?.tags?.length > 0 
                                        ? 
                                         m?.tags.map((item:string)=> <span key={item}>{item}</span>) 
                                        : null
                                      }
                                      </div>
                                      
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={styles.blockTitle} style={{ marginTop: 1 }}>{t('aiGenerate.promptPlaceholder')}</div>
                      <TextArea value={prompt} onChange={(e)=>setPrompt(e.target.value)} rows={4} />
                      <div className={styles.exampleChips}>
                        {[
                          t('aiGenerate.examplePrompt1' as any),
                          t('aiGenerate.examplePrompt2' as any),
                          t('aiGenerate.examplePrompt3' as any),
                          t('aiGenerate.examplePrompt4' as any),
                          t('aiGenerate.examplePrompt5' as any)
                        ].map((w)=> (
                          <span key={w as string} className={styles.exampleChip} onClick={()=>setPrompt(w as string)}>{w}</span>
                        ))}
                      </div>

                      <div className={styles.blockTitle} style={{ marginTop: 6 }}>{t('aiGenerate.advancedOptions' as any)}</div>
                      <div className={styles.dimensions}>
                        <Select value={size} onChange={setSize} style={{ width: '100%' }}>
                          {(() => {
                            const selectedModel = imageModels.find((m: any) => m.name === model);
                            const sizes = selectedModel?.sizes || ['1024x1024'];
                            return sizes.map((sizeOption: string) => (
                              <Option key={sizeOption} value={sizeOption}>{sizeOption}</Option>
                            ));
                          })()}
                        </Select>
                      </div>
                      {/* <div className={styles.pillRow}>
                        <div className={styles.blockTitle} style={{ marginBottom: 6 }}>{t('aiGenerate.outputImageCount' as any)}</div>
                        <div className={styles.pillGroupBox}>
                          <div className={styles.pillGroup}>
                            {[1,2,3,4].map((num)=> (
                              <button key={num} className={`${styles.pill} ${n===num?styles.pillActive:''}`} onClick={()=>setN(num)}>{num}</button>
                            ))}
                          </div>
                        </div>
                </div> */}
                <div className={styles.options}>
                        {(() => {
                          const selectedModel = imageModels.find((m: any) => m.name === model);
                          const qualities = selectedModel?.qualities || [];
                          
                          if (qualities.length === 0) return null;
                          
                          return (
                            <Select value={quality} onChange={setQuality} style={{ width: '100%' }}>
                              {qualities.map((q: string) => (
                                <Option key={q} value={q}>
                                  {q === 'high' ? t('aiGenerate.hd') : 
                                   q === 'medium' ? t('aiGenerate.standard') : 
                                   q === 'low' ? t('aiGenerate.low' as any) : q}
                                </Option>
                              ))}
                            </Select>
                          );
                        })()}
                        <Select value={style} onChange={setStyle} style={{ width: '100%' }}>
                    <Option value="vivid">{t('aiGenerate.vivid')}</Option>
                    <Option value="natural">{t('aiGenerate.natural')}</Option>
                  </Select>
                </div>
                      {model && (()=>{ const selected = imageModels.find((m:any)=>m.name===model); const credit = selected?.pricing ? parseFloat(selected.pricing) : 0; return credit>0 ? (<div className={styles.creditCostInfo}><span style={{color:'#1890ff',fontSize:'14px'}}>💰 {t('aiGenerate.estimatedCreditCost' as any)}: {credit} {t('aiGenerate.credits' as any)}</span></div>) : null; })()}
                      <Button type="primary" onClick={handleTextToImage} loading={loading} disabled={!prompt || !model} icon={<PictureOutlined />}>{t('aiGenerate.generate')}</Button>
                    </div>
                    <div className={styles.rightPanel}>
                      {(imageStatus || result) ? (
                        <div className={styles.result}>
                          {imageStatus && (
                            <div style={{ marginBottom:16 }}>
                              <div style={{ marginBottom:8 }}>
                                <strong>{t('aiGenerate.taskStatus')}: </strong>
                                {imageStatus === 'submitted' && t('aiGenerate.taskSubmitted')}
                                {imageStatus === 'processing' && t('aiGenerate.taskProcessing')}
                                {imageStatus === 'completed' && t('aiGenerate.taskCompleted')}
                                {imageStatus === 'failed' && t('aiGenerate.taskFailed')}
                              </div>
                              {imageProgress>0 && imageProgress<100 && (<Progress percent={imageProgress} status="active" />)}
                            </div>
                          )}
                          {result && (
                            <Row gutter={[16,16]} justify={'center'}>
                              {result.map((img, idx)=>(
                                <Col key={idx} xs={24} sm={12} md={12} lg={12}>
                                  <div className={styles.imageCard}>
                                    <img src={getOssUrl(img)} alt={`${t('aiGenerate.textToImage')} ${idx+1}`} />
                                    <div className={styles.imageActions}>
                                      <Button size="small" icon={<DownloadOutlined />} onClick={()=>handleDownloadUrl(img)} />
                                      {/* <Button size="small" type="primary" icon={<UploadOutlined />} onClick={()=>handleUploadToMediaGroup('img', img)} /> */}
                                    </div>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          )}
                        </div>
                      ) : (
                        <div className={styles.sampleCarousel}>
                          <div className={styles.sampleStage}>
                            <img src={sampleImages[sampleIdx]} alt="sample" />
                            <button className={styles.samplePrev} onClick={handlePrevSample}>‹</button>
                            <button className={styles.sampleNext} onClick={handleNextSample}>›</button>
                          </div>
                          <div className={styles.sampleDots}>
                            {sampleImages.map((_,i)=>(
                              <span key={i} className={`${styles.sampleDot} ${i===sampleIdx?styles.sampleDotActive:''}`} onClick={()=>setSampleIdx(i)}></span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeImageTab === 'imageToImage' && (
                <div className={styles.section}>
                  <div className={styles.twoColumn}>
                    <div className={styles.leftPanel}>
                      <div className={styles.blockTitle}>{t('aiGenerate.imageToImage' as any)}</div>

                      <div className={styles.blockTitle} style={{ marginTop: 12 }}>{t('aiGenerate.selectModelPlaceholder')}</div>
                      <div className={styles.modelSelect}>
                        <button className={styles.modelSelectBtn} onClick={()=>setShowModelDropdown((s)=>!s)}>
                          <div className={styles.modelIconSelect}><PictureOutlined style={{fontSize:'24px'}}/></div>
                          <div className={styles.modelMain}>
                            <div className={styles.modelHeader}>
                              <span className={styles.modelName}>{imageEditModel || t('aiGenerate.selectModelPlaceholder')}</span>
                            </div>
                            <div className={styles.modelDesc} style={{ marginTop: 4 }}>{(() => { const m:any = imageEditModels.find((x:any)=>x.name===imageEditModel); return m?.description || ''; })()}</div>
                          </div>
                          <span className={styles.modelCaret}>▾</span>
                        </button>
                        {showModelDropdown && (
                          <div className={styles.modelDropdown}>
                            <div className={styles.modelListScrollable}>
                              {imageEditModels.map((m:any)=>{
                                const isActive = imageEditModel === m.name;
                                return (
                                  <div key={m.name} className={`${styles.modelItem} ${isActive?styles.modelItemActive:''}`} onClick={()=>{ setImageEditModel(m.name); setShowModelDropdown(false); }}>
                                   
                                    <div className={styles.modelMain}>
                                      <div className={styles.modelHeader}>
                                         <div className={styles.modelIcon}><PictureOutlined /></div>
                                        <span className={styles.modelName}>{m.name || ''}</span>
                                        {m.mainTag ? <span className={styles.modelTag}>New</span> : null}
                                      </div>
                                      <div className={styles.modelDesc}>{m.description || ''}</div>

                                      <div className={styles.modelMeta}>
                                      {
                                        m?.tags?.length > 0 
                                        ? 
                                         m?.tags.map((item:string)=> <span key={item}>{item}</span>) 
                                        : null
                                      }
                                      </div>
                                      
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={styles.blockTitle} style={{ marginTop: 1 }}>{t('aiGenerate.promptPlaceholder')}</div>
                      <TextArea value={imageEditPrompt} onChange={(e)=>setImageEditPrompt(e.target.value)} rows={4} />

                      <div className={styles.blockTitle} style={{ marginTop: 6 }}>{t('aiGenerate.uploadImage')}</div>
                      <div className={styles.uploadPanel}>
                        {(() => {
                          const selectedModel = imageEditModels.find((m: any) => m.name === imageEditModel);
                          const maxImages = selectedModel?.maxInputImages || 1;
                          const isMaxReached = sourceImages.length >= maxImages;
                          
                          return (
                            <div 
                              className={`${styles.uploadCard} ${isMaxReached ? styles.uploadCardDisabled : ''}`} 
                              onClick={() => !isMaxReached && firstFrameInputRef.current?.click()}
                              style={{ 
                                cursor: isMaxReached ? 'not-allowed' : 'pointer',
                                opacity: isMaxReached ? 0.5 : 1 
                              }}
                            >
                              <div className={styles.uploadPlaceholder}>
                                <span className={styles.uploadIcon}>+</span>
                                <span className={styles.uploadText}>
                                  {isMaxReached 
                                    ? t('aiGenerate.maxUploadReached' as any, { count: maxImages })
                                    : t('aiGenerate.imageUrlPlaceholder')
                                  }
                                </span>
                              </div>
                              <input 
                                type="file" 
                                accept="image/*" 
                                multiple 
                                ref={firstFrameInputRef} 
                                onChange={handleSourceImageChange} 
                                style={{ display:'none' }} 
                                disabled={isMaxReached}
                              />
                            </div>
                          );
                        })()}
                        
                        {sourceImages.length > 0 && (
                          <div className={styles.imageGrid}>
                            {sourceImages.map((img, index) => (
                              <div key={index} className={styles.imageItem}>
                                <img src={img} alt={`${t('aiGenerate.sourceImage' as any)} ${index + 1}`} />
                                <button 
                                  className={styles.removeBtn} 
                                  onClick={() => handleRemoveSourceImage(index)}
                                  title={t('aiGenerate.deleteImage' as any)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {sourceImages.length > 0 && (
                          <button 
                            className={styles.clearAllBtn} 
                            onClick={handleClearAllSourceImages}
                            style={{ marginTop: 8, fontSize: '12px', color: '#ff4d4f' }}
                          >
                            {t('aiGenerate.clearAllImages' as any)}
                          </button>
                        )}
                        
                        {imageEditModel && (() => {
                          const selectedModel = imageEditModels.find((m: any) => m.name === imageEditModel);
                          console.log(selectedModel, 'selectedModel');
                          const maxImages = selectedModel?.maxInputImages || 1;
                          return (
                            <div className={styles.maxImagesInfo}>
                              <span style={{color:'#1890ff',fontSize:'12px'}}>
                                
                                {t('aiGenerate.maxImages' as any) } { maxImages}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className={styles.blockTitle} style={{ marginTop: 6 }}>{t('aiGenerate.advancedOptions' as any)}</div>
                      <div className={styles.dimensions}>
                        <Select value={imageEditSize} onChange={setImageEditSize} style={{ width: '100%' }}>
                          {(() => {
                            const selectedModel = imageEditModels.find((m: any) => m.name === imageEditModel);
                            const sizes = selectedModel?.sizes || ['1024x1024'];
                            return sizes.map((size: string) => (
                              <Option key={size} value={size}>{size}</Option>
                            ));
                          })()}
                        </Select>
                      </div>
                      {/* <div className={styles.pillRow}>
                        <div className={styles.blockTitle} style={{ marginBottom: 6 }}>{t('aiGenerate.outputImageCount' as any)}</div>
                        <div className={styles.pillGroupBox}>
                          <div className={styles.pillGroup}>
                            {[1,2,3,4].map((num)=> (
                              <button key={num} className={`${styles.pill} ${imageEditN===num?styles.pillActive:''}`} onClick={()=>setImageEditN(num)}>{num}</button>
                            ))}
                          </div>
                        </div>
                      </div> */}
                      {imageEditModel && (()=>{ const selected = imageEditModels.find((m:any)=>m.name===imageEditModel); const credit = selected?.pricing ? parseFloat(selected.pricing) : 0; return credit>0 ? (<div className={styles.creditCostInfo}><span style={{color:'#1890ff',fontSize:'14px'}}>💰 {t('aiGenerate.estimatedCreditCost' as any)}: {credit} {t('aiGenerate.credits' as any)}</span></div>) : null; })()}
                      <Button type="primary" onClick={handleImageEdit} loading={imageEditLoading} disabled={!imageEditPrompt || !imageEditModel || !sourceImages.length} icon={<PictureOutlined />}>{t('aiGenerate.generate')}</Button>
                    </div>
                    <div className={styles.rightPanel}>
                      {(imageEditStatus || imageEditResult) ? (
                        <div className={styles.result}>
                          {imageEditStatus && (
                            <div style={{ marginBottom:16 }}>
                              <div style={{ marginBottom:8 }}>
                                <strong>{t('aiGenerate.taskStatus')}: </strong>
                                {imageEditStatus === 'submitted' && t('aiGenerate.taskSubmitted')}
                                {imageEditStatus === 'processing' && t('aiGenerate.taskProcessing')}
                                {imageEditStatus === 'completed' && t('aiGenerate.taskCompleted')}
                                {imageEditStatus === 'failed' && t('aiGenerate.taskFailed')}
                              </div>
                              {imageEditProgress>0 && imageEditProgress<100 && (<Progress percent={imageEditProgress} status="active" />)}
                            </div>
                          )}
                          {imageEditResult && (
                            <Row gutter={[16,16]} justify={'center'}>
                              {imageEditResult.map((img, idx)=>(
                                <Col key={idx} xs={24} sm={12} md={12} lg={12}>
                                  <div className={styles.imageCard}>
                                    <img src={getOssUrl(img)} alt={`${t('aiGenerate.imageToImage' as any)} ${idx+1}`} />
                                    <div className={styles.imageActions}>
                                      <Button size="small" icon={<DownloadOutlined />} onClick={()=>handleDownloadUrl(img)} />
                                      {/* <Button size="small" type="primary" icon={<UploadOutlined />} onClick={()=>handleUploadToMediaGroup('img', img)} /> */}
                                    </div>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          )}
                        </div>
                      ) : (
                        <div className={styles.sampleCarousel}>
                          <div className={styles.sampleStage}>
                            <img src={sampleImages[sampleIdx]} alt="sample" />
                            <button className={styles.samplePrev} onClick={handlePrevSample}>‹</button>
                            <button className={styles.sampleNext} onClick={handleNextSample}>›</button>
                          </div>
                          <div className={styles.sampleDots}>
                            {sampleImages.map((_,i)=>(
                              <span key={i} className={`${styles.sampleDot} ${i===sampleIdx?styles.sampleDotActive:''}`} onClick={()=>setSampleIdx(i)}></span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeImageTab === 'textToFireflyCard' && (
                <div className={styles.section}>
                  <div className={styles.twoColumn}>
                    <div className={styles.leftPanel}>
                      <div className={styles.blockTitle}>{t('aiGenerate.fireflyCard')}</div>
                      <Input placeholder={t("aiGenerate.titlePlaceholder")} value={title} onChange={(e)=>setTitle(e.target.value)} prefix={<FileTextOutlined />} />
                      <TextArea placeholder={t("aiGenerate.contentPlaceholder")} value={content} onChange={(e)=>setContent(e.target.value)} rows={4} />
                      <div className={styles.templateGrid}>
                        {templateList.map((item)=> (
                          <div key={item.key} className={`${styles.templateCard} ${temp===item.key?styles.templateCardActive:""}`} onClick={()=>setTemp(item.key)}>
                            <div className={styles.templateThumb}><img src={`${TEMPLATE_BASE}/${item.key}.png`} alt={`${t('aiGenerate.template')} ${item.name}`} /></div>
                            <div className={styles.templateLabel}>{item.name}</div>
                          </div>
                        ))}
                      </div>
                      <Button type="primary" onClick={handleTextToFireflyCard} loading={loadingFirefly} disabled={!content||!title} icon={<FireOutlined />}>{t("aiGenerate.generate")}</Button>
                    </div>
                    <div className={styles.rightPanel}>
                      <div className={styles.result}>
                        <div className={styles.imageCard}>
                          {fireflyResult ? (
                            <img src={getOssUrl(fireflyResult)} alt={t('aiGenerate.fireflyCard')} />
                          ) : (
                            <img src={`${TEMPLATE_BASE}/${temp}.png`} alt={t('aiGenerate.fireflyCard')} />
                          )}
                          {fireflyResult && (
                            <div className={styles.imageActions}>
                              <Button size="small" icon={<DownloadOutlined />} onClick={()=>handleDownloadUrl(fireflyResult)} />
                              {/* <Button size="small" type="primary" icon={<UploadOutlined />} onClick={()=>handleUploadToMediaGroup('img', fireflyResult)} /> */}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeImageTab === 'md2card' && (
                <div className={styles.section}>
                  <div className={styles.twoColumn}>
                    <div className={styles.leftPanel}>
                      <div className={styles.blockTitle}>{t('aiGenerate.markdownToCard')}</div>
                      <TextArea style={{ height: 100 }} placeholder={t("aiGenerate.markdownPlaceholder")} value={markdownContent} onChange={(e)=>setMarkdownContent(e.target.value)} rows={8} />
                      <div className={styles.dimensions}>
                        <Select value={themeMode} onChange={setThemeMode} style={{ width: "100%" }}>
                          <Option value="light">{t("aiGenerate.lightMode")}</Option>
                          <Option value="dark">{t("aiGenerate.darkMode")}</Option>
                        </Select>
                      </div>
                      <div className={styles.templateGrid}>
                        {md2CardTemplates.map((theme)=> (
                          <div key={theme.id} className={`${styles.templateCard} ${selectedTheme===theme.id?styles.templateCardActive:""}`} onClick={()=>setSelectedTheme(theme.id)}>
                            <div className={styles.templateThumb}><img src={theme.preview} alt={isEnglishLang ? theme.nameEn : theme.nameCn} /></div>
                            <div className={styles.templateLabel}>{isEnglishLang ? theme.nameEn : theme.nameCn}</div>
                          </div>
                        ))}
                      </div>
                      <div className={styles.options}>
                        <Input placeholder={t("aiGenerate.cardWidthPlaceholder")} type="number" value={cardWidth} onChange={(e)=>setCardWidth(Number(e.target.value))} style={{ width: "100%" }} />
                        <Input placeholder={t("aiGenerate.cardHeightPlaceholder")} type="number" value={cardHeight} onChange={(e)=>setCardHeight(Number(e.target.value))} style={{ width: "100%" }} />
                      </div>
                      <div className={styles.options}>
                        <Select value={splitMode} onChange={setSplitMode} style={{ width: "100%" }}>
                          <Option value="noSplit">{t("aiGenerate.noSplit")}</Option>
                          <Option value="split">{t("aiGenerate.split")}</Option>
                        </Select>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <label><input type="checkbox" checked={mdxMode} onChange={(e)=>setMdxMode(e.target.checked)} /> {t("aiGenerate.mdxMode")}</label>
                          <label><input type="checkbox" checked={overHiddenMode} onChange={(e)=>setOverHiddenMode(e.target.checked)} /> {t("aiGenerate.overHiddenMode")}</label>
                        </div>
                      </div>
                      <Button type="primary" onClick={handleMd2CardGeneration} loading={loadingMd2Card} disabled={!markdownContent} icon={<FileTextOutlined />}>{t("aiGenerate.generateCard")}</Button>
                    </div>
                    <div className={styles.rightPanel}>
                      <div className={styles.result}>
                        <div className={styles.imageCard}>
                          {md2CardResult ? (
                            <img src={getOssUrl(md2CardResult)} alt={t('aiGenerate.markdownCard')} />
                          ) : (
                            (() => { const theme = md2CardTemplates.find((t)=>t.id===selectedTheme); return (
                              <img src={theme?.preview} alt={isEnglishLang ? theme?.nameEn : theme?.nameCn} />
                            ); })()
                          )}
                          {md2CardResult && (
                            <div className={styles.imageActions}>
                              <Button size="small" icon={<DownloadOutlined />} onClick={()=>handleDownloadUrl(md2CardResult)} />
                              {/* <Button size="small" type="primary" icon={<UploadOutlined />} onClick={()=>handleUploadToMediaGroup('img', md2CardResult)} /> */}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeImageTab === 'chat' && (
                <div className={styles.chatSection}>
                  <div className={styles.chatContainer}>
                    <Chat defaultMask='100000' />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.section}>
              <div className={styles.twoColumn}>
                <div className={styles.leftPanel}>
                  <div className={styles.blockTitle}>
                    {activeVideoTab==='text2video' ? t('aiGenerate.textToVideo') : 
                     activeVideoTab==='image2video' ? t('aiGenerate.imageToVideo') : t('aiGenerate.textToVideo')}
                  </div>
                  {(() => { if (videoMode !== activeVideoTab) setVideoMode(activeVideoTab); return null; })()}

                  <div className={styles.blockTitle} style={{ marginTop: 12 }}>{t('aiGenerate.selectModelPlaceholder')}</div>
                  <div className={styles.modelSelect}>
                    <button className={styles.modelSelectBtn} onClick={()=>setShowVideoModelDropdown((s)=>!s)}>
                      <div className={styles.modelIconSelect}><VideoCameraOutlined style={{fontSize:'24px'}}/></div>
                      <div className={styles.modelMain}>
                        <div className={styles.modelHeader}>
                          <span className={styles.modelName}>{videoModel || t('aiGenerate.selectModelPlaceholder')}</span>
                        </div>
                        <div className={styles.modelDesc} style={{ marginTop: 4 }}>
                          {(() => { const m:any = (filteredVideoModels as any[]).find((x:any)=>x.name===videoModel); return m?.description || ''; })()}</div>
                      </div>
                      <span className={styles.modelCaret}>▾</span>
                    </button>
                    {showVideoModelDropdown && (
                      <div className={styles.modelDropdown}>
                        <div className={styles.modelListScrollable}>
                          {(filteredVideoModels as any[]).map((m:any)=>{
                            const isActive = videoModel === m.name;
                            return (
                              <div key={m.name} className={`${styles.modelItem} ${isActive?styles.modelItemActive:''}`} onClick={()=>{ setVideoModel(m.name); setShowVideoModelDropdown(false); }}>
                                
                                <div className={styles.modelMain}>
                                  <div className={styles.modelHeader}>
                                    <div className={styles.modelIcon}><VideoCameraOutlined /></div>
                                    <span className={styles.modelName}>{m.name || ''}</span>
                                    {m.mainTag || m.name.includes('sora') ? <span className={styles.modelTag}>New</span> : null}
                                  </div>
                                  <div className={styles.modelDesc}>{m.description || ''}</div>

                                  <div className={styles.modelMeta}>
                                  {
                                    m?.tags?.length > 0 
                                    ? 
                                     m?.tags.map((item:string)=> <span key={item}>{item}</span>) 
                                    : null
                                  }
                                  </div>
                                  
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <TextArea placeholder={t('aiGenerate.videoPromptPlaceholder')} value={videoPrompt} onChange={(e)=>setVideoPrompt(e.target.value)} rows={4} />

                  <div className={styles.dimensions}>
                    <Select value={videoSize} onChange={setVideoSize} style={{ width: "100%" }}>{(()=>{ 
                      const selected:any=(filteredVideoModels as any[]).find((m:any)=>m.name===videoModel)||{}; 
                      
                      // 如果是 kling 模型，从 pricing 的 mode 字段获取分辨率选项
                      if (selected?.channel === 'kling' && selected?.pricing) {
                        const modes = [...new Set(selected.pricing.map((p: any) => p.mode))] as string[];
                        return modes.map((mode: string) => (
                          <Option key={mode} value={mode}>{mode}</Option>
                        ));
                      }
                      
                      // 其他模型从 resolutions 字段获取
                      const sizes:string[]=selected?.resolutions||[]; 
                      return sizes.map((s)=> (<Option key={s} value={s}>{s}</Option>)); 
                    })()}</Select>
                    
                    <Select value={videoDuration} onChange={setVideoDuration} style={{ width: "100%" }}>{(()=>{ 
                      const selected:any=(filteredVideoModels as any[]).find((m:any)=>m.name===videoModel)||{}; 
                      
                      // 如果是 kling 模型，从 pricing 的 duration 字段获取时长选项
                      if (selected?.channel === 'kling' && selected?.pricing) {
                        const durations = [...new Set(selected.pricing.map((p: any) => p.duration))] as number[];
                        return durations.map((d: number) => (
                          <Option key={d} value={d}>{d}{t('aiGenerate.seconds')}</Option>
                        ));
                      }
                      
                      // 其他模型从 durations 字段获取
                      const durs:number[]=selected?.durations||[]; 
                      return durs.map((d)=> (<Option key={d} value={d}>{d}{t('aiGenerate.seconds')}</Option>)); 
                    })()}</Select>
                  </div>
                  <div className={styles.options}>
                    {(()=>{ 
                      const selected:any=(filteredVideoModels as any[]).find((m:any)=>m.name===videoModel)||{}; 
                      const supported:string[]=selected?.supportedParameters||[];
                      const modes:string[]=selected?.modes||[];
                      
                      // 根据 modes 判断视频生成类型
                      const isImage2Video = modes.includes('image2video');
                      const isFlf2Video = modes.includes('flf2video');
                      const isLf2Video = modes.includes('lf2video');
                      const isMultiImage2Video = modes.includes('multi-image2video');
                      
                      return (<>
                        {videoMode==='image2video' && (
                          <div className={styles.uploadPanel}>
                            {/* 单张图生视频 - 只需要首帧 */}
                            {isImage2Video && supported.includes('image') && !supported.includes('image_tail') && (
                              <div className={styles.uploadCard} onClick={handlePickFirstFrame}>
                                {videoImage ? (
                                  <img src={videoImage || ''} alt={t('aiGenerate.firstFrame')} />
                                ) : (
                                  <div className={styles.uploadPlaceholder}>
                                    <span className={styles.uploadIcon}>+</span>
                                    <span className={styles.uploadText}>{t('aiGenerate.uploadImage')}</span>
                                  </div>
                                )}
                                <input type="file" accept="image/*" ref={firstFrameInputRef} onChange={handleFirstFrameChange} style={{ display:'none' }} />
                              </div>
                            )}
                            
                            {/* 多图合成视频 - 需要多张图片 */}
                            {isMultiImage2Video && supported.includes('image') && (
                              <div className={styles.multiImageUpload}>
                                <div className={styles.uploadCard} onClick={() => firstFrameInputRef.current?.click()}>
                                  <div className={styles.uploadPlaceholder}>
                                    <span className={styles.uploadIcon}>+</span>
                                    <span className={styles.uploadText}>{t('aiGenerate.addImage' as any)}</span>
                                  </div>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    multiple 
                                    ref={firstFrameInputRef} 
                                    onChange={handleMultiImageChange} 
                                    style={{ display:'none' }} 
                                  />
                                </div>
                                
                                {videoImages.length > 0 && (
                                  <div className={styles.imageGrid}>
                                    {videoImages.map((img, index) => (
                                      <div key={index} className={styles.imageItem}>
                                        <img src={img} alt={`${t('aiGenerate.image' as any)} ${index + 1}`} />
                                        <button 
                                          className={styles.removeBtn} 
                                          onClick={() => handleRemoveImage(index)}
                                          title={t('aiGenerate.deleteImage' as any)}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {videoImages.length > 0 && (
                                  <button 
                                    className={styles.clearAllBtn} 
                                    onClick={handleClearAllImages}
                                    style={{ marginTop: 8, fontSize: '12px', color: '#ff4d4f' }}
                                  >
                                    {t('aiGenerate.clearAllImages' as any)}
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* 首尾帧生成视频 - 需要首帧和尾帧 */}
                            {isFlf2Video && supported.includes('image') && supported.includes('image_tail') && (
                              <>
                                <div className={styles.uploadCard} onClick={handlePickFirstFrame}>
                                  {videoImage ? (
                                    <img src={videoImage || ''} alt={t('aiGenerate.firstFrame')} />
                                  ) : (
                                    <div className={styles.uploadPlaceholder}>
                                      <span className={styles.uploadIcon}>+</span>
                                      <span className={styles.uploadText}>{t('aiGenerate.firstFrame')}</span>
                                    </div>
                                  )}
                                  <input type="file" accept="image/*" ref={firstFrameInputRef} onChange={handleFirstFrameChange} style={{ display:'none' }} />
                                </div>
                                <div className={styles.swapIcon}>↔</div>
                                <div className={styles.uploadCard} onClick={handlePickTailFrame}>
                                  {videoImageTail ? (
                                    <img src={videoImageTail || ''} alt={t('aiGenerate.tailFrame')} />
                                  ) : (
                                    <div className={styles.uploadPlaceholder}>
                                      <span className={styles.uploadIcon}>+</span>
                                      <span className={styles.uploadText}>{t('aiGenerate.tailFrame')}</span>
                                    </div>
                                  )}
                                  <input type="file" accept="image/*" ref={tailFrameInputRef} onChange={handleTailFrameChange} style={{ display:'none' }} />
                                </div>
                              </>
                            )}
                            
                            {/* 仅尾帧生成视频 - 只需要尾帧 */}
                            {isLf2Video && supported.includes('image_tail') && !supported.includes('image') && (
                              <div className={styles.uploadCard} onClick={handlePickTailFrame}>
                                {videoImageTail ? (
                                  <img src={videoImageTail || ''} alt={t('aiGenerate.tailFrame')} />
                                ) : (
                                  <div className={styles.uploadPlaceholder}>
                                    <span className={styles.uploadIcon}>+</span>
                                    <span className={styles.uploadText}>{t('aiGenerate.tailFrame')}</span>
                                  </div>
                                )}
                                <input type="file" accept="image/*" ref={tailFrameInputRef} onChange={handleTailFrameChange} style={{ display:'none' }} />
                              </div>
                            )}
                          </div>
                        )}
                      </>); 
                    })()}
                  </div>
                  {videoModel && videoDuration && videoSize && (
                    <div className={styles.creditCostInfo}><span style={{ color:'#1890ff', fontSize:14 }}>💰 {t('aiGenerate.estimatedCreditCost' as any)}: {getVideoModelCreditCost(videoModel, videoDuration, videoSize)} {t('aiGenerate.credits' as any)}</span></div>
                  )}
                  <Button type="primary" onClick={handleVideoGeneration} loading={loadingVideo} disabled={!videoPrompt || !videoModel} icon={<VideoCameraOutlined />}>{t('aiGenerate.generate')}</Button>
                </div>

                <div className={styles.rightPanel}>
                  {(videoStatus || videoResult) ? (
                    <div className={styles.result}>
                      {videoStatus && (
                        <div style={{ marginBottom:16 }}>
                          <div style={{ marginBottom:8 }}>
                            <strong>{t('aiGenerate.taskStatus')}: </strong>
                            {videoStatus === 'submitted' && t('aiGenerate.taskSubmitted')}
                            {videoStatus === 'processing' && t('aiGenerate.taskProcessing')}
                            {videoStatus === 'completed' && t('aiGenerate.taskCompleted')}
                            {videoStatus === 'failed' && t('aiGenerate.taskFailed')}
                          </div>
                          {videoProgress>0 && videoProgress<100 && (<Progress percent={videoProgress} status="active" />)}
                        </div>
                      )}
                      {/* {videoResult && (
                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                          <video src={getOssUrl(videoResult)} controls style={{ maxWidth:'100%', borderRadius:8 }} />
                          <Button type="primary" onClick={()=>handleUploadToMediaGroup('video')} icon={<UploadOutlined />} style={{ padding:'1px' }}>{t('aiGenerate.uploadToMediaGroup')}</Button>
                        </div>
                      )} */}
                    </div>
                  ) : (
                    <div className={styles.result}>
                      <video src={`https://aitoearn.s3.ap-southeast-1.amazonaws.com/68abbe6af812ccb3e1a53d68/8470f98a0733248851cd84cc0d9fb319aitoearn-demo.mp4`} controls style={{ width:'100%', maxWidth:'1200px', borderRadius:8 }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 视频历史记录区域 */}
          {activeModule === "video" && (
            <div className={styles.historySection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{t('aiGenerate.videoGenerationHistory' as any)}</h3>
                <Button 
                  onClick={fetchVideoHistory} 
                  loading={loadingHistory}
                  size="small"
                  type="primary"
                >
                  {t('aiGenerate.refresh' as any)}
                </Button>
              </div>
              
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  {t('aiGenerate.loading' as any)}
                </div>
              ) : videoHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  {t('aiGenerate.noHistoryRecords' as any)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {videoHistory.map((item, index) => (
                    <div 
                      key={item.task_id || index}
                      style={{ 
                        border: '1px solid #e8e8e8', 
                        borderRadius: 12, 
                        padding: 16, 
                        cursor: 'pointer',
                        // backgroundColor: item.status === 'SUCCESS' ? '#f6ffed' : item.status === 'FAILED' ? '#fff2f0' : '#fafafa',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onClick={() => handleHistoryItemClick(item)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff' }}>
                          {item.task_id ? `#${item.task_id.slice(-8)}` : `#${index + 1}`}
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          padding: '4px 8px', 
                          borderRadius: '6px',
                          backgroundColor: item.status === 'SUCCESS' ? '#52c41a' : item.status === 'FAILED' ? '#ff4d4f' : '#1890ff',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {getStatusText(item.status)}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: 8 }}>
                        <div style={{ marginBottom: 4 }}>
                          <strong>{t('aiGenerate.submitTime' as any)}:</strong> {formatTime(item.submit_time)}
                        </div>
                        {item.finish_time && (
                          <div style={{ marginBottom: 4 }}>
                            <strong>{t('aiGenerate.completeTime' as any)}:</strong> {formatTime(item.finish_time)}
                          </div>
                        )}
                       
                      </div>
                      
           
                      
                      {item.progress && (
                        <div style={{ fontSize: '13px', color: '#1890ff', marginBottom: 8 }}>
                          <strong>{t('aiGenerate.progress' as any)}:</strong> {item.progress}
                        </div>
                      )}
                      
                      {item.fail_reason && item.status === 'FAILED' && (
                        <div style={{ fontSize: '13px', color: '#ff4d4f', marginBottom: 8 }}>
                          <strong>{t('aiGenerate.failReason' as any)}:</strong> {item.fail_reason}
                        </div>
                      )}
                      
                      {item.data?.video_url && item.status === 'SUCCESS' && (
                        <div style={{ marginTop: 12 }}>
                          <video 
                            src={getOssUrl(item.data.video_url)} 
                            controls 
                            style={{ 
                              width: '100%', 
                              borderRadius: 8,
                              maxHeight: '200px',
                              objectFit: 'cover'
                            }} 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </div>
      </div>

      {/* VIP弹窗 */}
      <VipContentModal 
          open={vipModalOpen}   
          onClose={() => setVipModalOpen(false)} 
        />

      <Modal title={t("aiGenerate.selectMediaGroup")} open={uploadModalVisible} onOk={handleUploadConfirm} onCancel={()=>setUploadModalVisible(false)} confirmLoading={uploading}>
        <Select placeholder={t("aiGenerate.selectMediaGroupPlaceholder")} value={selectedMediaGroup} onChange={setSelectedMediaGroup} style={{ width: "100%" }} loading={loadingMediaGroups}>
          {mediaGroups.map((g:any)=> (<Option key={g._id} value={g._id}>{g.title} - {g.type}</Option>))}
        </Select>
      </Modal>
    </div>
  );
}



