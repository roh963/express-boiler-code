import app from './app';
import { config } from './utils/config';

const port = config.port;

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('Process terminated');
  });
});
