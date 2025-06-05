import { generateUUID, getFilePathName } from "@/utils";
import { IImgFile } from "@/app/[lng]/publish/components/Choose/ImgChoose";

export const formatImg = async ({
  path,
  file,
  blob,
}: {
  path: string;
  file?: Uint8Array;
  blob?: Blob;
}): Promise<IImgFile> => {
  return new Promise((resolve) => {
    const { filename, suffix } = getFilePathName(path);
    if (!blob) {
      blob = new Blob([file!], {
        type: `image/${suffix}`,
      });
    }
    const imgUrl = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      resolve({
        id: generateUUID(),
        width: img.width,
        height: img.height,
        imgPath: path,
        size: blob!.size,
        filename,
        file: blob!,
        imgUrl,
      });
    };
    img.src = imgUrl;
  });
};
