import dotenv from "dotenv";
import app from "./app";
import { testDBConnection } from "./config/db";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, async () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  await testDBConnection();
});
