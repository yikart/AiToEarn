interface VersionInfo {
  update: boolean;
  version: string;
  newVersion?: string;
}

interface ErrorType {
  message: string;
  error: Error;
}
