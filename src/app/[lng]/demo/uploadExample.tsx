"use client";

import React, { useState } from "react";
import { uploadToOss } from "@/api/oss";
import { toolsApi } from "@/api/tools";

export const UploadExample = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadType, setUploadType] = useState<'oss' | 'temp'>('oss');
  const [result, setResult] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setResult('');

    try {
      let key: string;
      
      if (uploadType === 'oss') {
        // 使用 uploadToOss
        key = await uploadToOss(file, (prog) => {
          setProgress(prog);
        });
      } else {
        // 使用 uploadFileTemp
        key = await toolsApi.uploadFileTemp(file, (prog) => {
          setProgress(prog);
        });
      }

      setResult(`上传成功！文件Key: ${key}`);
      console.log('上传成功:', key);
    } catch (error) {
      console.error("上传失败:", error);
      setResult(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">文件上传示例</h2>
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          选择上传类型
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="oss"
              checked={uploadType === 'oss'}
              onChange={(e) => setUploadType(e.target.value as 'oss')}
              className="mr-2"
            />
            OSS上传
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="temp"
              checked={uploadType === 'temp'}
              onChange={(e) => setUploadType(e.target.value as 'temp')}
              className="mr-2"
            />
            临时上传
          </label>
        </div>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          选择文件
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {file && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">文件信息:</h3>
          <p><span className="font-medium">文件名:</span> {file.name}</p>
          <p><span className="font-medium">文件大小:</span> {formatFileSize(file.size)}</p>
          <p><span className="font-medium">文件类型:</span> {file.type || "未知"}</p>
          <p className="mt-2 text-sm text-gray-600">
            {file.size > 10 * 1024 * 1024 
              ? "⚠️ 文件大于10MB，将使用分片上传" 
              : "✅ 文件小于10MB，将使用普通上传"}
          </p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
      >
        {uploading ? "上传中..." : "开始上传"}
      </button>

      {uploading && (
        <div className="mt-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">上传进度</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {result && (
        <div className={`mt-6 p-4 rounded-lg ${
          result.includes('成功') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <p className="font-medium">{result}</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium mb-2 text-blue-800">功能说明:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 文件小于10MB：使用普通上传</li>
          <li>• 文件大于10MB：自动使用分片上传（5MB/片）</li>
          <li>• 支持进度回调，实时显示上传进度</li>
          <li>• 支持OSS上传和临时上传两种方式</li>
        </ul>
      </div>
    </div>
  );
};
