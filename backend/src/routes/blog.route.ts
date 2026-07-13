import { Router } from "express";
import blogController from "../controllers/blog.controller.ts";
import authMiddleware from "../middleware/auth.midlewere.ts";

const router = Router();

// User
router.get("/me", authMiddleware.user, blogController.getMyBlogs);
router.post("/", authMiddleware.user, blogController.createBlog);
router.patch("/:id", authMiddleware.user, blogController.updateBlog);
router.delete("/:id", authMiddleware.user, blogController.deleteBlog);

router.post("/:id/comment", authMiddleware.user, blogController.addComment);
router.patch("/comment/:id", authMiddleware.user, blogController.updateComment);
router.delete("/comment/:id", authMiddleware.user, blogController.deleteComment);

router.post("/:id/like", authMiddleware.user, blogController.likeBlog);
router.delete("/:id/like", authMiddleware.user, blogController.unlikeBlog);

// Public
router.get("/", blogController.getBlogs);
router.get("/search", blogController.searchBlogs);
router.get("/filter", blogController.getBlogsByFilter);
router.get("/tag/:tag", blogController.getBlogsByTag);
router.get("/user/:id", blogController.getUserBlogs);
router.get("/:slug", blogController.getBlog);
router.get("/:id/comments", blogController.getComments);

export default router;