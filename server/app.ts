import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { authRouter } from './routes/auth.js'
import { patientRouter } from './routes/patient.js'
import { doctorRouter } from './routes/doctor.js'
import { adminRouter } from './routes/admin.js'
import { createSeed } from './seed.js'
import { resetDatabase } from './store.js'

resetDatabase(createSeed())

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, name: 'LumaHealth' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/patient', patientRouter)
  app.use('/api/doctor', doctorRouter)
  app.use('/api/admin', adminRouter)

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ message: 'Something went wrong on our side. Please try again.' })
  })

  const clientDist = path.resolve(process.cwd(), 'dist')
  app.use(express.static(clientDist))
  app.get(/^(?!\/api).*/, (_req, res, next) => {
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next()
    })
  })

  return app
}
