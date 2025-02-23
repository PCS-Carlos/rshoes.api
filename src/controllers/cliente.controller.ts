import {PrismaClient, Cliente} from '@prisma/client';
import {Router, Request, Response as ExpressResponse} from 'express';
import {handleError} from '.';
import {validateJWT} from '../middlewares/auth.middleware';

const ClienteController = () => {
  const prisma = new PrismaClient();
  const router = Router();

  const getClientes = async (_: Request, res: ExpressResponse) => {
    console.log('GET /clientes');
    try {
      const clientes = await prisma.cliente.findMany();
      res.json(clientes);
    } catch (error) {
      handleError(res, error, 'Cliente');
    }
  };

  const getClienteById = async (req: Request, res: ExpressResponse) => {
    console.log('GET /cliente/:idCliente');
    try {
      const idCliente = Number(req.params.idCliente) ?? 0;
      const cliente = await prisma.cliente.findUnique({
        where: {
          idCliente,
        },
      });
      res.json(cliente);
    } catch (error) {
      handleError(res, error, 'Cliente');
    }
  };

  const addCliente = async (req: Request, res: ExpressResponse) => {
    console.log('POST /cliente');
    try {
      const body: Cliente = req.body;
      const clienteCreado = await prisma.cliente.create({
        data: {
          ...body,
        },
      });
      res.json(clienteCreado);
    } catch (error) {
      handleError(res, error, 'Cliente');
    }
  };

  const updateCliente = async (req: Request, res: ExpressResponse) => {
    console.log('PUT /cliente/:idCliente');
    try {
      const idCliente = Number(req.params.idCliente) ?? 0;
      const body: Cliente = req.body;
      const clienteActualizado = await prisma.cliente.update({
        where: {
          idCliente,
        },
        data: {
          ...body,
        },
      });
      res.json(clienteActualizado);
    } catch (error) {
      handleError(res, error, 'Cliente');
    }
  };

  const deleteCliente = async (req: Request, res: ExpressResponse) => {
    console.log('DELETE /cliente/:idCliente');
    try {
      const idCliente = Number(req.params.idCliente) ?? 0;
      const clienteEliminado = await prisma.cliente.delete({
        where: {
          idCliente,
        },
      });
      res.json(clienteEliminado);
    } catch (error) {
      handleError(res, error, 'Cliente');
    }
  };

  router.get('/clientes', validateJWT, getClientes);
  router.get('/cliente/:idCliente', validateJWT, getClienteById);
  router.post('/cliente', validateJWT, addCliente);
  router.put('/cliente/:idCliente', validateJWT, updateCliente);
  router.delete('/cliente/:idCliente', validateJWT, deleteCliente);

  return {
    router,
  };
};

export default ClienteController;
