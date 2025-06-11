"use client";

import { useTransClient } from "@/app/i18n/client";
import { useAccountStore } from "@/store/account";
import { useEffect, useState } from "react";
import { apiInitBilibiliVideo, apiUploadBilibiliCover, apiSubmitBilibiliArchive, apiUploadBilibilivideo } from "@/api/bilibili";
import { getAccountListApi } from "@/api/account";

interface Account {
  id: string;
  type: string;
  nickname: string;
  avatar: string;
}

export const DemoPageCore = () => {
  const { t } = useTransClient("demo");
  const accountStore = useAccountStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [uploadToken, setUploadToken] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    const fetchAccounts = async () => {
      const result = await getAccountListApi();
      console.log('accountList', result);
      if (result?.code === 0 && result?.data) {
        setAccounts(result.data);
      }
    };
    fetchAccounts();
  }, []);

  const handleInitVideo = async (accountId: string) => {
    try {
      const res:any = await apiInitBilibiliVideo({accountId,name:'files.mp4'});
      if (res?.data?.data) {
        setUploadToken(res.data.data);
        console.log('获取上传token成功:', res.data.data);
      }
    } catch (error) {
      console.error('获取上传token失败:', error);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!uploadToken) {
      console.error('请先获取上传token');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiUploadBilibilivideo(uploadToken, formData);
      if (res?.code === 0) {
        console.log('视频上传成功:', res);
        return true;
      } else {
        throw new Error('视频上传失败');
      }
    } catch (error) {
      console.error('视频上传失败:', error);
      return false;
    }
  };

  const handleUploadCover = async (accountId: string) => {
    if (!coverFile) {
      console.error('请选择封面文件');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('file', coverFile);
      const res:any = await apiUploadBilibiliCover(accountId, formData);
      if (res?.data?.url) {
        console.log('封面上传成功:', res.data.url);
        return res.data.url;
      }
      return null;
    } catch (error) {
      console.error('封面上传失败:', error);
      return null;
    }
  };

  const handleSubmitArchive = async (accountId: string) => {
    try {
      const coverUrl = await handleUploadCover(accountId);
      if (!coverUrl) {
        console.error('封面上传失败，无法提交稿件');
        return;
      }

      const archiveData = {
        title: "测试视频标题",
        cover: coverUrl,
        tid: 1,
        noReprint: 0,
        desc: "测试视频描述",
        tag: ["测试", "视频"],
        copyright: 0,
        source: "测试来源"
      };

      const res = await apiSubmitBilibiliArchive(accountId, archiveData);
      console.log('稿件提交结果:', res);
    } catch (error) {
      console.error('稿件提交失败:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'cover') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'video') {
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
            <p>头像: <img src={account.avatar} alt="avatar" width={50} height={50} /></p>
            <button onClick={() => handleInitVideo(account.id)}>获取上传Token</button>
            
            <div style={{ marginTop: '10px' }}>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(e, 'video')}
              />
              {selectedFile && (
                <button onClick={() => handleVideoUpload(selectedFile)}>
                  上传视频
                </button>
              )}
            </div>

            <div style={{ marginTop: '10px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'cover')}
              />
              {coverFile && (
                <button onClick={() => handleUploadCover(account.id)}>
                  上传封面
                </button>
              )}
            </div>

            <div style={{ marginTop: '10px' }}>
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
