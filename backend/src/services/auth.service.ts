import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.ts";
import { googleClient } from "../config/google.ts";

interface SignupDto {
  username: string;
  email: string;
  avatar: string;
  password: string;
}

interface SigninDto {
  email: string;
  password: string;
}

class AuthService {
  async signup(data: SignupDto) {
    try {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

      if (existingUser) {
        throw new Error("An account with this email already exists.");
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          username: data.username,
          avatar: data.avatar,
          email: data.email,
          password: hashedPassword,
        },
        omit: { password: true }
      });

      const token = jwt.sign({ userId: user.id, plan: user.plan, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });

      return { user, token };
    } catch (error) {
      throw error;
    }
  }

  async signin(data: SigninDto) {
    try {
      const user = await prisma.user.findUnique({ where: { email: data.email } });

      if (!user) {
        throw new Error("No account found with the provided email.");
      }

      const isMatch = await bcrypt.compare(data.password, user.password);
      if (!isMatch) {
        throw new Error("The password you entered is incorrect.");
      }

      const token = jwt.sign({ userId: user.id, plan: user.plan, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
      const { password, ...userWithoutPassword } = user;

      return { user: userWithoutPassword, token };
    } catch (error) {
      throw error;
    }
  }

  async googleLogin(credential: string) {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  
    const payload = ticket.getPayload();
  
    if (!payload?.email || !payload.email_verified) {
      throw new Error("Invalid Google account.");
    }
  
    const { email, name, picture } = payload;
  
    let user = await prisma.user.findUnique({ where: { email } });
  
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: name || email.split("@")[0],
          avatar: picture,
          password: "", // No password for Google accounts
        },
      });
    }
  
    const token = jwt.sign(
      { userId: user.id, plan: user.plan, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );
  
    const { password, ...userWithoutPassword } = user;
  
    return { user: userWithoutPassword, token };
  }
}

export default new AuthService();