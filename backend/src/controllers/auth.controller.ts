import { Request, Response } from "express";
import authService from "../services/auth.service.ts";

class AuthController {
  async signup(req: Request, res: Response): Promise<void> {
    try {
      const { user, token } = await authService.signup(req.body);

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      res.status(201).json({ message: "User created successfully", user, success: true });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Something went wrong" });
    }
  }

  async signin(req: Request, res: Response): Promise<void> {
    try {
      const { user, token } = await authService.signin(req.body);

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      res.status(200).json({ message: "Logged in successfully", user, success: true });
    } catch (error) {
      res.status(401).json({ message: error instanceof Error ? error.message : "Something went wrong" });
    }
  }

  async googleLogin(req: Request, res: Response) {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({
          success: false,
          message: "Credential is required",
        });
      }

      const { token, user } = await authService.googleLogin(credential);
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Google authentication failed",
      });
    }
  }

}

export default new AuthController();