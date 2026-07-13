import { Request, Response } from "express";
import blogService from "../services/blog.service";

class BlogController {
  async createBlog(req: Request, res: Response) {
    try {
    const blog = await blogService.createBlog(req.user?.userId as string, req.body, req.user?.plan as string );

      res.status(201).json({ success: true, blog });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getBlogs(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 10
      const blogs = await blogService.getBlogs(limit);

      res.status(200).json({ success: true, blogs });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getBlog(req: Request, res: Response) {
    try {
      const blog = await blogService.getBlog(req.params.slug as string);

      res.status(200).json({ success: true, blog });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async searchBlogs(req: Request, res: Response) {
    try {
      const blogs = await blogService.searchBlogs(req.query.q as string);

      res.status(200).json({ success: true, blogs });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getBlogsByTag(req: Request, res: Response) {
    try {
      const blogs = await blogService.getBlogsByTag(req.params.tag as string);

      res.status(200).json({ success: true, blogs });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMyBlogs(req: Request, res: Response) {
    try {
    const blogs = await blogService.getMyBlogs(req.user?.userId as string);

      res.status(200).json({ success: true, blogs });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getUserBlogs(req: Request, res: Response) {
    try {
      const blogs = await blogService.getUserBlogs(req.params.id as string);

      res.status(200).json({ success: true, blogs });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateBlog(req: Request, res: Response) {
    try {
    const blog = await blogService.updateBlog(req.user?.userId as string, req.params.id as string, req.body);

      res.status(200).json({ success: true, blog });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteBlog(req: Request, res: Response) {
    try {
    const blog = await blogService.deleteBlog(req.user?.userId as string, req.user!.role, req.params.id as string);

      res.status(200).json({
        success: true,
        blog,
        message: "Blog deleted successfully.",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async addComment(req: Request, res: Response) {
    try {
    const comment = await blogService.addComment(req.user?.userId as string, req.params.id as string, req.body.content);

      res.status(201).json({ success: true, comment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getComments(req: Request, res: Response) {
    try {
      const comments = await blogService.getComments(req.params.id as string);

      res.status(200).json({ success: true, comments });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateComment(req: Request, res: Response) {
    try {
    const comment = await blogService.updateComment(req.user?.userId as string, req.params.id as string, req.body.content);

      res.status(200).json({ success: true, comment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteComment(req: Request, res: Response) {
    try {
    await blogService.deleteComment(req.user?.userId as string, req.user!.role, req.params.id as string);

      res.status(200).json({
        success: true,
        message: "Comment deleted successfully.",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async likeBlog(req: Request, res: Response) {
    try {
    const like = await blogService.likeBlog(req.user?.userId as string, req.params.id as string);

      res.status(200).json({ success: true, like });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async unlikeBlog(req: Request, res: Response) {
    try {
    await blogService.unlikeBlog(req.user?.userId as string, req.params.id as string);

      res.status(200).json({
        success: true,
        message: "Like removed successfully.",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getBlogsByFilter(req: Request, res: Response){
    try {
      const limit = Number(req.query.limit) || 10
      const filter = req.query.filter as "latest" | "oldest" | "popular" | "trending";
      const blogs = await blogService.getBlogsByFilter(filter, limit);

      res.status(200).json({ success: true, blogs });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new BlogController();