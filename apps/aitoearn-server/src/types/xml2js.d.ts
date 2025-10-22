declare module 'xml2js' {
  export function parseString(
    str: string,
    options: { explicitArray: boolean },
    callback: (err: any, result: any) => void
  ): void

  export function parseString(
    str: string,
    callback: (err: any, result: any) => void
  ): void
}
