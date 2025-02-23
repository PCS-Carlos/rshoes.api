import dotenv from 'dotenv';
import path from 'path';

export interface Config {
  port: number;
}
const API_ENV = process.env.NODE_ENV || 'development';
dotenv.config({
  path: path.resolve(
    __dirname,
    `${API_ENV === 'production' ? '../../env/.env.production' : '../../env/.env.development'}`,
  ),
});

const config: Config = {
  port: process.env.API_PORT,
};

export default config;
