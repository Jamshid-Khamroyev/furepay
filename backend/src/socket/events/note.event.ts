import { getIO } from "../index";
import { Note } from "../types";

export function emitNoteCreated(note: Note) {
    getIO().emit("note:created", note);
}

export function emitNoteUpdated(note: Note) {
    getIO().emit("note:updated", note);
}

export function emitNoteDeleted(id: string) {
    getIO().emit("note:deleted", {
        id,
    });
}

export function emitAddNoteLike(like: { userId: string }, noteId: string) {
    getIO().emit("note:like", { like, noteId });
}

export function emitRemoveNoteLike(like: { userId: string }, noteId: string) {
    getIO().emit("note:unlike", { like, noteId });
}