import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(env.PORT, () => {
    console.log(`server listening on http://localhost:${String(env.PORT)}`);
});
