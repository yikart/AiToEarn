// 读取 blob 的文件流
export function readBlobRange(
  blob: Blob,
  start: number,
  end: number,
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const sliced = blob.slice(start, end);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(sliced);
  });
}

type ChunkRange = { start: number; end: number };
/**
 * 根据总大小和每片大小，计算每一片的 start 和 end 位置
 * @param size 视频的总字节数
 * @param chunkSize 每一片的字节数
 * @returns 每一片的 {start, end} 数组
 */
export function calculateChunks(size: number, chunkSize: number): ChunkRange[] {
  const chunks: ChunkRange[] = [];
  let start = 0;
  while (start < size) {
    const end = Math.min(start + chunkSize, size);
    chunks.push({ start, end });
    start = end;
  }
  return chunks;
}
