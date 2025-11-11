export const ENV = process.env.ENV ?? 'dev';
export const prefix = `myapp-${ENV}`;
export const region = process.env.AWS_REGION ?? 'us-east-1';
