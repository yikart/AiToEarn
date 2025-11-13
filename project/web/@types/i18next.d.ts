import type Resources from './resources'
import 'i18next'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: Resources
  }

  namespace JSX {
    interface IntrinsicElements {
      'chatlio-widget': any
    }
  }
}
