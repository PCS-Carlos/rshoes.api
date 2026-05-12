import createServer from './api';
import config from './config/global';
import {
  AnalyticsController,
  ClienteController,
  PedidoController,
  PedidoDetalleController,
  ServicioController,
  UsuarioController,
} from './controllers';

const server = createServer(
  [
    ClienteController(),
    PedidoController(),
    PedidoDetalleController(),
    ServicioController(),
    UsuarioController(),
    AnalyticsController(),
  ],
  config,
);
server.run();
