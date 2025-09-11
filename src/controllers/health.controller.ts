import { Request, Response } from 'express';
import { getHealthInfo } from '../services/health.service';

export const healthController = async (req: Request, res: Response) => {
  const info = await getHealthInfo();
  res.json(info);
};
