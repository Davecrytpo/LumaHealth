import type { NextFunction, Request, Response } from 'express'
import type { Role } from '../shared/types.js'
import { sessions } from './store.js'
import { getUser, toSessionUser } from './lib.js'

export interface AuthedRequest extends Request {
  userId?: string
  role?: Role
}

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const session = token ? sessions.get(token) : undefined
  if (!session) {
    res.status(401).json({ message: 'Please sign in to continue.' })
    return
  }
  const user = getUser(session.userId)
  if (!user || user.status === 'suspended') {
    res.status(401).json({ message: 'This account is no longer active.' })
    return
  }
  req.userId = session.userId
  req.role = session.role
  next()
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      res.status(403).json({ message: 'You do not have access to this area.' })
      return
    }
    next()
  }
}

export function currentUser(req: AuthedRequest) {
  if (!req.userId) return null
  const user = getUser(req.userId)
  return user ? toSessionUser(user) : null
}

export function asyncHandler(
  fn: (req: AuthedRequest, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next)
  }
}
