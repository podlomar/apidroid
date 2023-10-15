export interface ResponseError {
  code: string,
  message: string,
  meta?: any,
}

export interface OkPayload {
  status: 'ok',
  result: any,
}

export interface ErrorPayload {
  errors: ResponseError[],
}

export interface BadRequestPayload extends ErrorPayload {
  status: 'bad-request',
}

export interface ServerErrorPayload extends ErrorPayload {
  status: 'server-error',
}

export type Payload = OkPayload | BadRequestPayload | ServerErrorPayload;

export const payload = (status: Payload['status'], data: any): Payload => {
  if (status === 'ok') {
    return { status, result: data };
  }

  return { status, errors: data };
};
