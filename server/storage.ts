import { randomUUID } from "crypto";
import type { User, InsertUser, Submission, InsertSubmission, DeckGeneration } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Submission operations
  getSubmission(productId: string, fieldName: string, periodStart: string): Promise<Submission | undefined>;
  setSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissionsForProduct(productId: string, periodType: string, periodStart: string): Promise<Submission[]>;
  getAllSubmissions(periodType: string, periodStart: string): Promise<Submission[]>;

  // Deck generation operations
  createDeckGeneration(generation: Omit<DeckGeneration, "id" | "createdAt">): Promise<DeckGeneration>;
  updateDeckGeneration(id: string, updates: Partial<DeckGeneration>): Promise<DeckGeneration | undefined>;
  getRecentGenerations(limit?: number): Promise<DeckGeneration[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private submissions: Map<string, Submission>;
  private generations: Map<string, DeckGeneration>;

  constructor() {
    this.users = new Map();
    this.submissions = new Map();
    this.generations = new Map();

    // Seed an admin user for demo purposes
    const adminId = randomUUID();
    const adminUser: User = {
      id: adminId,
      email: "admin@moxywolf.com",
      password: "YWRtaW4xMjM=", // base64 of "admin123"
      name: "Admin User",
      role: "admin",
      products: ["stigviewer", "deepfeedback", "prmvp", "sams", "reggenome"],
      createdAt: new Date().toISOString(),
    };
    this.users.set(adminId, adminUser);

    // Seed Dorian as admin
    const dorianId = randomUUID();
    const dorianUser: User = {
      id: dorianId,
      email: "dorianc@moxywolf.com",
      password: "TGV0bWVpbjIzNCQ=", // base64 of "Letmein234$"
      name: "Dorian C",
      role: "admin",
      products: ["stigviewer", "deepfeedback", "prmvp", "sams", "reggenome"],
      createdAt: new Date().toISOString(),
    };
    this.users.set(dorianId, dorianUser);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Submission operations
  private getSubmissionKey(productId: string, fieldName: string, periodStart: string): string {
    return `${productId}:${fieldName}:${periodStart}`;
  }

  async getSubmission(productId: string, fieldName: string, periodStart: string): Promise<Submission | undefined> {
    const key = this.getSubmissionKey(productId, fieldName, periodStart);
    return this.submissions.get(key);
  }

  async setSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const key = this.getSubmissionKey(
      insertSubmission.productId,
      insertSubmission.fieldName,
      insertSubmission.periodStart
    );
    
    const submission: Submission = {
      ...insertSubmission,
      id: randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    
    this.submissions.set(key, submission);
    return submission;
  }

  async getSubmissionsForProduct(productId: string, periodType: string, periodStart: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (sub) =>
        sub.productId === productId &&
        sub.periodType === periodType &&
        sub.periodStart === periodStart
    );
  }

  async getAllSubmissions(periodType: string, periodStart: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (sub) => sub.periodType === periodType && sub.periodStart === periodStart
    );
  }

  // Deck generation operations
  async createDeckGeneration(generation: Omit<DeckGeneration, "id" | "createdAt">): Promise<DeckGeneration> {
    const id = randomUUID();
    const newGeneration: DeckGeneration = {
      ...generation,
      id,
      createdAt: new Date().toISOString(),
    };
    this.generations.set(id, newGeneration);
    return newGeneration;
  }

  async updateDeckGeneration(id: string, updates: Partial<DeckGeneration>): Promise<DeckGeneration | undefined> {
    const generation = this.generations.get(id);
    if (!generation) return undefined;
    
    const updatedGeneration = { ...generation, ...updates };
    this.generations.set(id, updatedGeneration);
    return updatedGeneration;
  }

  async getRecentGenerations(limit: number = 10): Promise<DeckGeneration[]> {
    return Array.from(this.generations.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
