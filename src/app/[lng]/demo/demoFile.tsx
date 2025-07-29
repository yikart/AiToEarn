"use client";

import React, { useState } from "react";
import {
  apiInitiateMultipartUpload,
  apiUploadPart,
  apiUploadPartComplete,
} from "@/api/file";

export const DemoFile = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedParts, setUploadedParts] = useState<
    { PartNumber: number; ETag: string }[]
  >([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setUploadedParts([]);

    try {
      // 1. 初始化分片上传
      const initResponse = await apiInitiateMultipartUpload({
        fileName: file.name,
        secondPath: "uploads", // 根据需要调整路径
        fileSize: file.size,
        contentType: file.type || "application/octet-stream",
      });
      if (!initResponse) {
        throw new Error("初始化上传失败");
      }

      const { fileId, uploadId } = initResponse.data;
      console.log("初始化上传成功:", fileId, uploadId);

      // 2. 分片上传文件
      const chunkSize = 5 * 1024 * 1024; // 5MB per chunk
      const chunks = Math.ceil(file.size / chunkSize);
      const parts = [];

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        // 上传分片
        const partResponse = await apiUploadPart(
          fileId,
          uploadId,
          i + 1,
          chunk,
        );
        if (!partResponse) {
          throw new Error("分片上传失败");
        }

        parts.push({
          PartNumber: partResponse.data.PartNumber,
          ETag: partResponse.data.ETag,
        });

        // 更新进度
        const currentProgress = Math.round(((i + 1) / chunks) * 100);
        setProgress(currentProgress);
        console.log(`分片 ${i + 1}/${chunks} 上传完成`);
      }

      setUploadedParts(parts);

      // 3. 完成分片上传
      await apiUploadPartComplete({
        fileId: fileId,
        uploadId,
        parts,
      });

      alert("文件上传成功！");
    } catch (error) {
      console.error("文件上传失败:", error);
      alert("文件上传失败！");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">分片文件上传</h2>

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
          <p>
            <span className="font-medium">文件名:</span> {file.name}
          </p>
          <p>
            <span className="font-medium">文件大小:</span>{" "}
            {Math.round(file.size / 1024)} KB
          </p>
          <p>
            <span className="font-medium">文件类型:</span> {file.type || "未知"}
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

          {uploadedParts.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              已完成 {uploadedParts.length} 个分片上传
            </div>
          )}
        </div>
      )}
    </div>
  );
};
