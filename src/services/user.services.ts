import bcrypt from "bcrypt";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { handleDatabaseError } from "../utils/dberror";
import { ApiError } from "../utils/Apierror";
export const createUser = async (
  name: string,
  email: string,
  password: string
) => {
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      });

    return user;
  } catch (error: unknown) {
    handleDatabaseError(error);
  }
};
export const findUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  return user;
};
export const getUserById = async (userId: number) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};