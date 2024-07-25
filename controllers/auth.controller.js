

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { ObjectId } from "mongodb";

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hard-coded admin credentials
    if (username === "admin" && password === "admin123") {
      const user = await prisma.user.findUnique({
        where: { username: 'admin' },
      });

      if (!user) {
        return res.status(400).json({ message: "Admin user does not exist!" });
      }

      const age = 1000 * 60 * 60 * 24 * 7; // 1 week

      const token = jwt.sign(
        {
          id: user.id, // Use the string ID directly
          isAdmin: true,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: age }
      );

      res
        .cookie("token", token, {
          httpOnly: true,
          maxAge: age,
        })
        .status(200)
        .json(user);
      return; // Ensure the function exits after admin login
    }

    // Regular user login
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) return res.status(400).json({ message: "Invalid Credentials!" });

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid Credentials!" });

    const age = 1000 * 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        id: user.id, // Ensure the ID is a string
        isAdmin: false,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    const { password: userPassword, ...userInfo } = user;

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
      })
      .status(200)
      .json(userInfo);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

export const register = async (req, res) => {
  let { username, email, password } = req.body;

  try {
    // FIX ADMIN USERNAME AND PASSWORD
    if (username === "admin") {
      return res.status(400).json({ message: "Cannot register as admin!" });
    }

    // HASH THE PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // CREATE A NEW USER AND SAVE TO DB
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create user!" });
  }
};


export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};
