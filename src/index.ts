import createServer from './api';
import config from './config/global';
import {
  ClienteController,
  PedidoController,
  PedidoDetalleController,
  ServicioController,
  UsuarioController,
} from './controllers';

console.log('Hola mundo');

const server = createServer(
  [ClienteController(), PedidoController(), PedidoDetalleController(), ServicioController(), UsuarioController()],
  config,
);
server.run();
