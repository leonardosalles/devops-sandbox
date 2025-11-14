export const APP_NAME = process.env.APP_NAME ?? 'myapp';
export const ENV = process.env.ENV ?? 'dev';
export const region = process.env.AWS_REGION ?? 'us-east-1';

export const prefix = `${APP_NAME}-${ENV}`;
