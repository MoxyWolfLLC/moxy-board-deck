import { randomUUID } from "crypto";
import Database from "@replit/database";
import type { User, InsertUser, Submission, InsertSubmission, DeckGeneration, FinancialRecord, InsertFinancialRecord } from "@shared/schema";

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

  // Financial record operations
  getFinancialRecord(period: string): Promise<FinancialRecord | undefined>;
  setFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord>;
  getAllFinancialRecords(): Promise<FinancialRecord[]>;
}

// Helper to unwrap Replit DB results
async function dbGet<T>(db: Database, key: string): Promise<T | null> {
  try {
    const result = await db.get(key);
    if (result && typeof result === 'object' && 'ok' in result) {
      return result.ok ? (result as any).value : null;
    }
    return result as T | null;
  } catch {
    return null;
  }
}

async function dbList(db: Database, prefix: string): Promise<string[]> {
  try {
    const result = await db.list(prefix);
    if (result && typeof result === 'object' && 'ok' in result) {
      return result.ok ? (result as any).value : [];
    }
    return (result as string[]) || [];
  } catch {
    return [];
  }
}

export class ReplitDBStorage implements IStorage {
  private db: Database;
  private initialized: boolean = false;

  constructor() {
    this.db = new Database();
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    // Check if admin user exists
    const adminExists = await this.getUserByEmail("admin@moxywolf.com");
    if (!adminExists) {
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
      await this.db.set(`user:${adminId}`, adminUser);
      await this.db.set(`user_email:${adminUser.email.toLowerCase()}`, adminId);
    }

    // Check if Dorian user exists - ensure role is admin
    const dorianExists = await this.getUserByEmail("dorianc@moxywolf.com");
    if (!dorianExists) {
      const dorianId = randomUUID();
      const dorianUser: User = {
        id: dorianId,
        email: "dorianc@moxywolf.com",
        password: "TGV0bWVpbjIzNCQ=", // base64 of "Letmein234$"
        name: "Dorian Cougias",
        role: "admin",
        products: ["stigviewer", "deepfeedback", "reggenome"],
        createdAt: new Date().toISOString(),
      };
      await this.db.set(`user:${dorianId}`, dorianUser);
      await this.db.set(`user_email:${dorianUser.email.toLowerCase()}`, dorianId);
    } else if (dorianExists.role !== "admin") {
      // Fix: Ensure Dorian is always admin
      await this.updateUser(dorianExists.id, { role: "admin" });
    }

    this.initialized = true;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const user = await dbGet<User>(this.db, `user:${id}`);
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const userId = await dbGet<string>(this.db, `user_email:${email.toLowerCase()}`);
    if (!userId) return undefined;
    return this.getUser(userId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date().toISOString(),
    };
    await this.db.set(`user:${id}`, user);
    await this.db.set(`user_email:${user.email.toLowerCase()}`, id);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    // If email is being updated, update the email index
    if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
      await this.db.delete(`user_email:${user.email.toLowerCase()}`);
      await this.db.set(`user_email:${updates.email.toLowerCase()}`, id);
    }
    
    const updatedUser = { ...user, ...updates };
    await this.db.set(`user:${id}`, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;
    
    await this.db.delete(`user:${id}`);
    await this.db.delete(`user_email:${user.email.toLowerCase()}`);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    const keys = await dbList(this.db, "user:");
    const users: User[] = [];
    for (const key of keys) {
      if (key.startsWith("user_email:")) continue; // Skip email index keys
      const user = await dbGet<User>(this.db, key);
      if (user) users.push(user);
    }
    return users;
  }

  // Submission operations
  private getSubmissionKey(productId: string, fieldName: string, periodStart: string): string {
    return `submission:${productId}:${fieldName}:${periodStart}`;
  }

  async getSubmission(productId: string, fieldName: string, periodStart: string): Promise<Submission | undefined> {
    const key = this.getSubmissionKey(productId, fieldName, periodStart);
    const submission = await dbGet<Submission>(this.db, key);
    return submission || undefined;
  }

  async setSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const key = this.getSubmissionKey(
      insertSubmission.productId,
      insertSubmission.fieldName,
      insertSubmission.periodStart
    );
    
    const existing = await dbGet<Submission>(this.db, key);
    
    const submission: Submission = {
      ...insertSubmission,
      id: existing?.id || randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    
    await this.db.set(key, submission);
    return submission;
  }

  async getSubmissionsForProduct(productId: string, periodType: string, periodStart: string): Promise<Submission[]> {
    const prefix = `submission:${productId}:`;
    const keys = await dbList(this.db, prefix);
    const submissions: Submission[] = [];
    
    for (const key of keys) {
      const submission = await dbGet<Submission>(this.db, key);
      if (submission && submission.periodType === periodType && submission.periodStart === periodStart) {
        submissions.push(submission);
      }
    }
    
    return submissions;
  }

  async getAllSubmissions(periodType: string, periodStart: string): Promise<Submission[]> {
    const keys = await dbList(this.db, "submission:");
    const submissions: Submission[] = [];
    
    for (const key of keys) {
      const submission = await dbGet<Submission>(this.db, key);
      if (submission && submission.periodType === periodType && submission.periodStart === periodStart) {
        submissions.push(submission);
      }
    }
    
    return submissions;
  }

  // Deck generation operations
  async createDeckGeneration(generation: Omit<DeckGeneration, "id" | "createdAt">): Promise<DeckGeneration> {
    const id = randomUUID();
    const newGeneration: DeckGeneration = {
      ...generation,
      id,
      createdAt: new Date().toISOString(),
    };
    await this.db.set(`generation:${id}`, newGeneration);
    return newGeneration;
  }

  async updateDeckGeneration(id: string, updates: Partial<DeckGeneration>): Promise<DeckGeneration | undefined> {
    const generation = await dbGet<DeckGeneration>(this.db, `generation:${id}`);
    if (!generation) return undefined;
    
    const updatedGeneration = { ...generation, ...updates };
    await this.db.set(`generation:${id}`, updatedGeneration);
    return updatedGeneration;
  }

  async getRecentGenerations(limit: number = 10): Promise<DeckGeneration[]> {
    const keys = await dbList(this.db, "generation:");
    const generations: DeckGeneration[] = [];
    
    for (const key of keys) {
      const generation = await dbGet<DeckGeneration>(this.db, key);
      if (generation) generations.push(generation);
    }
    
    return generations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Financial record operations
  private getFinancialKey(periodStart: string): string {
    return `financial:${periodStart.slice(0, 7)}`; // "financial:2026-01" format
  }

  async getFinancialRecord(period: string): Promise<FinancialRecord | undefined> {
    const record = await dbGet<FinancialRecord>(this.db, `financial:${period}`);
    return record || undefined;
  }

  async setFinancialRecord(insertRecord: InsertFinancialRecord): Promise<FinancialRecord> {
    const key = this.getFinancialKey(insertRecord.periodStart);
    const existing = await dbGet<FinancialRecord>(this.db, key);
    
    const record: FinancialRecord = {
      ...insertRecord,
      id: existing?.id || randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    
    await this.db.set(key, record);
    return record;
  }

  async getAllFinancialRecords(): Promise<FinancialRecord[]> {
    const keys = await dbList(this.db, "financial:");
    const records: FinancialRecord[] = [];
    
    for (const key of keys) {
      const record = await dbGet<FinancialRecord>(this.db, key);
      if (record) records.push(record);
    }
    
    return records
      .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
  }
}

export const storage = new ReplitDBStorage();
