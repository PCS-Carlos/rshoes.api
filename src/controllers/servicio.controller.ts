import {PrismaClient, Servicio} from '@prisma/client';
import {Router, Request, Response as ExpressResponse} from 'express';
import {handleError} from '.';
import {validateJWT} from '../middlewares/auth.middleware';

const ServicioController = () => {
  const prisma = new PrismaClient();
  const router = Router();

  const getServicios = async (_: Request, res: ExpressResponse) => {
    console.log('GET /servicios');
    try {
      const servicios = await prisma.servicio.findMany();
      res.json(servicios);
    } catch (error) {
      handleError(res, error, 'servicio');
    }
  };

  const getServicioById = async (req: Request, res: ExpressResponse) => {
    console.log('GET /servicio/:idServicio');
    try {
      const idServicio = Number(req.params.idServicio) ?? 0;
      const servicio = await prisma.servicio.findUnique({
        where: {
          idServicio,
        },
      });
      res.json(servicio);
    } catch (error) {
      handleError(res, error, 'Servicio');
    }
  };

  const addServicio = async (req: Request, res: ExpressResponse) => {
    console.log('POST /servicio');
    try {
      const body: Servicio = req.body;
      const servicioCreado = await prisma.servicio.create({
        data: {
          ...body,
        },
      });
      res.json(servicioCreado);
    } catch (error) {
      handleError(res, error, 'Servicio');
    }
  };

  const updateServicio = async (req: Request, res: ExpressResponse) => {
    console.log('PUT /servicio/:idServicio');
    try {
      const idServicio = Number(req.params.idServicio) ?? 0;
      const body: Servicio = req.body;
      const servicioActualizado = await prisma.servicio.update({
        where: {
          idServicio,
        },
        data: {
          ...body,
        },
      });
      res.json(servicioActualizado);
    } catch (error) {
      handleError(res, error, 'Servicio');
    }
  };

  const deleteServicio = async (req: Request, res: ExpressResponse) => {
    console.log('DELETE /servicio/:idServicio');
    try {
      const idServicio = Number(req.params.idServicio) ?? 0;
      const servicioEliminado = await prisma.servicio.delete({
        where: {
          idServicio,
        },
      });
      res.json(servicioEliminado);
    } catch (error) {
      handleError(res, error, 'Servicio');
    }
  };

  router.get('/servicios', validateJWT, getServicios);
  router.get('/servicio/:idServicio', validateJWT, getServicioById);
  router.post('/servicio', validateJWT, addServicio);
  router.put('/servicio/:idServicio', validateJWT, updateServicio);
  router.delete('/servicio/:idServicio', validateJWT, deleteServicio);

  return {
    router,
  };
};

export default ServicioController;
