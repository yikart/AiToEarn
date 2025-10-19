declare module 'xml2js' {
  export function parseString(
    xml: string,
    options: { explicitArray: boolean },
    callback: (err: any, result: any) => void
  ): void

  namespace parseString {
    export function parseString(
      xml: string,
      options: { explicitArray: boolean },
      callback: (err: any, result: any) => void
    ): void
  }

  export = parseString
}
