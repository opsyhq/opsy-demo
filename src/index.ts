import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = parseInt(process.env.PORT || "3100");

serve({ fetch: app.fetch, port }, () => {
  console.log(`Notifications service running on port ${port}`);
});
