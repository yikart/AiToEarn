import html2canvas from "html2canvas";

export async function generateImageFromNode(node: HTMLElement, scale = 1): Promise<Blob | null> {
  try {
    // 确保节点在DOM中并且可见
    if (!node || !node.isConnected) {
      throw new Error("Node is not connected to DOM");
    }

    // 临时设置节点可见性用于截图
    const originalStyles = {
      position: node.style.position,
      left: node.style.left,
      top: node.style.top,
      visibility: node.style.visibility,
    };

    node.style.position = "fixed";
    node.style.left = "0";
    node.style.top = "0";
    node.style.visibility = "visible";

    const canvas = await html2canvas(node, {
      scale: Math.max(scale, 1), // 确保最小scale为1
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: process.env.NODE_ENV === "development",
      scrollY: 0,
      scrollX: 0,
      width: node.offsetWidth,
      height: node.offsetHeight,
      windowWidth: node.offsetWidth,
      windowHeight: node.offsetHeight,
      // 提高图片质量
      imageTimeout: 10000, // 增加图片加载超时时间
      removeContainer: false,
    });

    // 恢复原始样式
    Object.assign(node.style, originalStyles);

    return new Promise<Blob | null>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Image generation timeout"));
      }, 30000); // 30秒超时

      canvas.toBlob(
        (blob) => {
          clearTimeout(timeout);
          if (!blob) {
            reject(new Error("Failed to generate blob from canvas"));
            return;
          }
          resolve(blob);
        },
        "image/png",
        0.95 // 设置图片质量为95%
      );
    });

  } catch (error) {
    console.error("Error generating image from node:", error);
    throw error; // 重新抛出错误，让调用方处理
  }
}


