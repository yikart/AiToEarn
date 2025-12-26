 "use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { useTransClient } from "@/app/i18n/client";
import { toast } from "@/lib/toast";
import { useAccountStore } from "@/store/account";
import { AccountPlatInfoMap } from "@/app/config/platConfig";
import { PubType } from "@/app/config/publishConfig";
import { uploadToOss } from "@/api/oss";

interface SharePreviewModalProps {
  open: boolean;
  onClose: () => void;
  blobs: Blob[];
  urls: string[]; // object URLs
  taskId: string;
}

export const SharePreviewModal = ({ open, onClose, blobs, urls, taskId }: SharePreviewModalProps) => {
  const { t } = useTransClient("share");
  const router = useRouter();
  const { accountList, getAccountList } = useAccountStore();
 

  const downloadBlobs = async () => {
    try {
      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i];
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = blobs.length === 1 ? `aitoearn_conversation_${taskId}.png` : `aitoearn_${taskId}_${i + 1}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      toast.success(t("download") || "Downloaded");
    } catch (e) {
      console.error(e);
      toast.error(t("downloadFailed") || "Download failed");
    }
  };

  const handleAgentShare = async () => {
    try {
      // upload blobs (if available) and get urls
      const targets = blobs && blobs.length > 0 ? blobs : [];
      let uploadedUrls: string[] = [];
      if (targets.length > 0) {
        for (let i = 0; i < targets.length; i++) {
          const file = new File([targets[i]], `aitoearn_export_${Date.now()}_${i}.png`, { type: targets[i].type || "image/png" });
          try {
            const url = await uploadToOss(file);
            uploadedUrls.push(url as string);
          } catch (err) {
            console.error("Upload failed for blob", err);
          }
        }
      }

      const payloadPrompt = t("agentSharePrompt") || "Share this image to social media. Copy write freely.";
      const params = new URLSearchParams();
      params.set("aiGenerated", "true");
      params.set("medias", encodeURIComponent(JSON.stringify(uploadedUrls.map(u => ({ type: "IMAGE", url: u })))));
      params.set("description", encodeURIComponent(payloadPrompt));

      onClose();
      router.push(`/?${params.toString()}`);
      toast.success(t("agentShareSaved") || "Ready to share on Home");
    } catch (e) {
      console.error(e);
      toast.error(t("agentShareFailed") || "Failed to prepare agent share");
    }
  };

  const handlePublishShare = async () => {
    try {
      // ensure accounts loaded
      if (!accountList || accountList.length === 0) {
        await getAccountList();
      }
      // filter accounts that support ImageText and are online (status !== 0)
      const candidates = (useAccountStore.getState().accountList || []).filter((acc) => {
        const plat = AccountPlatInfoMap.get(acc.type as any);
        return acc.status !== 0 && plat?.pubTypes?.has(PubType.ImageText);
      });

      if (!candidates || candidates.length === 0) {
        toast.error(t("noAvailablePublishAccounts") || "No available accounts to publish");
        return;
      }

      // Prepare medias param for accounts page (upload blobs then navigate)
      const targets = blobs && blobs.length > 0 ? blobs : [];
      let uploadedUrls: string[] = [];
      if (targets.length > 0) {
        for (let i = 0; i < targets.length; i++) {
          const file = new File([targets[i]], `aitoearn_export_${Date.now()}_${i}.png`, { type: targets[i].type || "image/png" });
          try {
            const url = await uploadToOss(file);
            uploadedUrls.push(url as string);
          } catch (err) {
            console.error("Upload failed for blob", err);
          }
        }
      } else {
        // fallback to provided urls
        uploadedUrls = urls.slice();
      }

      const medias = uploadedUrls.map((u) => ({ type: "IMAGE", url: u }));
      const title = "";
      const description = t("publishShareDescription") || "I generated this conversation on aitoearn using agent, check it out!";
      const tags = ["aitoearn", "agent"];

      // Build URL params and navigate to /accounts to trigger publish dialog filling
      const params = new URLSearchParams();
      params.set("aiGenerated", "true");
      params.set("medias", encodeURIComponent(JSON.stringify(medias)));
      params.set("description", encodeURIComponent(description));
      params.set("title", encodeURIComponent(title));
      params.set("tags", encodeURIComponent(JSON.stringify(tags)));
      // set accountId to first candidate for default selection
      params.set("accountId", candidates[0].id);

      onClose();
      router.push(`/accounts?${params.toString()}`);
    } catch (e) {
      console.error(e);
      toast.error(t("publishShareFailed") || "Failed to prepare publish");
    }
  };

  return (
    <Modal open={open} onCancel={onClose} title={t("previewTitle")}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-md border p-4 flex justify-center">
          {urls[0] ? <img src={urls[0]} alt="preview" className="max-h-[40vh] object-contain" /> : <div className="text-sm text-muted-foreground">{t("noPreview")}</div>}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleAgentShare}>{t("agentShare")}</Button>
          <Button variant="outline" onClick={handlePublishShare}>{t("publishShare")}</Button>
          <Button onClick={downloadBlobs}>{t("download")}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default SharePreviewModal;


