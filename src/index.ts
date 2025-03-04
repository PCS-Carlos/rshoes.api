import createServer from './api';
import config from './config/global';
import {
  ClienteController,
  PedidoController,
  PedidoDetalleController,
  ServicioController,
  UsuarioController,
} from './controllers';

const server = createServer(
  [ClienteController(), PedidoController(), PedidoDetalleController(), ServicioController(), UsuarioController()],
  config,
);
server.run();
