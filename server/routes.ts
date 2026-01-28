import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, loginSchema, insertSubmissionSchema } from "@shared/schema";

// Extend session type
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const MemoryStoreSession = MemoryStore(session);

// Password hashing (simple for demo - in production use bcrypt)
function hashPassword(password: string): string {
  // Simple hash for demo - in production use bcrypt
  return Buffer.from(password).toString("base64");
}

function verifyPassword(password: string, hash: string): boolean {
  return Buffer.from(password).toString("base64") === hash;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 * 7 }, // 7 days
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      secret: process.env.SESSION_SECRET || "moxywolf-secret-key-change-in-production",
      saveUninitialized: false,
    })
  );

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

  // ========================================
  // Auth Routes
  // ========================================

  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse({
        ...req.body,
        role: "operator", // New users are always operators
        products: [], // No products assigned by default
      });

      // Check if email exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password and create user
      const user = await storage.createUser({
        ...data,
        password: hashPassword(data.password),
      });

      res.json({ message: "Account created successfully", userId: user.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!verifyPassword(data.password, user.password)) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.session.userId = user.id;

      const redirect = user.role === "admin" ? "/admin" : "/dashboard";
      res.json({ message: "Login successful", redirect, user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ ...user, password: undefined });
  });

  // ========================================
  // Submission Routes
  // ========================================

  // Get submissions for a product
  app.get("/api/submissions", requireAuth, async (req: Request, res: Response) => {
    try {
      const { productId, periodType, periodStart } = req.query;

      if (!productId || !periodType || !periodStart) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const submissions = await storage.getSubmissionsForProduct(
        productId as string,
        periodType as string,
        periodStart as string
      );

      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Create/update a submission
  app.post("/api/submissions", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const data = insertSubmissionSchema.parse({
        ...req.body,
        userEmail: user.email,
      });

      const submission = await storage.setSubmission(data);
      res.json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to save submission" });
    }
  });

  // ========================================
  // Admin Routes
  // ========================================

  // Get all users
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map((u) => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create a user (admin)
  app.post("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);

      // Check if email exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const user = await storage.createUser({
        ...data,
        password: hashPassword(data.password),
      });

      res.json({ ...user, password: undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update a user (admin)
  app.patch("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, role, products } = req.body;

      const updatedUser = await storage.updateUser(id, { name, role, products });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete a user (admin)
  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Don't allow deleting yourself
      if (id === req.session.userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Get deck generations
  app.get("/api/admin/generations", requireAdmin, async (req: Request, res: Response) => {
    try {
      const generations = await storage.getRecentGenerations(20);
      res.json(generations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generations" });
    }
  });

  // Generate deck
  app.post("/api/admin/generate-deck", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { periodType, periodStart } = req.body;
      const user = await storage.getUser(req.session.userId!);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create a new deck generation record
      const generation = await storage.createDeckGeneration({
        generatedBy: user.email,
        periodType,
        periodStart,
        slidesUrl: null,
        status: "pending",
      });

      // In a real app, this would trigger an async job to generate the deck
      // For now, we'll simulate completing it
      setTimeout(async () => {
        await storage.updateDeckGeneration(generation.id, {
          status: "completed",
          slidesUrl: `https://docs.google.com/presentation/d/${generation.id}`,
        });
      }, 2000);

      res.json({
        message: "Deck generation started",
        generation,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate deck" });
    }
  });

  return httpServer;
}
