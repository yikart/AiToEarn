// 根据文件路径获取文件名和后缀
export function getFilePathNameCommon(path: string) {
  if (!path)
    return {
      filename: '',
      suffix: '',
    };
  const path1 = path.split('\\')[path.split('\\').length - 1];
  const filename = path1.split('/')[path1.split('/').length - 1];
  return {
    filename,
    suffix: filename.split('.')[filename.split('.').length - 1],
  };
}