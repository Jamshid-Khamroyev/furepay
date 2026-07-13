import fs from "fs";
import { prisma } from "../config/db";
import imagekit from "../config/imagekit";
import { emitAddNoteLike, emitNoteCreated, emitNoteDeleted, emitNoteUpdated, emitRemoveNoteLike } from "../socket/events/note.event";


export interface CreateNoteDto {
  content?: string;
}

export interface UpdateNoteDto {
  content?: string;
}

class NoteService {
    async createNote(userId: string, data: CreateNoteDto, file?: Express.Multer.File) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if(user?.isBlocked){
        throw new Error("You are blocked from creating notes.");
      }
        if (!data.content?.trim() && !file) {
          throw new Error("Note must contain either content or an image.");
        }
      
        let uploadedFileId: string | undefined;
        let imageUrl: string | undefined;
        
        try {
          if (file) {
            const uploaded = await imagekit.upload({
                file: fs.readFileSync(file.path),
                fileName: file.filename,
                folder: "/notes",
              });
      
            uploadedFileId = uploaded.fileId;
            imageUrl = uploaded.url;
          }
      
          const note = await prisma.note.create({
            data: {
              content: data.content?.trim() || null,
              image: imageUrl,
              imageFileId: uploadedFileId,
              authorId: userId,
            },
            select: {
              id: true,
              content: true,
              image: true,
              likes: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                },
              },
            },
          });

          emitNoteCreated(note as any);
          return note;
        } catch (error) {
          if (uploadedFileId) {
            await imagekit.deleteFile(uploadedFileId).catch(() => {});
          }
      
          if (error instanceof Error) {
            throw new Error(error.message);
          }
      
          throw new Error("Failed to create note.");
        } finally {
            if(file){
                fs.unlink(file.path, () => {});
            }
        }
    }

    async updateNote(userId: string, noteId: string, data: UpdateNoteDto, file?: Express.Multer.File) {
        if (!data.content?.trim() && !file) {
            throw new Error("Nothing to update.");
        }
    
        const note = await prisma.note.findUnique({
            where: { id: noteId },
        });
    
        if (!note) {
            throw new Error("Note not found.");
        }
    
        if (note.authorId !== userId) {
            throw new Error("You are not allowed to update this note.");
        }
    
        let uploadedFileId: string | undefined;
        let imageUrl: string | undefined;
    
        try {
            if (file) {
                const uploaded = await imagekit.upload({
                    file: fs.readFileSync(file.path).toString("base64"),
                    fileName: file.filename,
                    folder: "/notes",
                });
    
                uploadedFileId = uploaded.fileId;
                imageUrl = uploaded.url;
            }
    
            const updatedNote = await prisma.note.update({
                where: {
                    id: noteId,
                },
                data: {
                    ...(data.content !== undefined && {
                        content: data.content.trim() || null,
                    }),
    
                    ...(file && {
                        image: imageUrl,
                        imageFileId: uploadedFileId,
                    }),
                },
            });
    
            if (file && note.imageFileId) {
                try {
                    await imagekit.deleteFile(note.imageFileId);
                } catch (err) {
                    console.error("Failed to delete old image:", err);
                }
            }
            
            emitNoteUpdated(updatedNote as any);
            return updatedNote;
        } catch (error: any) {
            if (uploadedFileId) {
                await imagekit.deleteFile(uploadedFileId).catch(() => {});
            }
    
            throw new Error(error.message || "Failed to update note.");
        } finally {
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
    }

    async deleteNote(userId: string, role: string, noteId: string) {
        const note = await prisma.note.findUnique({
          where: { id: noteId },
        });
      
        if (!note) {
          throw new Error("Note not found.");
        }
      
        if (note.authorId !== userId && role !== "ADMIN") {
          throw new Error("You are not allowed to delete this note.");
        }
      
        if (note.imageFileId) {
          await imagekit.deleteFile(note.imageFileId).catch(() => {});
        }
        
        emitNoteDeleted(noteId);
        await prisma.note.delete({
          where: { id: noteId },
        });
    }
      
    async likeNote(userId: string, noteId: string) {
        const note = await prisma.note.findUnique({
          where: { id: noteId },
        });
      
        if (!note) {
          throw new Error("Note not found.");
        }
      
        const exists = await prisma.like.findUnique({
          where: {
            userId_noteId: {
              userId,
              noteId,
            },
          },
        });
      
        if (exists) {
          throw new Error("You have already liked this note.");
        }
        
        emitAddNoteLike({ userId }, noteId);
        return await prisma.like.create({
          data: {
            userId,
            noteId,
          },
        });
    }
      
    async unlikeNote(userId: string, noteId: string) {
        const like = await prisma.like.findUnique({
          where: {
            userId_noteId: {
              userId,
              noteId,
            },
          },
        });
      
        if (!like) {
          throw new Error("You have not liked this note.");
        }
        
        emitRemoveNoteLike({ userId }, noteId);
        await prisma.like.delete({
          where: {
            userId_noteId: {
              userId,
              noteId,
            },
          },
        });
    }

    async AllNotes(limit: number){
        const notes = await prisma.note.findMany({
            take: limit,
            orderBy: {
              createdAt: "desc"
            },
            select: {
                id: true,
                content: true,
                image: true,
                likes: { select: {
                  userId: true
                }},
                createdAt: true,
                author: {
                    select: {
                        username: true,
                        avatar: true,
                        id: true
                    }
                },
                _count: {
                    select: {
                        likes: true
                    }
                },
            }
        })

        return notes
    }
}

export default new NoteService();