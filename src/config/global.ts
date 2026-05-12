import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

export interface Config {
  port: number;
}

const API_ENV = process.env.NODE_ENV || 'development';
const defaultEnvPath = path.resolve(
  __dirname,
  `${API_ENV === 'production' ? '../../env/.env.production' : '../../env/.env.development'}`,
);
const configuredEnvPath = process.env.ENV_FILE_PATH ? path.resolve(process.env.ENV_FILE_PATH) : defaultEnvPath;

if (fs.existsSync(configuredEnvPath)) {
  dotenv.config({path: configuredEnvPath});
} else {
  // Safe fallback for deployments that inject env vars via systemd/PM2/container runtime.
  dotenv.config();
}

const config: Config = {
  port: Number(process.env.API_PORT) || 4000,
};

export default config;
