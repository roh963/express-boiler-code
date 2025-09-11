
import { config, getAppVersion } from '../utils/config';

export async function getHealthInfo() {
  return {
    status: 'ok',
    uptime: process.uptime(),
    env: config.env,
    version: getAppVersion(),
  };
}
