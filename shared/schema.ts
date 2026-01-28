import { z } from "zod";

// User roles
export type UserRole = "admin" | "operator";

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["admin", "operator"]),
  products: z.array(z.string()),
  createdAt: z.string(),
});

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

// Field types
export type FieldType = "text" | "number" | "percentage" | "currency" | "select";
export type FieldFrequency = "weekly" | "monthly";
export type FieldCategory = "kr1" | "kr2" | "kr3" | "northstar";

// Field definition
export interface FieldDefinition {
  name: string;
  placeholder: string;
  type: FieldType;
  description: string;
  example: string;
  frequency: FieldFrequency;
  category: FieldCategory;
}

// Product
export interface Product {
  id: string;
  name: string;
  slideNumber: number;
  fields: FieldDefinition[];
}

// Submission schema
export const submissionSchema = z.object({
  id: z.string(),
  productId: z.string(),
  fieldName: z.string(),
  value: z.string(),
  userEmail: z.string(),
  periodType: z.enum(["weekly", "monthly"]),
  periodStart: z.string(),
  updatedAt: z.string(),
});

export const insertSubmissionSchema = submissionSchema.omit({ id: true, updatedAt: true });

export type Submission = z.infer<typeof submissionSchema>;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

// Deck generation
export const deckGenerationSchema = z.object({
  id: z.string(),
  generatedBy: z.string(),
  periodType: z.enum(["weekly", "monthly"]),
  periodStart: z.string(),
  slidesUrl: z.string().nullable(),
  status: z.enum(["pending", "in_progress", "completed", "failed"]),
  createdAt: z.string(),
});

export type DeckGeneration = z.infer<typeof deckGenerationSchema>;

// Financial record (LivePlan data)
export const financialRecordSchema = z.object({
  id: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  revenue: z.number(),
  expenses: z.number(),
  operatingIncome: z.number(),
  operatingMargin: z.number(),
  netProfit: z.number(),
  cashBalance: z.number(),
  accountsReceivable: z.number(),
  daysToGetPaid: z.number(),
  updatedAt: z.string(),
  updatedBy: z.string(),
});

export const insertFinancialRecordSchema = financialRecordSchema.omit({ id: true, updatedAt: true });

export type FinancialRecord = z.infer<typeof financialRecordSchema>;
export type InsertFinancialRecord = z.infer<typeof insertFinancialRecordSchema>;

// Products data
function generateFields(prefix: string): FieldDefinition[] {
  return [
    // KR1 - Sales & Marketing
    { name: "TOF Actual", placeholder: `${prefix}_TOF_Actual`, type: "number", description: "Top of Funnel visitors", example: "1250", frequency: "weekly", category: "kr1" },
    { name: "TOF Target", placeholder: `${prefix}_TOF_Target`, type: "number", description: "TOF target", example: "1500", frequency: "monthly", category: "kr1" },
    { name: "TOF Percent", placeholder: `${prefix}_TOF_Percent`, type: "percentage", description: "TOF % of target", example: "83", frequency: "weekly", category: "kr1" },
    { name: "MOF Actual", placeholder: `${prefix}_MOF_Actual`, type: "number", description: "Middle of Funnel leads", example: "125", frequency: "weekly", category: "kr1" },
    { name: "MOF Target", placeholder: `${prefix}_MOF_Target`, type: "number", description: "MOF target", example: "150", frequency: "monthly", category: "kr1" },
    { name: "MOF Percent", placeholder: `${prefix}_MOF_Percent`, type: "percentage", description: "MOF % of target", example: "83", frequency: "weekly", category: "kr1" },
    { name: "BOF Actual", placeholder: `${prefix}_BOF_Actual`, type: "number", description: "Bottom of Funnel conversions", example: "12", frequency: "weekly", category: "kr1" },
    { name: "BOF Target", placeholder: `${prefix}_BOF_Target`, type: "number", description: "BOF target", example: "15", frequency: "monthly", category: "kr1" },
    { name: "BOF Percent", placeholder: `${prefix}_BOF_Percent`, type: "percentage", description: "BOF % of target", example: "80", frequency: "weekly", category: "kr1" },
    { name: "Revenue Actual", placeholder: `${prefix}_Revenue_Actual`, type: "currency", description: "Actual revenue", example: "45000", frequency: "weekly", category: "kr1" },
    { name: "Revenue Target", placeholder: `${prefix}_Revenue_Target`, type: "currency", description: "Revenue target", example: "50000", frequency: "monthly", category: "kr1" },
    { name: "Revenue Percent", placeholder: `${prefix}_Revenue_Percent`, type: "percentage", description: "Revenue % of target", example: "90", frequency: "weekly", category: "kr1" },
    // KR2 - Development
    { name: "Sprint Velocity", placeholder: `${prefix}_Sprint_Actual`, type: "number", description: "Sprint velocity", example: "42", frequency: "weekly", category: "kr2" },
    { name: "Sprint Target", placeholder: `${prefix}_Sprint_Target`, type: "number", description: "Sprint target", example: "50", frequency: "monthly", category: "kr2" },
    { name: "Sprint Percent", placeholder: `${prefix}_Sprint_Percent`, type: "percentage", description: "Sprint % of target", example: "84", frequency: "weekly", category: "kr2" },
    { name: "Bug Count", placeholder: `${prefix}_Bug_Actual`, type: "number", description: "Open bugs", example: "8", frequency: "weekly", category: "kr2" },
    { name: "Bug Target", placeholder: `${prefix}_Bug_Target`, type: "number", description: "Bug target (max)", example: "5", frequency: "monthly", category: "kr2" },
    { name: "Bug Percent", placeholder: `${prefix}_Bug_Percent`, type: "percentage", description: "Bug % of target", example: "160", frequency: "weekly", category: "kr2" },
    // KR3 - Operations
    { name: "Uptime Actual", placeholder: `${prefix}_Uptime_Actual`, type: "percentage", description: "System uptime", example: "99.8", frequency: "weekly", category: "kr3" },
    { name: "Uptime Target", placeholder: `${prefix}_Uptime_Target`, type: "percentage", description: "Uptime target", example: "99.9", frequency: "monthly", category: "kr3" },
    { name: "Response Time", placeholder: `${prefix}_Response_Actual`, type: "number", description: "Avg response (ms)", example: "125", frequency: "weekly", category: "kr3" },
    { name: "Response Target", placeholder: `${prefix}_Response_Target`, type: "number", description: "Response target", example: "100", frequency: "monthly", category: "kr3" },
    // North Star Metrics
    { name: "Trend", placeholder: `${prefix}_TREND`, type: "select", description: "Product trend", example: "up", frequency: "weekly", category: "northstar" },
    { name: "Days to Revenue", placeholder: `${prefix}_DAYS_TO_REV`, type: "number", description: "Days to revenue", example: "45", frequency: "weekly", category: "northstar" },
    { name: "Days to Rev Target", placeholder: `${prefix}_DAYS_TO_REV_TGT`, type: "number", description: "Target days", example: "30", frequency: "monthly", category: "northstar" },
    { name: "Revenue Quality", placeholder: `${prefix}_REV_QUALITY_INDEX`, type: "number", description: "Quality index (1-10)", example: "7.5", frequency: "weekly", category: "northstar" },
    { name: "Customer Conc %", placeholder: `${prefix}_CUSTOMER_CONC_PCT`, type: "percentage", description: "Top 3 customer %", example: "60", frequency: "monthly", category: "northstar" },
    { name: "Churn Rate", placeholder: `${prefix}_CHURN`, type: "percentage", description: "Monthly churn", example: "2.5", frequency: "monthly", category: "northstar" },
    { name: "GAAP Revenue", placeholder: `${prefix}_GAAP`, type: "currency", description: "GAAP revenue", example: "125000", frequency: "monthly", category: "northstar" },
    { name: "Product Score", placeholder: `${prefix}_PROD_SCORE`, type: "number", description: "Score (1-100)", example: "78", frequency: "weekly", category: "northstar" },
  ];
}

export const products: Product[] = [
  { id: "stigviewer", name: "STIGViewer", slideNumber: 5, fields: generateFields("STIGViewer") },
  { id: "deepfeedback", name: "DeepFeedback", slideNumber: 6, fields: generateFields("DeepFeedback") },
  { id: "prmvp", name: "PRMVP", slideNumber: 7, fields: generateFields("PRMVP") },
  { id: "sams", name: "SAMS", slideNumber: 8, fields: generateFields("SAMS") },
  { id: "reggenome", name: "RegGenome", slideNumber: 9, fields: generateFields("RegGenome") },
];

export function getProduct(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function getFieldsByCategory(product: Product, category: FieldCategory): FieldDefinition[] {
  return product.fields.filter(f => f.category === category);
}

export function getFieldsByFrequency(product: Product, frequency: FieldFrequency): FieldDefinition[] {
  return product.fields.filter(f => f.frequency === frequency);
}

// Period helpers
export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export function getCurrentMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
}
