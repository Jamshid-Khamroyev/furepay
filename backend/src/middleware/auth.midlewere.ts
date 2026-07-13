import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userId: string;
    role: "USER" | "ADMIN";
    plan: "FREE" | "PREMIUM";
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

class AuthMiddleware {
  user(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication token is required.",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      req.user = decoded;
      
      next();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }
  }

  admin(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication token is required.",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      if (decoded.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Admin access required.",
        });
      }

      req.user = decoded;

      next();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }
  }

  premium(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication token is required.",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      if (decoded.plan !== "PREMIUM") {
        return res.status(403).json({
          success: false,
          message: "Premium subscription required.",
        });
      }

      req.user = decoded;

      next();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }
  }
}

export default new AuthMiddleware();