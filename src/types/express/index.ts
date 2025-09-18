import { IUser } from '../../models/user.model';

export type UserPayload = {
  _id: string;
  role: string;
  email: string;
};

declare module 'express' {
  interface Request {
    user?: UserPayload | IUser;
  }
}
