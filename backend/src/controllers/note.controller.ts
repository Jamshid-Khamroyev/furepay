import { Request, Response } from "express";
import noteService from "../services/note.service";

class NoteController {
  async createNote(req: Request, res: Response) {
    try {
      const note = await noteService.createNote(req.user!.userId, req.body, req.file);
        
      res.status(201).json({
        success: true,
        note,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateNote(req: Request, res: Response) {
    try {
      const note = await noteService.updateNote(req.user!.userId, req.params.id as string, req.body, req.file);

      res.status(200).json({
        success: true,
        note,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteNote(req: Request, res: Response) {
    try {
      await noteService.deleteNote(req.user!.userId, req.user!.role, req.params.id as string);

      res.status(200).json({
        success: true,
        message: "Note deleted successfully.",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async likeNote(req: Request, res: Response) {
    try {
      const like = await noteService.likeNote(req.user!.userId, req.params.id as string);

      res.status(200).json({
        success: true,
        like,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async unlikeNote(req: Request, res: Response) {
    try {
      await noteService.unlikeNote(req.user!.userId, req.params.id as string);

      res.status(200).json({
        success: true,
        message: "Like removed successfully.",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async AllNotes(req: Request, res: Response){
    try {
        const limit = Number(req.query.limit) || 10;
        const notes = await noteService.AllNotes(limit as number)

        res.json({ success: true, notes })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
  }
}

export default new NoteController();