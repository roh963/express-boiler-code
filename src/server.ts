import app from './app';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { initSocket } from './realtime/socket';

dotenv.config();

// ... (existing middleware, routes, e.g., app.use(express.json()); app.use('/api', routes);)

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));