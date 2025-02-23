import {Router} from 'express';
import {Response as ExpressResponse} from 'express';
import ClienteController from './cliente.controller';

export interface Controller {
  router: Router;
}

export interface Response {
  status: boolean;
  message: string;
  data?: {};
}

export const handleError = (res: ExpressResponse, error: any, controller: string) => {
  const response: Response = {
    status: false,
    message: `Ocurrió un error en ${controller}Controller`,
    data:
      error.code === 'P2002'
        ? 'El campo ya existe en la base de datos'
        : error.code === 'P2025'
          ? 'El campo no existe en la base de datos'
          : `${error}`,
  };

  const statusCode = error.code ? 400 : 500;
  console.log(`${error}`);
  return res.status(statusCode).json(response);
};

export {ClienteController};
