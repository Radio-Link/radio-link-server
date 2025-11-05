import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "../models/userModel";
import { generateToken } from "../utils/generateToken";

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;

  try {
    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, password: hashedPassword });

    const token = generateToken(String(user.id!));
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  
  try {
    const user = await findUserByEmail(email);
    if (!user || !user.password)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(String(user.id!));
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err });
  }
}
