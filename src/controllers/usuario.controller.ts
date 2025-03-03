import {PrismaClient, Usuario} from '@prisma/client';
import {Router, Request, Response as ExpressResponse} from 'express';
import {handleError} from '.';
import {validateJWT} from '../middlewares/auth.middleware';
import {Controller, Response} from '.';
import {generateJWT, verifyJWT} from '../utils/jwt';
import bcrypt from 'bcryptjs';

class UsuarioController implements Controller {
  path: string;
  router: Router;
  prisma: PrismaClient;

  constructor() {
    this.router = Router();
    this.prisma = new PrismaClient();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/usuarios', validateJWT, this.getUsuarios);
    this.router.get('/usuario/:idUsuario', validateJWT, this.getUsuarioById);
    this.router.post('/usuario', validateJWT, this.addUsuario);
    this.router.put('/usuario/:idUsuario', validateJWT, this.updateUsuario);
    this.router.delete('/usuario/:idUsuario', validateJWT, this.deleteUsuario);
    this.router.post('/usuarios/login', this.login);
    this.router.post('/usuarios/login/token', this.loginToken);
  }

  getUsuarios = async (_: Request, res: ExpressResponse) => {
    console.log('GET /usuarios');
    try {
      const usuarios = await this.prisma.usuario.findMany();
      res.json(usuarios);
    } catch (error) {
      handleError(res, error, 'Usuario');
    }
  };

  getUsuarioById = async (req: Request, res: ExpressResponse) => {
    console.log('GET /usuario/:idUsuario');
    try {
      const idUsuario = Number(req.params.idUsuario) ?? 0;
      const usuario = await this.prisma.usuario.findUnique({
        where: {
          idUsuario,
        },
      });
      res.json(usuario);
    } catch (error) {
      handleError(res, error, 'usuario');
    }
  };

  addUsuario = async (req: Request, res: ExpressResponse) => {
    console.log('POST /usuario');
    try {
      const body: Usuario = req.body;
      const usuarioCreado = await this.prisma.usuario.create({
        data: {
          ...body,
        },
      });
      res.json(usuarioCreado);
    } catch (error) {
      handleError(res, error, 'usuario');
    }
  };

  updateUsuario = async (req: Request, res: ExpressResponse) => {
    console.log('PUT /usuario/:idUsuario');
    try {
      const idUsuario = Number(req.params.idUsuario) ?? 0;
      const body: Usuario = req.body;
      const usuarioActualizado = await this.prisma.usuario.update({
        where: {
          idUsuario,
        },
        data: {
          ...body,
        },
      });
      res.json(usuarioActualizado);
    } catch (error) {
      handleError(res, error, 'Usuario');
    }
  };

  deleteUsuario = async (req: Request, res: ExpressResponse) => {
    console.log('DELETE /usuario/:idUsuario');
    try {
      const idUsuario = Number(req.params.idUsuario) ?? 0;
      const usuarioEliminado = await this.prisma.usuario.delete({
        where: {
          idUsuario,
        },
      });
      res.json(usuarioEliminado);
    } catch (error) {
      handleError(res, error, 'Usuario');
    }
  };

  login = async (req: Request, res: ExpressResponse) => {
    try {
      const body: Usuario = req.body;
      const usuario = await this.prisma.usuario.findFirst({
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
      await this.prisma.usuario.updateMany({
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
      this.handleError(res, error);
    }
  };

  loginToken = async (req: Request, res: ExpressResponse) => {
    try {
      const body: Usuario = req.body;
      if (!verifyJWT(body.token!)) {
        const response: Response = {
          status: false,
          message: 'Tóken inválido',
        };
        return res.status(403).json(response);
      }
      const usuario = await this.prisma.usuario.findFirst({
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
      await this.prisma.usuario.updateMany({
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
      this.handleError(res, error);
    }
  };

  handleError(res: ExpressResponse, error: any) {
    const response: Response = {
      status: false,
      message: 'Ocurrió un error en UsuariosController',
      data: `${error}`,
    };
    console.log(`${error}`);
    return res.status(500).json(response);
  }
}

export default UsuarioController;
