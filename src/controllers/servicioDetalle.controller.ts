import {PrismaClient, ServicioDetalle} from '@prisma/client';
import {Router, Request, Response as ExpressResponse} from 'express';
import {handleError} from '.';
import {validateJWT} from '../middlewares/auth.middleware';

const ServicioDetalleController = () => {
  const prisma = new PrismaClient();
  const router = Router();

  const getServiciosDetalle = async (_: Request, res: ExpressResponse) => {
    console.log('GET /serviciosDetalle');
    try {
      const serviciosDetalle = await prisma.servicioDetalle.findMany();
      res.json(serviciosDetalle);
    } catch (error) {
      handleError(res, error, 'servicio detalle');
    }
  };

  const getServicioDetalleById = async (req: Request, res: ExpressResponse) => {
    console.log('GET /serviciosDetalle/:idServicio');
    try {
      const idServicio = Number(req.params.idServicio) ?? 0;
      const serviciosDetalle = await prisma.servicioDetalle.findMany({
        where: {
          idServicio,
        },
      });
      res.json(serviciosDetalle);
    } catch (error) {
      handleError(res, error, 'Servicio detalle');
    }
  };

  const addServicioDetalle = async (req: Request, res: ExpressResponse) => {
    console.log('POST /servicioDetalle');
    try {
      const body: ServicioDetalle = req.body;
      const servicioDetalleCreado = await prisma.servicioDetalle.create({
        data: {
          ...body,
        },
      });
      res.json(servicioDetalleCreado);
    } catch (error) {
      handleError(res, error, 'Servicio detalle');
    }
  };

  const updateServicioDetalle = async (req: Request, res: ExpressResponse) => {
    console.log('PUT /servicioDetalle/:idDetalle');
    try {
      const idDetalle = Number(req.params.idDetalle) ?? 0;
      const body: ServicioDetalle = req.body;
      const servicioDetalleActualizado = await prisma.servicioDetalle.update({
        where: {
          idDetalle,
        },
        data: {
          ...body,
        },
      });
      res.json(servicioDetalleActualizado);
    } catch (error) {
      handleError(res, error, 'Servicio detalle');
    }
  };

  const deleteServicioDetalle = async (req: Request, res: ExpressResponse) => {
    console.log('DELETE /servicioDetalle/:idDetalle');
    try {
      const idDetalle = Number(req.params.idDetalle) ?? 0;
      const servicioDetalleEliminado = await prisma.servicioDetalle.delete({
        where: {
          idDetalle,
        },
      });
      res.json(servicioDetalleEliminado);
    } catch (error) {
      handleError(res, error, 'Servicio');
    }
  };

  router.get('/serviciosDetalle', validateJWT, getServiciosDetalle);
  router.get('/servicioDetalle/:idServicio', validateJWT, getServicioDetalleById);
  router.post('/servicioDetalle', validateJWT, addServicioDetalle);
  router.put('/servicioDetalle/:idDetalle', validateJWT, updateServicioDetalle);
  router.delete('/servicioDetalle/:idDetalle', validateJWT, deleteServicioDetalle);

  return {
    router,
  };
};

export default ServicioDetalleController;
