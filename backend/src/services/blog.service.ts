import { prisma } from "../config/db.ts";
import { emitAddBlogComment, emitAddBlogLike, emitBlogCreated, emitBlogDeleted, emitBlogUpdated, emitDeleteBlogComment, emitRemoveBlogLike, emitUpdateBlogComment } from "../socket/events/blog.event.ts";
import { createSlug } from "../utils/index.ts";

interface CreateBlogDto {
  title: string;
  content: string;
  tags: string[];
}

interface UpdateBlogDto {
  title?: string;
  content?: string;
  tags?: string[];
}

class BlogService {
  async createBlog(userId: string, data: CreateBlogDto, plan: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
      if(user?.isBlocked){
        throw new Error("You are blocked from creating blogs.");
      }

    if (plan === "FREE") {
      const blogCount = await prisma.blog.count({
        where: {
          authorId: userId,
        },
      });
  
      if (blogCount >= 5) {
        throw new Error(
          "Free plan users can create up to 5 blogs. Upgrade your plan to create more."
        );
      }

      if (data.tags.length > 5) {
        throw new Error(
          "Free plan users can create up to 5 tags for a blog. Upgrade your plan to add more."
        );
      }
    }

    const blog = await prisma.blog.create({
      data: {
        title: data.title,
        content: data.content,
        slug: createSlug(data.title),
        authorId: userId,
        tags: {
          connectOrCreate: data.tags.map(name => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: {
        tags: true,
        likes: true,
        author: {
          select: {
            username: true,
            avatar: true,
            id: true
          }
        }
      },
    });

    emitBlogCreated(blog as any);
    return blog
  }

  async getBlogs(limit: number) {
    return prisma.blog.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        likes: {
          select: {
            userId: true
          }
        },
  
        author: {
          select: {
            id: true,
            avatar: true,
            username: true,
          },
        },
  
        tags: {
          select: {
            name: true,
          },
        },
        
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });
  }
  
  async getBlog(slug: string) {
    return prisma.blog.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        likes: true,
        tags: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      }
    });
  }

  async searchBlogs(query: string) {
    const blogs = await prisma.blog.findMany({
      where: { title: { contains: query, mode: "insensitive" } },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        likes: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          },
        },
        tags: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      },
    })

    return blogs
  }

  async getBlogsByTag(tag: string) {
    const blogs  = await prisma.blog.findMany({
      where: { tags: { some: { name: tag } }},
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        likes: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          },
        },
        tags: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      },
    })

    return blogs
  }

  async getMyBlogs(userId: string) {
    const blogs = await prisma.blog.findMany({
      where: { authorId: userId },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          },
        },
        tags: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      },
    })
    return blogs
  }

  async getUserBlogs(userId: string) {
    const blogs = await prisma.blog.findMany({
      where: { authorId: userId },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        tags: true,
        slug: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      }
    })

    return blogs
  }

  async updateBlog(userId: string, blogId: string, data: UpdateBlogDto) {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  
    if (!blog) throw new Error("Blog not found");
    if (blog.authorId !== userId) throw new Error("Forbidden");
  
    const UpdatedBlog = await prisma.blog.update({
      where: { id: blogId },
      data: {
        title: data.title,
        content: data.content,
        ...(data.tags && {
          tags: {
            set: [],
            connectOrCreate: data.tags.map(name => ({
              where: { name },
              create: { name },
            })),
          },
        }),
      },
      include: {
        author: true,
        tags: true,
        likes: true
      },
    })

    emitBlogUpdated(UpdatedBlog as any);
    return UpdatedBlog
  }
  
  async deleteBlog(userId: string, role: string, blogId: string) {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  
    if (!blog) throw new Error("Blog not found");
    if (blog.authorId !== userId && role !== "ADMIN")
      throw new Error("Forbidden");
    
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { blogId } }),
    ]);
    
    const deletedBlog = await prisma.blog.delete({
      where: { id: blogId },
    });

    emitBlogDeleted(deletedBlog.id);
    return deletedBlog
  }

  async addComment(userId: string, blogId: string, content: string) {
    const comment = await prisma.comment.create({
      data: { content, authorId: userId, blogId },
      include: { author: { select: { id: true, avatar: true, username: true }, },  },
    });

    emitAddBlogComment(comment as any)
    return comment
  }
  
  async getComments(blogId: string) {
    return prisma.comment.findMany({
      where: { blogId },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, avatar: true, username: true }, },  },
    });
  }
  
  async updateComment(userId: string, commentId: string, content: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== userId) throw new Error("Forbidden");
    

    const deleted = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: { author: { select: { id: true, avatar: true, username: true }, },  },
    });

    emitUpdateBlogComment(deleted as any)
    return deleted
  }
  
  async deleteComment(userId: string, role: string, commentId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== userId && role !== "ADMIN")
      throw new Error("Forbidden");
    
    emitDeleteBlogComment(comment as any)
    return prisma.comment.delete({
      where: { id: commentId },
    });
  }

  async likeBlog(userId: string, blogId: string) {
    if (await prisma.like.findUnique({ where: { userId_blogId: { userId, blogId } } }))
      throw new Error("Already liked");
    

    const like = await prisma.like.create({ data: { userId, blogId } });
    emitAddBlogLike(like, blogId)
    return like
  }
  
  async unlikeBlog(userId: string, blogId: string) {
    if (!(await prisma.like.findUnique({ where: { userId_blogId: { userId, blogId } } })))
      throw new Error("Like not found");
  
    const like = await prisma.like.delete({ where: { userId_blogId: { userId, blogId } } });
    emitRemoveBlogLike(like, blogId)
    return like
  }

  async getBlogsByFilter(
    filter: "latest" | "oldest" | "popular" | "trending",
    limit: number
  ) {
    const orderBy =
      filter === "latest"
        ? { createdAt: "desc" as const }
        : filter === "oldest"
        ? { createdAt: "asc" as const }
        : filter === "popular"
        ? { likes: { _count: "desc" as const } }
        : { comments: { _count: "desc" as const } };
  
    return prisma.blog.findMany({
      orderBy,
      take: limit,
      select: {
        likes: true,
        author: true,
        id: true,
        slug: true,
        tags: { select: { name: true }},
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        title: true,
        createdAt: true,
      }
    });
  }
}

export default new BlogService();