import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./db/index.js";
import { createAppNotificationBus } from "./events/index.js";
import { createServices } from "./services/index.js";

const bus = createAppNotificationBus();
const services = createServices({ db, bus });
const app = createApp({ services });

app.listen(env.PORT, () => {
    console.log(`server listening on http://localhost:${String(env.PORT)}`);
});
