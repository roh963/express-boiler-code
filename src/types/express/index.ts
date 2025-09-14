
export type UserPayload = {
  _id: string;
  role: string;
  email: string;
};

import { IUser } from "../../models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: import('.').UserPayload | IUser;
    }
  }
}
