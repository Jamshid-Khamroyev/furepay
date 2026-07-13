import { prisma } from "../config/db.ts";

interface UpdateUserDto {
    username?: string;
    bio?: string;
    avatar?: string;
}

class UserService {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      omit: { password: true },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    return user;
  }

  async updateMe(userId: string, data: UpdateUserDto) {
    const allowedFields = ["username", "bio", "avatar"];
    const receivedFields = Object.keys(data);
  
    const invalidFields = receivedFields.filter(
      (field) => !allowedFields.includes(field)
    );
  
    if (invalidFields.length > 0) {
      throw new Error(
        `You are not allowed to update: ${invalidFields.join(", ")}.`
      );
    }
  
    const user = await prisma.user.findUnique({
      where: { id: userId },
      omit: { password: true },
    });
  
    if (!user) {
      throw new Error("User not found.");
    }
  
    return await prisma.user.update({
      where: { id: userId },
      data: {
        username: data.username,
        bio: data.bio,
        avatar: data.avatar,
      },
      omit: { password: true },
    });
  }

  async blockUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
  
    if (!user) {
      throw new Error("User not found.");
    }
  
    return await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: !user.isBlocked },
      omit: { password: true },
    });
  }

  async allUsers(limit: number) {
    const users = await prisma.user.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        avatar: true,
        username: true,
        isBlocked: true,
        bio: true,
        plan: true,
        role: true,
        createdAt: true,
    
        _count: {
          select: {
            notes: true,
            blogs: true,
            comments: true,
            likes: true
          },
        },
      },
    });

    return users
  }

  async userProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) throw new Error("User not found!");
    
    const { password, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  }
}

export default new UserService();