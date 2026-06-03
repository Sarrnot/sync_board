import { z } from 'zod'
import { createApp } from './app.js'

const PORT = z.coerce.number().int().positive().parse(process.env.PORT ?? 3000)

const app = createApp()

app.listen(PORT, () => {
    console.log(`server listening on http://localhost:${String(PORT)}`)
})
