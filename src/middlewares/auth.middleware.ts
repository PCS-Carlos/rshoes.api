import jwt from 'jsonwebtoken';
import {NextFunction, Response as ExpressResponse, Request} from 'express';
import {Response} from '../controllers';

export const validateJWT = (req: Request, res: ExpressResponse, next: NextFunction) => {
  const bearerHeader = req.headers['authorization'];
  let bearerToken: string;
  let response: Response;
  if (bearerHeader) {
    bearerToken = bearerHeader.split(' ')[1];
    jwt.verify(bearerToken, process.env.JWT_SECRET, (error, authData) => {
      if (error) {
        response = {
          status: false,
          message: 'Tóken no válido',
        };
        return res.status(403).json(response);
      }
      return next();
    });
  } else {
    response = {
      status: false,
      message: 'No hay tóken en la petición',
    };
    return res.status(403).json(response);
  }
};
