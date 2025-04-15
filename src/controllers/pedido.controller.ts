import {PrismaClient, Pedido} from '@prisma/client';
import {Router, Request, Response as ExpressResponse} from 'express';
import {handleError} from '.';
import {validateJWT} from '../middlewares/auth.middleware';

const PedidoController = () => {
  const prisma = new PrismaClient();
  const router = Router();

  const getPedidos = async (_: Request, res: ExpressResponse) => {
    console.log('GET /pedidos');
    try {
      const pedidos = await prisma.pedido.findMany({
        include: {
          pedidosDetalle: {
            include: {
              servicio: true,
            },
          },
          cliente: true,
        },
      });
      res.json(pedidos);
    } catch (error) {
      handleError(res, error, 'pedido');
    }
  };

  const getPedidoById = async (req: Request, res: ExpressResponse) => {
    console.log('GET /pedido/:idPedido');
    try {
      const idPedido = Number(req.params.idPedido) ?? 0;
      const pedido = await prisma.pedido.findUnique({
        where: {
          idPedido,
        },
        include: {
          pedidosDetalle: {
            include: {
              servicio: true,
            },
          },
          cliente: true,
        },
      });
      res.json(pedido);
    } catch (error) {
      handleError(res, error, 'Pedido');
    }
  };

  const getPedidoByFolio = async (req: Request, res: ExpressResponse) => {
    console.log('GET /pedidoByFolio/:folio');
    try {
      const folio = req.params.folio ?? '';
      const pedido = await prisma.pedido.findFirst({
        where: {
          folio: folio,
        },
        include: {
          pedidosDetalle: {
            include: {
              servicio: true,
            },
          },
          cliente: true,
        },
      });
      res.json(pedido);
    } catch (error) {
      handleError(res, error, 'Pedido');
    }
  };

  const addPedido = async (req: Request, res: ExpressResponse) => {
    console.log('POST /pedido');
    try {
      const {pedido, detallesPedido} = req.body;
      const pedidoCreado = await prisma.pedido.create({
        data: {
          ...pedido,
          pedidosDetalle: {
            create: detallesPedido,
          },
        },
        include: {
          pedidosDetalle: true,
        },
      });

      res.json(pedidoCreado);
    } catch (error) {
      handleError(res, error, 'Pedido');
    }
  };

  const updatePedido = async (req: Request, res: ExpressResponse) => {
    console.log('PUT /pedido/:idPedido');
    try {
      const idPedido = Number(req.params.idPedido) ?? 0;
      const body: Pedido = req.body;
      const pedidoActualizado = await prisma.pedido.update({
        where: {
          idPedido,
        },
        data: {
          ...body,
        },
      });
      res.json(pedidoActualizado);
    } catch (error) {
      handleError(res, error, 'Pedido');
    }
  };

  const deletePedido = async (req: Request, res: ExpressResponse) => {
    console.log('DELETE /pedido/:idPedido');
    try {
      const idPedido = Number(req.params.idPedido) ?? 0;
      const pedidoEliminado = await prisma.pedido.delete({
        where: {
          idPedido,
        },
      });
      res.json(pedidoEliminado);
    } catch (error) {
      handleError(res, error, 'pedido');
    }
  };

  router.get('/pedidos', getPedidos);
  router.get('/pedido/:idPedido', getPedidoById);
  router.get('/pedidoByFolio/:folio', getPedidoByFolio);
  router.post('/pedido', addPedido);
  router.put('/pedido/:idPedido', updatePedido);
  router.delete('/pedido/:idPedido', validateJWT, deletePedido);

  return {
    router,
  };
};

export default PedidoController;
