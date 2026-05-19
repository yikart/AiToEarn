export enum VolcengineTaskStatus {
  Queued = 'queued',
  Running = 'running',
  Cancelled = 'cancelled',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

export enum VolcengineContentType {
  Text = 'text',
  ImageUrl = 'image_url',
}

export enum VolcengineImageRole {
  FirstFrame = 'first_frame',
  LastFrame = 'last_frame',
  ReferenceImage = 'reference_image',
}
