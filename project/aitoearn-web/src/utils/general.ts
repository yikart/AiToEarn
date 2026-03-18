export async function getPageTitle(name: string, lng: string) {
  return `${name} —— AiToEarn`
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
