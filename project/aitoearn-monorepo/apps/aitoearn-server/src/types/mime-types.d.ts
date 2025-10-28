declare module 'mime-types' {
  export function lookup(path: string): string | false
  export function contentType(path: string): string | false
  export function extension(type: string): string | false
  export function charset(type: string): string | false

  export const types: { [key: string]: string }
  export const extensions: { [key: string]: string[] }
}
