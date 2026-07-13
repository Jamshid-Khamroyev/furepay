import { Request, Response } from "express";
import userService from "../services/user.service.ts";

class UserController {
  async getMe(req: Request, res: Response) {
    try {
      const user = await userService.getMe(req.user?.userId!);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateMe(req: Request, res: Response) {
    try {
      const user = await userService.updateMe(req.user?.userId!, req.body);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async blockUser(req: Request, res: Response) {
    try {
      if(!req?.params?.id) {
        return res.status(400).json({ message: "User ID is required." });
      }

      const user = await userService.blockUser(req?.params?.id as string);
  
      return res.status(200).json({
        success: true,
        message: "User has been blocked successfully.",
        user,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async allUsers(req: Request, res: Response){
    try {
      const limit = Number(req.query.limit) || 10
      const users = await userService.allUsers(limit)

      res.json({ success: true, users })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async userProfile(req: Request, res: Response){
    try {
      const { userId } = req.params
      const user = await userService.userProfile(userId as string)

      res.json({ success: true, user })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async logout(req: Request, res: Response){
    try { 
      res.clearCookie("token", {
        httpOnly: true
      })
      res.json({ success: true, message: "You logout successfully!" })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}

export default new UserController();