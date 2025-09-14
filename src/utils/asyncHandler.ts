import { Request, Response, NextFunction, RequestHandler } from 'express';

type MaybePromise<T> = T | Promise<T>;

type UniversalHandler<T = void> = (req: Request, res: Response, next: NextFunction) => MaybePromise<T>;

export const asyncHandler = <T = void>(fn: UniversalHandler<T>): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
