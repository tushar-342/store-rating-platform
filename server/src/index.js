import 'dotenv/config';
import app from './app.js';
import { prisma } from './config/db.js';

const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, () => console.log(`API listening on port ${port}`));
const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
