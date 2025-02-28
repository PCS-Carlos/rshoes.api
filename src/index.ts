import createServer from './api';
import config from './config/global';
import {ClienteController, ServicioController} from './controllers';

const server = createServer([ClienteController(), ServicioController()], config);
server.run();
