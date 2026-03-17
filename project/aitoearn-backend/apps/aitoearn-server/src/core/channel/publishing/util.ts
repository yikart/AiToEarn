export function generatePostMessage(message: string, topics: string[]): string {
  if (topics && topics.length > 0) {
    return `${message} #${topics.join(' #')}`
  }
  return message
}
