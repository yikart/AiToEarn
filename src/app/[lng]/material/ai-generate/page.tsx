"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { message, Input, Button, Select, Row, Col, Modal, Progress } from "antd";
import { ArrowLeftOutlined, RobotOutlined, FireOutlined, PictureOutlined, FileTextOutlined, UploadOutlined, VideoCameraOutlined, DownloadOutlined } from "@ant-design/icons";
import styles from "./ai-generate.module.scss";
import { generateImage, generateFireflyCard, getImageGenerationModels, generateVideo, getVideoTaskStatus, getVideoGenerationModels, generateMd2Card } from "@/api/ai";
import { getOssUrl } from "@/utils/oss";
import { uploadToOss } from "@/api/oss";
import { getMediaGroupList, createMedia } from "@/api/media";
import { useTransClient } from "@/app/i18n/client";
import { md2CardTemplates, defaultMarkdown } from "./md2card";

const { TextArea } = Input;
const { Option } = Select;

import shili21 from '@/assets/images/shili/image-ai-sample-2-1.webp';
import shili22 from '@/assets/images/shili/image-ai-sample-2-2.jpeg';
import shili23 from '@/assets/images/shili/image-ai-sample-2-3.jpeg';
import shili24 from '@/assets/images/shili/image-ai-sample-2-4.jpeg';


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

  // 默认图片页签
  const defaultTab = (searchParams.get("tab") || "textToImage") as "textToImage" | "textToFireflyCard" | "md2card";
  // 左侧模块切换
  const [activeModule, setActiveModule] = useState<"image" | "video">("image");
  // 图片子模块切换
  const [activeImageTab, setActiveImageTab] = useState<"textToImage" | "textToFireflyCard" | "md2card">(defaultTab);
  // 视频子模块切换
  const [activeVideoTab, setActiveVideoTab] = useState<"text2video" | "image2video">("text2video");

  // 文生图
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [n, setN] = useState(1);
  const [quality, setQuality] = useState<"standard" | "hd">("standard");
  const [style, setStyle] = useState<"vivid" | "natural">("vivid");
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);

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
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoTaskId, setVideoTaskId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>("");
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

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

  const [imageModels, setImageModels] = useState<any[]>([]);
  const [videoModels, setVideoModels] = useState<any[]>([]);

  // 自定义模型下拉
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // 示例轮播
  const sampleImages = [shili21 as any, shili22 as any, shili23 as any, shili24 as any];
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

  const getVideoModelCreditCost = (modelName: string, duration: number, size: string): number => {
    const m = videoModels.find((v) => v.name === modelName);
    const item = m?.pricing?.find((p: any) => p.duration === duration && p.resolution === size);
    return item ? item.price : 0;
  };

  const filteredVideoModels = useMemo(() => {
    if (!Array.isArray(videoModels)) return [] as any[];
    if (videoMode === "text2video") return (videoModels as any[]).filter((m: any) => (m?.modes || []).includes("text2video"));
    return (videoModels as any[]).filter((m: any) => (m?.modes || []).includes("image2video"));
  }, [videoModels, videoMode]);

  const fetchImageModels = async () => {
    try { const res: any = await getImageGenerationModels(); if (res.data) { setImageModels(res.data); if (res.data.length) setModel(res.data[0].name); } }
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
          if (first?.modes?.includes("image2video")) setVideoMode("image2video");
          else if (first?.modes?.includes("text2video")) setVideoMode("text2video");
        }
      }
    } catch (e) { console.error(e); }
  };
  useEffect(() => { fetchImageModels(); fetchVideoModels(); }, []);

  useEffect(() => {
    if ((filteredVideoModels as any[]).length > 0) {
      if (!(filteredVideoModels as any[]).find((m: any) => m.name === videoModel)) {
        setVideoModel((filteredVideoModels as any[])[0].name);
      }
    }
    if (videoMode === "text2video") { setVideoImage(""); setVideoImageTail(""); }
  }, [videoMode, filteredVideoModels]);

  useEffect(() => {
    if (!videoModel || !videoModels?.length) return;
    const current: any = (videoModels as any[]).find((m: any) => m.name === videoModel);
    if (!current) return;
    const { durations = [], resolutions = [], supportedParameters = [] } = current || {};
    if (durations.length && !durations.includes(videoDuration)) setVideoDuration(durations[0]);
    if (resolutions.length && !resolutions.includes(videoSize)) setVideoSize(resolutions[0]);
    if (!supportedParameters.includes("image") && videoImage) setVideoImage("");
    if (!supportedParameters.includes("image_tail") && videoImageTail) setVideoImageTail("");
  }, [videoModel, videoModels]);

  const fetchMediaGroups = async (type: "video" | "img" = "img") => {
    try { setLoadingMediaGroups(true); const res: any = await getMediaGroupList(1, 100, type); if (res.data) setMediaGroups(res.data.list || []); }
    catch { message.error(t("aiGenerate.getMediaGroupListFailed")); }
    finally { setLoadingMediaGroups(false); }
  };

  const handleTextToImage = async () => {
    if (!prompt) { message.error(t("aiGenerate.pleaseEnterPrompt")); return; }
    try {
      setLoading(true);
      const res: any = await generateImage({ prompt, n, quality, style, size, model, response_format: "url" });
      if (res.data?.list) setResult(res.data.list.map((i: any) => i.url)); else message.error(t("aiGenerate.imageGenerationFailed"));
    } catch { message.error(t("aiGenerate.imageGenerationFailed")); } finally { setLoading(false); }
  };

  const handleTextToFireflyCard = async () => {
    if (!content || !title) { message.error(t("aiGenerate.pleaseEnterContentAndTitle")); return; }
    try { setLoadingFirefly(true); const res: any = await generateFireflyCard({ content, temp, title }); if (res.data?.image) setFireflyResult(res.data.image); else message.error(t("aiGenerate.fireflyCardGenerationFailed")); }
    catch { message.error(t("aiGenerate.fireflyCardGenerationFailed")); } finally { setLoadingFirefly(false); }
  };

  const handleVideoGeneration = async () => {
    if (!videoPrompt) { message.error(t("aiGenerate.pleaseEnterVideoDescription")); return; }
    if (!videoModel) { message.error(t("aiGenerate.pleaseSelectVideoModel")); return; }
    if (videoMode === "image2video") {
      const current: any = (filteredVideoModels as any[]).find((m: any) => m.name === videoModel) || {};
      const supported: string[] = current?.supportedParameters || [];
      if (supported.includes("image") && !videoImage) { message.error(t("aiGenerate.pleaseUploadFirstFrame")); return; }
      if (supported.includes("image_tail") && !videoImageTail) { message.error(t("aiGenerate.pleaseUploadTailFrame")); return; }
    }
    try {
      setLoadingVideo(true); setVideoStatus("submitted"); setVideoProgress(10);
      const data: any = { model: videoModel, prompt: videoPrompt, size: videoSize, duration: videoDuration };
      const current: any = (filteredVideoModels as any[]).find((m: any) => m.name === videoModel) || {};
      const supported: string[] = current?.supportedParameters || [];
      if (videoMode === "image2video") {
        if (supported.includes("image") && videoImage) data.image = videoImage;
        if (supported.includes("image_tail") && videoImageTail) data.image_tail = videoImageTail;
      }
      const res: any = await generateVideo(data);
      if (res.data?.task_id) { setVideoTaskId(res.data.task_id); setVideoStatus(res.data.status); message.success(t("aiGenerate.taskSubmittedSuccess")); pollVideoTaskStatus(res.data.task_id); }
      else { message.error(t("aiGenerate.videoGenerationFailed")); setVideoStatus(""); }
    } catch { message.error(t("aiGenerate.videoGenerationFailed")); setVideoStatus(""); } finally { setLoadingVideo(false); }
  };

  const pollVideoTaskStatus = async (taskId: string) => {
    const checkStatus = async () => {
      try {
        setCheckingStatus(true);
        const res: any = await getVideoTaskStatus(taskId);
        if (res.data) {
          const { status, fail_reason, progress } = res.data;
          const up = typeof status === "string" ? status.toUpperCase() : "";
          const normalized = up === "SUCCESS" ? "completed" : up === "FAILED" ? "failed" : up === "PROCESSING" ? "processing" : up === "NOT_START" || up === "NOT_STARTED" || up === "QUEUED" || up === "PENDING" ? "submitted" : (status || "").toString().toLowerCase();
          setVideoStatus(normalized);
          let percent = 0;
          if (typeof progress === "string") { const m = progress.match(/(\d+)/); percent = m ? Number(m[1]) : 0; }
          else if (typeof progress === "number") { percent = progress > -1 ? Math.round(progress) : Math.round(progress * 100); }
          if (normalized === "completed") { setVideoResult(fail_reason); setVideoProgress(100); message.success(t("aiGenerate.videoGenerationSuccess")); return true; }
          if (normalized === "failed") { setVideoProgress(0); message.error(fail_reason || t("aiGenerate.videoGenerationFailed")); return true; }
          setVideoProgress(percent); return false;
        }
          return false;
      } catch { return false; } finally { setCheckingStatus(false); }
    };
    const poll = async () => { const done = await checkStatus(); if (!done) setTimeout(poll, 5000); };
    poll();
  };

  const handleMd2CardGeneration = async () => {
    if (!markdownContent) { message.error(t("aiGenerate.pleaseEnterMarkdown")); return; }
    try { setLoadingMd2Card(true); const res: any = await generateMd2Card({ markdown: markdownContent, theme: selectedTheme, themeMode, width: cardWidth, height: cardHeight, splitMode, mdxMode, overHiddenMode }); if (res.data?.images?.length) setMd2CardResult(res.data.images[0].url); else message.error(t("aiGenerate.cardGenerationFailed")); }
    catch { message.error(t("aiGenerate.cardGenerationFailed")); } finally { setLoadingMd2Card(false); }
  };

  const [currentUploadUrl, setCurrentUploadUrl] = useState<string | null>(null);
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
                <div className="subTabLabel">{t("aiGenerate.textToImage")}</div>
              </button>
              <button className={`${styles.subTab} ${activeImageTab==='textToFireflyCard' ? styles.subTabActive : ''}`} onClick={()=>setActiveImageTab('textToFireflyCard')}>
                <div className="subTabIcon"><FireOutlined /></div>
                <div className="subTabLabel">{t("aiGenerate.fireflyCard")}</div>
              </button>
              <button className={`${styles.subTab} ${activeImageTab==='md2card' ? styles.subTabActive : ''}`} onClick={()=>setActiveImageTab('md2card')}>
                <div className="subTabIcon"><FileTextOutlined /></div>
                <div className="subTabLabel">{t("aiGenerate.markdownToCard")}</div>
              </button>
      </div>
          )}

          {activeModule === "video" && (
            <div className={styles.imageSubTabs}>
              <button className={`${styles.subTab} ${activeVideoTab==='text2video' ? styles.subTabActive : ''}`} onClick={()=>setActiveVideoTab('text2video')}>
                <div className="subTabIcon"><VideoCameraOutlined /></div>
                <div className="subTabLabel">{t('aiGenerate.textToVideo')}</div>
              </button>
              <button className={`${styles.subTab} ${activeVideoTab==='image2video' ? styles.subTabActive : ''}`} onClick={()=>setActiveVideoTab('image2video')}>
                <div className="subTabIcon"><PictureOutlined /></div>
                <div className="subTabLabel">{t('aiGenerate.imageToVideo')}</div>
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
                          <div className={styles.modelIcon}><PictureOutlined /></div>
                          <div className={styles.modelMain}>
                            <div className={styles.modelHeader}>
                              <span className={styles.modelName}>{model || t('aiGenerate.selectModelPlaceholder')}</span>
                            </div>
                            <div className={styles.modelDesc}>{(() => { const m:any = imageModels.find((x:any)=>x.name===model); return m?.desc || ''; })()}</div>
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
                                    <div className={styles.modelIcon}><PictureOutlined /></div>
                                    <div className={styles.modelMain}>
                                      <div className={styles.modelHeader}>
                                        <span className={styles.modelName}>{m.name || ''}</span>
                                        {m.latest ? <span className={styles.modelTag}>最新</span> : null}
                                      </div>
                                      <div className={styles.modelDesc}>{m.desc || ''}</div>
                                      <div className={styles.modelMeta}>{m.eta || ''}</div>
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
                        {['延时绽放','绚丽花朵','海底世界','星空漫游','赛博城市'].map((w)=> (
                          <span key={w} className={styles.exampleChip} onClick={()=>setPrompt(w)}>{w}</span>
                        ))}
                      </div>

                      <div className={styles.blockTitle} style={{ marginTop: 6 }}>高级选项</div>
                <div className={styles.dimensions}>
                        <Select value={size} onChange={setSize} style={{ width: '100%' }}>
                    <Option value="1024x1024">1024x1024</Option>
                    <Option value="1792x1024">1792x1024</Option>
                    <Option value="1024x1792">1024x1792</Option>
                  </Select>
                      </div>
                      <div className={styles.pillRow}>
                        <div className={styles.blockTitle} style={{ marginBottom: 6 }}>输出图像数量</div>
                        <div className={styles.pillGroupBox}>
                          <div className={styles.pillGroup}>
                            {[1,2,3,4].map((num)=> (
                              <button key={num} className={`${styles.pill} ${n===num?styles.pillActive:''}`} onClick={()=>setN(num)}>{num}</button>
                            ))}
                          </div>
                        </div>
                </div>
                <div className={styles.options}>
                        <Select value={quality} onChange={setQuality} style={{ width: '100%' }}>
                    <Option value="standard">{t('aiGenerate.standard')}</Option>
                    <Option value="hd">{t('aiGenerate.hd')}</Option>
                  </Select>
                        <Select value={style} onChange={setStyle} style={{ width: '100%' }}>
                    <Option value="vivid">{t('aiGenerate.vivid')}</Option>
                    <Option value="natural">{t('aiGenerate.natural')}</Option>
                  </Select>
                </div>
                      {model && (()=>{ const selected = imageModels.find((m:any)=>m.name===model); const credit = selected?.pricing ? parseFloat(selected.pricing) : 0; return credit>0 ? (<div className={styles.creditCostInfo}><span style={{color:'#1890ff',fontSize:'14px'}}>💰 {t('aiGenerate.estimatedCreditCost' as any)}: {credit} {t('aiGenerate.credits' as any)}</span></div>) : null; })()}
                      <Button type="primary" onClick={handleTextToImage} loading={loading} disabled={!prompt || !model} icon={<PictureOutlined />}>{t('aiGenerate.generate')}</Button>
                    </div>
                    <div className={styles.rightPanel}>
                      {result ? (
                <div className={styles.result}>
                          <Row gutter={[16,16]} justify={'center'}>
                            {result.map((img, idx)=>(
                              <Col key={idx} xs={24} sm={12} md={12} lg={12}>
                                <div className={styles.imageCard}>
                                  <img src={getOssUrl(img)} alt={`${t('aiGenerate.textToImage')} ${idx+1}`} />
                                  <div className={styles.imageActions}>
                                    <Button size="small" icon={<DownloadOutlined />} onClick={()=>handleDownloadUrl(img)} />
                                    <Button size="small" type="primary" onClick={()=>handleUploadToMediaGroup('img', img)} icon={<UploadOutlined />} />
                                  </div>
                                </div>
                      </Col>
                    ))}
                  </Row>
                        </div>
                      ) : (
                        <div className={styles.sampleCarousel}>
                          <div className={styles.sampleStage}>
                            <img src={sampleImages[sampleIdx].src || sampleImages[sampleIdx]} alt="sample" />
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
              <div className={styles.form}>
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
              {fireflyResult && (
                <div className={styles.result}>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        <img src={getOssUrl(fireflyResult)} alt={t('aiGenerate.fireflyCard')} style={{ maxWidth:'100%', borderRadius:8 }} />
                        <Button type="primary" onClick={()=>handleUploadToMediaGroup('img')} icon={<UploadOutlined />} style={{ padding:'1px' }}>{t("aiGenerate.uploadToMediaGroup")}</Button>
                  </div>
                </div>
              )}
            </div>
              )}

              {activeImageTab === 'md2card' && (
            <div className={styles.section}>
              <div className={styles.form}>
                    <TextArea placeholder={t("aiGenerate.markdownPlaceholder")} value={markdownContent} onChange={(e)=>setMarkdownContent(e.target.value)} rows={8} />
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
                  {md2CardResult && (
                    <div className={styles.result}>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        <img src={getOssUrl(md2CardResult)} alt={t('aiGenerate.markdownCard')} style={{ maxWidth:'100%', borderRadius:8 }} />
                        <Button type="primary" onClick={()=>handleUploadToMediaGroup('img')} icon={<UploadOutlined />} style={{ padding:'1px' }}>{t("aiGenerate.uploadToMediaGroup")}</Button>
                      </div>
                  </div>
                )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.section}>
              <div className={styles.form}>
                <TextArea placeholder={t("aiGenerate.videoPromptPlaceholder")} value={videoPrompt} onChange={(e)=>setVideoPrompt(e.target.value)} rows={4} />
                {(() => { if (videoMode !== activeVideoTab) setVideoMode(activeVideoTab); return null; })()}
                {Array.isArray(filteredVideoModels) && (filteredVideoModels as any[]).length>0 && (
                  <Select value={videoModel} onChange={setVideoModel} style={{ width: "100%" }}>
                    {(filteredVideoModels as any[]).map((m:any)=>{ const credit=getVideoModelCreditCost(m.name, videoDuration, videoSize); return (<Option key={m.name} value={m.name}>{m.name} {credit>0 && `(${t('aiGenerate.estimatedCreditCost' as any)} ${credit} ${t('aiGenerate.credits' as any)})`}</Option>); })}
                  </Select>
                )}
                <div className={styles.dimensions}>
                  <Select value={videoSize} onChange={setVideoSize} style={{ width: "100%" }}>{(()=>{ const selected:any=(filteredVideoModels as any[]).find((m:any)=>m.name===videoModel)||{}; const sizes:string[]=selected?.resolutions||[]; return sizes.map((s)=> (<Option key={s} value={s}>{s}</Option>)); })()}</Select>
                  <Select value={videoDuration} onChange={setVideoDuration} style={{ width: "100%" }}>{(()=>{ const selected:any=(filteredVideoModels as any[]).find((m:any)=>m.name===videoModel)||{}; const durs:number[]=selected?.durations||[]; return durs.map((d)=> (<Option key={d} value={d}>{d}{t('aiGenerate.seconds')}</Option>)); })()}</Select>
                </div>
                <div className={styles.options}>
                  {(()=>{ const selected:any=(filteredVideoModels as any[]).find((m:any)=>m.name===videoModel)||{}; const supported:string[]=selected?.supportedParameters||[]; return (<>
                    {videoMode==='image2video' && supported.includes('image') && (
                      <div style={{ display:'flex', alignItems:'center', gap:12, width:'100%' }}>
                        <Button onClick={handlePickFirstFrame} loading={uploadingFirstFrame}>{t('aiGenerate.uploadImage')} - {t('aiGenerate.firstFrame')}</Button>
                        {videoImage && (<img src={videoImage} alt={t('aiGenerate.firstFrame')} style={{ width:160, height:90, objectFit:'cover', borderRadius:6, border:'1px solid #eee' }} />)}
                        <input type="file" accept="image/*" ref={firstFrameInputRef} onChange={handleFirstFrameChange} style={{ display:'none' }} />
                          </div>
                        )}
                    {videoMode==='image2video' && supported.includes('image_tail') && (
                      <div style={{ display:'flex', alignItems:'center', gap:12, width:'100%' }}>
                        <Button onClick={handlePickTailFrame} loading={uploadingTailFrame}>{t('aiGenerate.uploadImage')} - {t('aiGenerate.tailFrame')}</Button>
                        {videoImageTail && (<img src={videoImageTail} alt={t('aiGenerate.tailFrame')} style={{ width:160, height:90, objectFit:'cover', borderRadius:6, border:'1px solid #eee' }} />)}
                        <input type="file" accept="image/*" ref={tailFrameInputRef} onChange={handleTailFrameChange} style={{ display:'none' }} />
                          </div>
                        )}
                  </>); })()}
                </div>
                {videoModel && videoDuration && videoSize && (
                  <div className={styles.creditCostInfo}><span style={{ color:'#1890ff', fontSize:14 }}>💰 {t('aiGenerate.estimatedCreditCost' as any)}: {getVideoModelCreditCost(videoModel, videoDuration, videoSize)} {t('aiGenerate.credits' as any)}</span></div>
                )}
                <Button type="primary" onClick={handleVideoGeneration} loading={loadingVideo} disabled={!videoPrompt || !videoModel} icon={<VideoCameraOutlined />}>{t("aiGenerate.generate")}</Button>
              </div>
              
              {(videoStatus || videoResult) && (
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
                  {videoResult && (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <video src={getOssUrl(videoResult)} controls style={{ maxWidth:'100%', borderRadius:8 }} />
                      <Button type="primary" onClick={()=>handleUploadToMediaGroup('video')} icon={<UploadOutlined />} style={{ padding:'1px' }}>{t('aiGenerate.uploadToMediaGroup')}</Button>
                    </div>
                  )}
                </div>
              )}
                </div>
              )}
            </div>
      </div>

      <Modal title={t("aiGenerate.selectMediaGroup")} open={uploadModalVisible} onOk={handleUploadConfirm} onCancel={()=>setUploadModalVisible(false)} confirmLoading={uploading}>
        <Select placeholder={t("aiGenerate.selectMediaGroupPlaceholder")} value={selectedMediaGroup} onChange={setSelectedMediaGroup} style={{ width: "100%" }} loading={loadingMediaGroups}>
          {mediaGroups.map((g:any)=> (<Option key={g._id} value={g._id}>{g.title} - {g.type}</Option>))}
        </Select>
      </Modal>
    </div>
  );
}



