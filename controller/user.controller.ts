import { prisma } from "@/lib/prisma";
import { UserInterface } from "@/interface/interface";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ApiError } from "@/utils/ApiError";
import asyncHandler from "@/utils/AsyncHandlerService";

const generateHash = async (password: string) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const generateAccessToken = async (id: string, name: string, email: string, role: string) => {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN;
  return jwt.sign({ id, name, email, role }, process.env.MY_SECRET_KEY as string, {
    expiresIn: expiresIn ?? "7d",
  });
};

const normalizeRole = (role: string) => String(role || "").trim().toUpperCase();

const RegisterUser = asyncHandler(async (data: Omit<UserInterface, "id">) => {
  const { name, email, role, password } = data;

  if (!name || !email || !role || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const checkUser = await prisma.user.findUnique({
    where: { email: email },
  });

  if (checkUser) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await generateHash(password);
  const normalizedRole = normalizeRole(role);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: normalizedRole,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return user;
});

const LoginUser = asyncHandler(async (data: Pick<UserInterface, "email" | "password" | "role" | "name">) => {
  const { email, password, role } = data;

  if (!email || !password || !role) {
    throw new ApiError(400, "All fields are required");
  }

  const fetchUser = await prisma.user.findUnique({
    where: { email: email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      password: true,
    },
  });

  if (!fetchUser) {
    throw new ApiError(400, "User does not exist");
  }

  const isPasswordValid = await bcrypt.compare(password, fetchUser.password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Password is incorrect");
  }

  const requestRole = normalizeRole(role);
  const userRole = normalizeRole(fetchUser.role);
  if (requestRole !== userRole) {
    throw new ApiError(403, "Role does not match this account");
  }

  const accessToken = await generateAccessToken(fetchUser.id, fetchUser.name, fetchUser.email, userRole);

  const returnUser = {
    id: fetchUser.id,
    name: fetchUser.name,
    email: fetchUser.email,
    role: userRole,
  };

  return { returnUser, accessToken };
});

export { RegisterUser, LoginUser };
