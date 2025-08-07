/** 判断是否外链 */
export function isExternal(path: string): boolean {
  return /^(?:https?:|mailto:|tel:)/.test(path)
}
