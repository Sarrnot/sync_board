import express from 'express'
import type { Express } from 'express'

/**
 * Builds the Express application. Kept free of side effects (no `listen`)
 * so it can be used directly in tests via supertest.
 */
export function createApp(): Express {
    const app = express()

    app.use(express.json())

    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok' })
    })

    return app
}
