import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import {Config} from '../config/global';
import {Controller} from '../controllers';
import moment from 'moment';

const createServer = (controllers: Controller[], config: Config) => {
  const app = express();
  const server = http.createServer(app);
  const port = config.port;
  const startApp = Date.now();

  const initializeMiddlewares = () => {
    app.use(cookieParser());
    app.use(
      cors({
        origin: true,
      }),
    );
    app.use(express.json());
  };

  const initializeControllers = (controllers: Controller[]) => {
    controllers.forEach((controller) => {
      app.use(`/api/rshoes`, controller.router);
    });
  };

  const run = () => {
    server.listen(port, () => {
      console.clear();
      const message = `${moment().format('HH:mm:ss')} - API - RUNNING ON PORT ${port} - ${Date.now() - startApp} ms`;
      console.log(message);
    });
  };

  initializeMiddlewares();
  initializeControllers(controllers);

  return {
    run,
  };
};

export default createServer;
