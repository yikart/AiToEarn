import "i18next";
import Resources from "./resources";

declare module "i18next" {
  interface CustomTypeOptions {
    // defaultNS: 'translation'
    resources: Resources;
  }
}
