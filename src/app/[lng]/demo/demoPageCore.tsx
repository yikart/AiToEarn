"use client";

import { useTransClient } from "@/app/i18n/client";
import { useAccountStore } from "@/store/account";
import { useEffect, useState } from "react";
import {
  apiInitBilibiliVideo,
  apiUploadBilibiliCover,
  apiSubmitBilibiliArchive,
  apiUploadBilibilivideo,
  apiUploadBilibiliVideoPart,
  apiCompleteBilibiliVideo,
  apiGetBilibiliPartitions,
} from "@/api/bilibili";
import { getAccountListApi } from "@/api/account";
import { calculateChunks, readBlobRange } from "@/app/plat/plat.util";

interface Account {
  id: string;
  type: string;
  nickname: string;
  avatar: string;
}

interface Partition {
  id: number;
  name: string;
  description: string;
  parent: number;
  children?: Partition[];
}

export const DemoPageCore = () => {
  const { t } = useTransClient("demo");
  const accountStore = useAccountStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [uploadToken, setUploadToken] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileBlockSize = 4194304; // 4MB per chunk
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [selectedPartition, setSelectedPartition] = useState<number>(21); // 默认选择日常分区

  useEffect(() => {
    const fetchAccounts = async () => {
      const result = await getAccountListApi();
      console.log("accountList", result);
      if (result?.code === 0 && result?.data) {
        setAccounts(result.data);

        const res = await fetchPartitions(result.data[0].id);
        console.log("------ rew", res);
      }
    };
    fetchAccounts();
  }, []);

  const handleInitVideo = async (accountId: string) => {
    try {
      const res: any = await apiInitBilibiliVideo({
        accountId,
        name: "files.mp4",
      });
      if (res?.data?.data) {
        const token = res.data.data;
        setUploadToken(token);
        console.log("获取上传token成功:", token);
        // 获取分区列表
      }
    } catch (error) {
      console.error("获取上传token失败:", error);
    }
  };

  const fetchPartitions = async (token: string) => {
    try {
      const res: any = await apiGetBilibiliPartitions(token);
      if (res?.code === 0 && res?.data?.data) {
        setPartitions(res.data.data);
      }
    } catch (error) {
      console.error("获取分区列表失败:", error);
    }
  };

  const handleVideoUpload = async (accountId: string, file: File) => {
    if (!uploadToken) {
      console.error("请先获取上传token");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiUploadBilibilivideo(
        accountId,
        uploadToken,
        formData,
      );
      if (res?.code === 0) {
        console.log("视频上传成功:", res);
        return true;
      } else {
        throw new Error("视频上传失败");
      }
    } catch (error) {
      console.error("视频上传失败:", error);
      return false;
    }
  };

  const handleChunkedVideoUpload = async (accountId: string, file: File) => {
    if (!uploadToken) {
      console.error("请先获取上传token");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // 计算分片
      const chunkRange = calculateChunks(file.size, fileBlockSize);
      console.log(`文件将被分为 ${chunkRange.length} 个分片`);

      // 分片上传
      for (let i = 0; i < chunkRange.length; i++) {
        const range = chunkRange[i];
        // 获取要上传的视频分片
        // const chunk = await readBlobRange(file, range.start, range.end);
        const sliced = file.slice(range.start, range.end);
        // const blob = new Blob([chunk], { type: "application/octet-stream" });
        console.log("上传分片:", sliced);

        // 上传分片
        const res = await apiUploadBilibiliVideoPart(
          accountId,
          uploadToken,
          i + 1,
          sliced,
        );
        if (res?.code !== 0) {
          throw new Error(`分片 ${i} 上传失败`);
        }

        // 更新进度
        const progress = Math.round(((i + 1) / chunkRange.length) * 100);
        setUploadProgress(progress);
        console.log(
          `分片 ${i + 1}/${chunkRange.length} 上传成功，总进度：${progress}%`,
        );
      }

      // 合并分片
      console.log("开始合并分片...");
      const completeRes = await apiCompleteBilibiliVideo(
        accountId,
        uploadToken,
      );
      if (completeRes?.code !== 0) {
        throw new Error("分片合并失败");
      }

      console.log("视频上传完成");
      setUploadProgress(100);
      return true;
    } catch (error) {
      console.error("视频上传失败:", error);
      setUploadProgress(-1);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadCover = async (accountId: string) => {
    if (!coverFile) {
      console.error("请选择封面文件");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("file", coverFile);
      const res: any = await apiUploadBilibiliCover(accountId, formData);
      if (res?.data) {
        console.log("封面上传成功:", res.data);
        // 保存封面地址
        setCoverUrl(res.data.url);
        return res.data;
      }
      return null;
    } catch (error) {
      console.error("封面上传失败:", error);
      return null;
    }
  };

  const handleSubmitArchive = async (accountId: string) => {
    try {
      const archiveData = {
        title: "看看我的车阿达",
        cover: coverUrl,
        tid: selectedPartition,
        noReprint: 0,
        desc: "vv7维修保安上课方式大健康",
        tag: ["vv7", "clientDome"],
        copyright: 1,
      };

      const res = await apiSubmitBilibiliArchive(uploadToken, archiveData);
      console.log("稿件提交结果:", res);
    } catch (error) {
      console.error("稿件提交失败:", error);
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "video" | "cover",
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === "video") {
        setSelectedFile(file);
      } else {
        setCoverFile(file);
      }
    }
  };

  return (
    <div>
      <div>{t("demoText")}</div>
      <div>
        <h3>账户列表：</h3>
        {accounts.map((account) => (
          <div key={account.id}>
            <p>平台: {account.type}</p>
            <p>昵称: {account.nickname}</p>
            <p>
              头像:{" "}
              <img src={account.avatar} alt="avatar" width={50} height={50} />
            </p>
            <button onClick={() => handleInitVideo(account.id)}>
              获取上传Token
            </button>

            <div style={{ marginTop: "10px" }}>
              <p>上传视频</p>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(e, "video")}
                disabled={isUploading}
              />
              {selectedFile && (
                <>
                  <button
                    onClick={() => handleVideoUpload(account.id, selectedFile)}
                    disabled={isUploading}
                  >
                    普通上传
                  </button>
                  <button
                    onClick={() =>
                      handleChunkedVideoUpload(account.id, selectedFile)
                    }
                    disabled={isUploading}
                  >
                    分片上传
                  </button>
                  {uploadProgress > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <div
                        style={{
                          width: "100%",
                          height: "20px",
                          backgroundColor: "#f0f0f0",
                          borderRadius: "10px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${uploadProgress}%`,
                            height: "100%",
                            backgroundColor: "#1890ff",
                            transition: "width 0.3s ease-in-out",
                          }}
                        />
                      </div>
                      <p>上传进度: {uploadProgress}%</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ marginTop: "10px" }}>
              <p>上传封面</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "cover")}
              />
              {coverFile && (
                <button onClick={() => handleUploadCover(account.id)}>
                  上传封面
                </button>
              )}
            </div>

            <div style={{ marginTop: "10px" }}>
              <p>选择分区：</p>
              <select
                value={selectedPartition}
                onChange={(e) => setSelectedPartition(Number(e.target.value))}
                style={{ marginBottom: "10px" }}
              >
                {partitions &&
                  partitions.map((partition) => (
                    <optgroup key={partition.id} label={partition.name}>
                      {partition.children?.map((child: Partition) => (
                        <option key={child.id} value={child.id}>
                          {child.name} - {child.description}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
            </div>

            <div style={{ marginTop: "10px" }}>
              <button onClick={() => handleSubmitArchive(account.id)}>
                提交稿件
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
