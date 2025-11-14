"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prefix = exports.region = exports.ENV = exports.APP_NAME = void 0;
exports.APP_NAME = process.env.APP_NAME ?? 'myapp';
exports.ENV = process.env.ENV ?? 'dev';
exports.region = process.env.AWS_REGION ?? 'us-east-1';
exports.prefix = `${exports.APP_NAME}-${exports.ENV}`;
