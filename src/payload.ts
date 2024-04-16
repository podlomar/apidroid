export interface ResponseError {
  code: string,
  message: string,
  meta?: any,
}

export interface DataPayload {
  data: any,
}

export interface ErrorPayload {
  errors: ResponseError[],
}

export type Payload = DataPayload | ErrorPayload;

export const payload = (status: 'ok' | 'error', content: any): Payload => {
  if (status === 'ok') {
    return { data: content };
  }

  return { errors: content };
};
