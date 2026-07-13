import { Router } from "express";
import authMidlewere from "../middleware/auth.midlewere";
import noteController from "../controllers/note.controller";
import uploadMidlewere from "../middleware/upload.midlewere";

const router = Router();

router.post("/", authMidlewere.user, uploadMidlewere.single("image"), noteController.createNote);
router.put("/:id", authMidlewere.user, uploadMidlewere.single("image"), noteController.updateNote);
router.delete("/:id", authMidlewere.user, noteController.deleteNote);
router.post("/:id/like", authMidlewere.user, noteController.likeNote);
router.delete("/:id/like", authMidlewere.user, noteController.unlikeNote);
router.get("/", authMidlewere.user, noteController.AllNotes);

export default router