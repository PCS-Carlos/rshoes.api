import {PrismaClient, PedidoDetalle} from '@prisma/client';
import {Router, Request, Response as ExpressResponse} from 'express';
import {handleError} from '.';
import {validateJWT} from '../middlewares/auth.middleware';

const PedidoDetalleController = () => {
  const prisma = new PrismaClient();
  const router = Router();

  const getPedidosDetalle = async (_: Request, res: ExpressResponse) => {
    console.log('GET /pedidoDetalle');
    try {
      const pedidoDetalle = await prisma.pedidoDetalle.findMany();
      res.json(pedidoDetalle);
    } catch (error) {
      handleError(res, error, 'pedido detalle');
    }
  };

  const getPedidoDetalleById = async (req: Request, res: ExpressResponse) => {
    console.log('GET /pedidoDetalle/:idPedido');
    try {
      const idPedido = Number(req.params.idPedido) ?? 0;
      const pedidoDetalle = await prisma.pedidoDetalle.findMany({
        where: {
          idPedido,
        },
      });
      res.json(pedidoDetalle);
    } catch (error) {
      handleError(res, error, 'pedido detalle');
    }
  };

  const addPedidoDetalle = async (req: Request, res: ExpressResponse) => {
    console.log('POST /pedidoDetalle');
    try {
      const body: PedidoDetalle = req.body;
      const pedidoDetalleCreado = await prisma.pedidoDetalle.create({
        data: {
          ...body,
        },
      });
      res.json(pedidoDetalleCreado);
    } catch (error) {
      handleError(res, error, 'pedido detalle');
    }
  };

  const updatePedidoDetalle = async (req: Request, res: ExpressResponse) => {
    console.log('PUT /pedidoDetalle/:idDetalle');
    try {
      const idDetalle = Number(req.params.idDetalle) ?? 0;
      const body: PedidoDetalle = req.body;
      const pedidoDetalleActualizado = await prisma.pedidoDetalle.update({
        where: {
          idDetalle,
        },
        data: {
          ...body,
        },
      });
      res.json(pedidoDetalleActualizado);
    } catch (error) {
      handleError(res, error, 'pedido detalle');
    }
  };

  const deletePedidoDetalle = async (req: Request, res: ExpressResponse) => {
    console.log('DELETE /pedidoDetalle/:idDetalle');
    try {
      const idDetalle = Number(req.params.idDetalle) ?? 0;
      const pedidoDetalleEliminado = await prisma.pedidoDetalle.delete({
        where: {
          idDetalle,
        },
      });
      res.json(pedidoDetalleEliminado);
    } catch (error) {
      handleError(res, error, 'pedido');
    }
  };

  router.get('/pedidoDetalle', validateJWT, getPedidosDetalle);
  router.get('/pedidoDetalle/:idPedido', validateJWT, getPedidoDetalleById);
  router.post('/pedidoDetalle', validateJWT, addPedidoDetalle);
  router.put('/pedidoDetalle/:idDetalle', validateJWT, updatePedidoDetalle);
  router.delete('/pedidoDetalle/:idDetalle', validateJWT, deletePedidoDetalle);

  return {
    router,
  };
};

export default PedidoDetalleController;
