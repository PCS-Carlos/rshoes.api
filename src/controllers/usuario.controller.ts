import {PrismaClient, Usuario} from '@prisma/client';
import {Router, Request, Response as ExpressResponse} from 'express';
import {validateJWT} from '../middlewares/auth.middleware';
import {Response} from '.';
import {generateJWT, verifyJWT} from '../utils/jwt';
import bcrypt from 'bcryptjs';

const UsuarioController = () => {
  const prisma = new PrismaClient();
  const router = Router();

  const getUsuarios = async (_: Request, res: ExpressResponse) => {
    console.log('GET /usuarios');
    try {
      const usuarios = await prisma.usuario.findMany();
      res.json(usuarios);
    } catch (error) {
      handleError(res, error);
    }
  };

  const getUsuarioById = async (req: Request, res: ExpressResponse) => {
    console.log('GET /usuario/:idUsuario');
    try {
      const idUsuario = Number(req.params.idUsuario) ?? 0;
      const usuario = await prisma.usuario.findUnique({
        where: {
          idUsuario,
        },
      });
      res.json(usuario);
    } catch (error) {
      handleError(res, error);
    }
  };

  const addUsuario = async (req: Request, res: ExpressResponse) => {
    console.log('POST /usuario');
    try {
      const body: Usuario = req.body;
      const usuario = await prisma.usuario.findFirst({
        where: {
          nombre: body.nombre ?? '',
        },
      });
      console.log('usuario', usuario);
      if (usuario) {
        const response: Response = {
          status: false,
          message: 'El usuario ya ha sido registrado. Por favor, verifica tus datos.',
        };
        return res.status(404).json(response);
      }
      const usuarioAdded = await prisma.usuario.create({
        data: {
          ...body,
          contrasena: bcrypt.hashSync(body.contrasena!, bcrypt.genSaltSync()),
        },
      });
      res.json(usuarioAdded);
    } catch (error) {
      handleError(res, error);
    }
  };

  const updateUsuario = async (req: Request, res: ExpressResponse) => {
    console.log('PUT /usuario/:idUsuario');
    try {
      const idUsuario = Number(req.params.idUsuario);
      const body: Usuario = req.body;
      const usuarioUpdated = await prisma.usuario.update({
        where: {
          idUsuario: idUsuario ?? 0,
        },
        data: {
          idUsuario: body.idUsuario,
          nombre: body.nombre,
          contrasena: body.contrasena && bcrypt.hashSync(body.contrasena!, bcrypt.genSaltSync()),
          ultimoAcceso: body.ultimoAcceso,
          token: body.token,
        },
      });
      res.json(usuarioUpdated);
    } catch (error) {
      handleError(res, error);
    }
  };

  const deleteUsuario = async (req: Request, res: ExpressResponse) => {
    console.log('DELETE /usuario/:idUsuario');
    try {
      const idUsuario = Number(req.params.idUsuario) ?? 0;
      const usuarioEliminado = await prisma.usuario.delete({
        where: {
          idUsuario,
        },
      });
      res.json(usuarioEliminado);
    } catch (error) {
      handleError(res, error);
    }
  };

  const login = async (req: Request, res: ExpressResponse) => {
    try {
      const body: Usuario = req.body;
      const usuario = await prisma.usuario.findFirst({
        where: {
          nombre: body.nombre ?? '',
        },
      });
      if (!usuario) {
        const response: Response = {
          status: false,
          message: 'Usuario incorrecto. Por favor, verifica tus datos.',
        };
        return res.status(404).json(response);
      }
      const validPassword = bcrypt.compareSync(body.contrasena!, usuario.contrasena!);
      if (!validPassword) {
        const response: Response = {
          status: false,
          message: 'Contraseña incorrecta. Por favor, verifica tus datos.',
        };
        return res.status(404).json(response);
      }
      const token = await generateJWT(usuario.nombre!);
      await prisma.usuario.updateMany({
        where: {
          nombre: usuario.nombre ?? '',
          contrasena: usuario.contrasena ?? '',
        },
        data: {
          token: token,
          ultimoAcceso: new Date(),
        },
      });
      const response: Response = {
        status: true,
        message: 'Acceso correcto',
        data: {
          ...usuario,
          token,
        },
      };
      res.json(response);
    } catch (error) {
      handleError(res, error);
    }
  };

  const loginToken = async (req: Request, res: ExpressResponse) => {
    try {
      const body: Usuario = req.body;
      if (!verifyJWT(body.token!)) {
        const response: Response = {
          status: false,
          message: 'Tóken inválido',
        };
        return res.status(403).json(response);
      }
      const usuario = await prisma.usuario.findFirst({
        where: {
          nombre: body.nombre ?? '',
          token: body.token ?? '',
        },
      });
      if (!usuario) {
        const response: Response = {
          status: false,
          message: 'Usuario incorrecto. Por favor, verifica tus datos.',
        };
        return res.status(404).json(response);
      }
      const token = await generateJWT(usuario.nombre!);
      await prisma.usuario.updateMany({
        where: {
          nombre: usuario.nombre ?? '',
          contrasena: usuario.contrasena ?? '',
        },
        data: {
          token: token,
          ultimoAcceso: new Date(),
        },
      });
      const response: Response = {
        status: true,
        message: 'Acceso correcto',
        data: {
          ...usuario,
          token,
        },
      };
      res.json(response);
    } catch (error) {
      handleError(res, error);
    }
  };

  router.get('/usuarios', getUsuarios);
  router.get('/usuario/:idUsuario', validateJWT, getUsuarioById);
  router.post('/usuario', addUsuario);
  router.put('/usuario/:idUsuario', validateJWT, updateUsuario);
  router.delete('/usuario/:idUsuario', deleteUsuario);
  router.post('/usuarios/login', login);
  router.post('/usuarios/login/token', loginToken);

  const handleError = (res: ExpressResponse, error: any) => {
    const response: Response = {
      status: false,
      message: 'Ocurrió un error en UsuariosController',
      data: `${error}`,
    };
    console.log(`${error}`);
    return res.status(500).json(response);
  };

  return {
    router,
  };
};

export default UsuarioController;
