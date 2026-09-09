// Must load before any other import — ./app (via routes/lib/prisma) reads
// process.env.DATABASE_URL at module-load time to build its connection
// pool.
import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT ?? 3011;

app.listen(PORT, () => {
  console.log(`Beauty Bar IQ API running on http://localhost:${PORT}`);
});
