export function removeLocalePrefix(path: string): string {
  return path.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "") || "/";
}
