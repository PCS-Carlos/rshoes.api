import createServer from './api';
import config from './config/global';
import {ClienteController} from './controllers';

const server = createServer([ClienteController()], config);
server.run();
