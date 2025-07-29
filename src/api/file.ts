import { request } from "@/utils/request";

export const apiInitiateMultipartUpload = (data: {
  fileName: string;
  secondPath: string;
  fileSize: number;
  contentType: string;
}) => {
  return request<{
    fileId: string;
    uploadId: string;
  }>({
    url: "/file/uploadPart/init",
    method: "POST",
    data,
  });
};

export const apiUploadPart = (
  fileId: string,
  uploadId: string,
  partNumber: number,
  file: Blob,
) => {
  const formData = new FormData();
  formData.append("file", file);
  return request<{
    ETag: string;
    PartNumber: number;
  }>({
    url: "/file/uploadPart/upload",
    method: "POST",
    data: formData,
    params: {
      fileId,
      uploadId,
      partNumber,
    },
  });
};

export const apiUploadPartComplete = (data: {
  fileId: string;
  uploadId: string;
  parts: { PartNumber: number; ETag: string }[];
}) => {
  return request({
    url: "/file/uploadPart/complete",
    method: "POST",
    data,
  });
};
