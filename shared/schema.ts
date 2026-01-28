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
export type FieldType = "text" | "number" | "percentage" | "currency" | "select" | "textarea";
export type FieldFrequency = "weekly" | "monthly";
export type FieldCategory = "kr1" | "kr2" | "kr3" | "northstar";

// KR2 Status
export type KR2Status = "pre-launch" | "post-launch";

// KR3 Focus Areas
export type KR3FocusArea = "onboarding" | "support" | "content" | "custom";

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

// KR1 Fields - Sales & Marketing (Actual/Target with calculated Percent)
export interface KR1Fields {
  tofActual: string;
  tofTarget: string;
  mofActual: string;
  mofTarget: string;
  bofActual: string;
  bofTarget: string;
  revenueActual: string;
  revenueTarget: string;
}

// KR2 Pre-Launch Fields
export interface KR2PreLaunchFields {
  status: "pre-launch";
  sprintName: string;
  tasksCompleted: string;
  tasksTotal: string;
  blockersCount: string;
  criticalBlockers: string;
  blockerDetails: string;
}

// KR2 Post-Launch Fields
export interface KR2PostLaunchFields {
  status: "post-launch";
  uptimeActual: string;
  uptimeTarget: string;
  responseTimeActual: string;
  responseTimeTarget: string;
  errorRateActual: string;
  errorRateTarget: string;
}

export type KR2Fields = KR2PreLaunchFields | KR2PostLaunchFields;

// KR3 Focus Area Fields
export interface KR3OnboardingFields {
  focusArea: "onboarding";
  customersOnboarded: string;
  onboardingTarget: string;
  completionRate: string;
  avgTimeToValue: string;
  timeToValueTarget: string;
}

export interface KR3SupportFields {
  focusArea: "support";
  supportTickets: string;
  avgResolutionTime: string;
  resolutionTarget: string;
  escalations: string;
  csatScore: string;
}

export interface KR3ContentFields {
  focusArea: "content";
  blogPosts: string;
  caseStudies: string;
  webinars: string;
  totalViews: string;
  conversionRate: string;
}

export interface KR3CustomFields {
  focusArea: "custom";
  metric1Name: string;
  metric1Value: string;
  metric2Name: string;
  metric2Value: string;
  metric3Name: string;
  metric3Value: string;
  notes: string;
}

export type KR3Fields = KR3OnboardingFields | KR3SupportFields | KR3ContentFields | KR3CustomFields;

// North Star Fields (unchanged from before)
export interface NorthStarFields {
  trend: string;
  daysToRevenue: string;
  daysToRevTarget: string;
  revenueQuality: string;
  customerConcPct: string;
  churnRate: string;
  gaapRevenue: string;
  productScore: string;
}

// Products data - simplified field definitions for North Star only (KR1/KR2/KR3 handled separately)
function generateNorthStarFields(prefix: string): FieldDefinition[] {
  return [
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
  { id: "stigviewer", name: "STIGViewer", slideNumber: 5, fields: generateNorthStarFields("STIGViewer") },
  { id: "deepfeedback", name: "DeepFeedback", slideNumber: 6, fields: generateNorthStarFields("DeepFeedback") },
  { id: "prmvp", name: "PRMVP", slideNumber: 7, fields: generateNorthStarFields("PRMVP") },
  { id: "sams", name: "SAMS", slideNumber: 8, fields: generateNorthStarFields("SAMS") },
  { id: "reggenome", name: "RegGenome", slideNumber: 9, fields: generateNorthStarFields("RegGenome") },
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

// Calculate percentage with color coding
export function calculatePercent(actual: number, target: number): { value: number; color: "green" | "yellow" | "red" } {
  if (target <= 0) return { value: 0, color: "red" };
  const percent = (actual / target) * 100;
  let color: "green" | "yellow" | "red" = "red";
  if (percent >= 100) color = "green";
  else if (percent >= 80) color = "yellow";
  return { value: Math.round(percent * 10) / 10, color };
}

// For metrics where lower is better (error rate, response time, etc)
export function calculatePercentInverse(actual: number, target: number): { value: number; color: "green" | "yellow" | "red" } {
  if (target <= 0) return { value: 0, color: "red" };
  let color: "green" | "yellow" | "red" = "red";
  if (actual <= target) color = "green";
  else if (actual <= target * 1.2) color = "yellow";
  const percent = (actual / target) * 100;
  return { value: Math.round(percent * 10) / 10, color };
}
