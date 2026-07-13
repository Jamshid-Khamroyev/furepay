import { getIO } from "../index";
import { Blog, Comment } from "../types";

export function emitBlogCreated(blog: Blog) {
    getIO().emit("blog:created", blog);
}

export function emitBlogUpdated(blog: Blog) {
    getIO().emit("blog:updated", blog);
}

export function emitBlogDeleted(id: string) {
    getIO().emit("blog:deleted", {
        id,
    });
}

export function emitAddBlogComment(comment: Comment) {
    getIO().emit("blog:comment:add", comment);
}

export function emitDeleteBlogComment(comment: Comment) {
    getIO().emit("blog:comment:delete", comment);
}

export function emitUpdateBlogComment(comment: Comment) {
    getIO().emit("blog:comment:update", comment);
}

export function emitAddBlogLike(like: { userId: string }, blogId: string) {
    getIO().emit("blog:like", { like, blogId });
}


export function emitRemoveBlogLike(like: { userId: string }, blogId: string) {
    getIO().emit("blog:unlike", { like, blogId });
}