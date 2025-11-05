import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface DecodedToken {
  id: number;
  iat: number;
  exp: number;
}

export function protect(req: Request, res: Response, next: NextFunction) {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid" });
  }
}
