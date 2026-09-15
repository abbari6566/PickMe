export {};

declare global {
  namespace Express {
    interface Request {
      // Optional because public routes do not run authentication middleware.
      user?: { id: number };
    }
  }
}
