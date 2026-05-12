import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

export interface Config {
  port: number;
}

const API_ENV = process.env.NODE_ENV || 'development';
const isProduction = API_ENV === 'production';

const candidateEnvPaths = [
  ...(process.env.ENV_FILE_PATH ? [path.resolve(process.env.ENV_FILE_PATH)] : []),
  path.resolve(__dirname, isProduction ? '../../env/.env.production' : '../../env/.env.development'),
  path.resolve(__dirname, isProduction ? '../../.env.production' : '../../.env.development'),
  path.resolve(__dirname, '../../.env'),
];

const existingEnvPath = candidateEnvPaths.find((filePath) => fs.existsSync(filePath));

if (existingEnvPath) {
  dotenv.config({path: existingEnvPath});
} else {
  // Final fallback for runtimes that inject env vars directly.
  dotenv.config();
}

const config: Config = {
  port: Number(process.env.API_PORT) || 4000,
};

export default config;
