import jwt from 'jsonwebtoken';

interface Payload {
  id: string;
}

export const generateJWT = (id: string): Promise<string | undefined> => {
  return new Promise<string | undefined>((resolve, reject) => {
    const payload: Payload = {
      id: id,
    };
    jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '12h'}, (error, token) => {
      if (error) {
        console.log(error);
        reject(new Error('No se pudo generar el tóken'));
      } else {
        resolve(token);
      }
    });
  });
};

export const verifyJWT = (token: string) => {
  try {
    const id = jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch (error) {
    return false;
  }
};
