import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  CheckCircle,
  Calendar,
  Clock,
  Target,
  Rocket,
  Shield,
  Users,
  Headphones,
  FileText,
  Settings
} from "lucide-react";
import type { Submission, KR2Status, KR3FocusArea } from "@shared/schema";
import { getProduct, getCurrentWeekStart, getCurrentMonthStart, calculatePercent, calculatePercentInverse } from "@shared/schema";

export default function SubmitPage() {
  const { productId } = useParams<{ productId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">("weekly");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set());
  
  // KR2 and KR3 state
  const [kr2Status, setKr2Status] = useState<KR2Status>("pre-launch");
  const [kr3FocusArea, setKr3FocusArea] = useState<KR3FocusArea>("onboarding");

  const product = getProduct(productId || "");
  const periodStart = periodType === "weekly" ? getCurrentWeekStart() : getCurrentMonthStart();

  const { data: submissions, isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/submissions", productId, periodType, periodStart],
    enabled: !!productId,
  });

  useEffect(() => {
    if (submissions) {
      const values: Record<string, string> = {};
      const saved = new Set<string>();
      submissions.forEach((sub) => {
        values[sub.fieldName] = sub.value;
        saved.add(sub.fieldName);
        // Restore KR2 and KR3 settings
        if (sub.fieldName === "_kr2_status") {
          setKr2Status(sub.value as KR2Status);
        }
        if (sub.fieldName === "_kr3_focus_area") {
          setKr3FocusArea(sub.value as KR3FocusArea);
        }
      });
      setFormValues(values);
      setSavedFields(saved);
    }
  }, [submissions]);

  const saveMutation = useMutation({
    mutationFn: async (data: { fieldName: string; value: string }) => {
      const response = await apiRequest("POST", "/api/submissions", {
        productId,
        fieldName: data.fieldName,
        value: data.value,
        periodType,
        periodStart,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      setSavedFields(prev => new Set(Array.from(prev).concat(variables.fieldName)));
      queryClient.invalidateQueries({ queryKey: ["/api/submissions", productId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveAllMutation = useMutation({
    mutationFn: async () => {
      const allFields = Object.entries(formValues).filter(([_, v]) => v?.trim());
      // Also save KR2 status and KR3 focus area
      allFields.push(["_kr2_status", kr2Status]);
      allFields.push(["_kr3_focus_area", kr3FocusArea]);
      
      for (const [fieldName, value] of allFields) {
        await apiRequest("POST", "/api/submissions", {
          productId,
          fieldName,
          value,
          periodType,
          periodStart,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions", productId] });
      toast({
        title: "All saved!",
        description: "All field values have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateField = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const saveField = (name: string, value: string) => {
    if (value.trim()) {
      saveMutation.mutate({ fieldName: name, value });
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
                  <p className="text-sm text-muted-foreground">Slide #{product.slideNumber}</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => saveAllMutation.mutate()}
              disabled={saveAllMutation.isPending}
              data-testid="button-save-all"
            >
              {saveAllMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save All
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Period:</span>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {periodStart}
            </Badge>
          </div>

          <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as "weekly" | "monthly")}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly Fields</TabsTrigger>
              <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly Fields</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {submissionsLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* KR1 - Sales & Marketing */}
            <KR1Section 
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
              isSaving={saveMutation.isPending}
            />

            {/* KR2 - Development */}
            <KR2Section
              status={kr2Status}
              onStatusChange={setKr2Status}
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
              isSaving={saveMutation.isPending}
            />

            {/* KR3 - Operations/Wildcard */}
            <KR3Section
              focusArea={kr3FocusArea}
              onFocusAreaChange={setKr3FocusArea}
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
              isSaving={saveMutation.isPending}
            />

            {/* North Star Metrics */}
            <NorthStarSection
              product={product}
              periodType={periodType}
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
              isSaving={saveMutation.isPending}
            />
          </div>
        )}
      </main>
    </div>
  );
}

// KR1 Section - Sales & Marketing with auto-calculated percentages
interface KR1SectionProps {
  formValues: Record<string, string>;
  savedFields: Set<string>;
  updateField: (name: string, value: string) => void;
  saveField: (name: string, value: string) => void;
  isSaving: boolean;
}

function KR1Section({ formValues, savedFields, updateField, saveField, isSaving }: KR1SectionProps) {
  const metrics = [
    { key: "tof", label: "TOF", description: "Top of Funnel visitors" },
    { key: "mof", label: "MOF", description: "Middle of Funnel leads" },
    { key: "bof", label: "BOF", description: "Bottom of Funnel conversions" },
    { key: "revenue", label: "Revenue", description: "Revenue amount", isCurrency: true },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-chart-1/10">
            <Target className="w-5 h-5 text-chart-1" />
          </div>
          <CardTitle>KR1 - Sales & Marketing</CardTitle>
        </div>
        <CardDescription>Track funnel metrics with automatic percentage calculations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {metrics.map((metric) => {
            const actualKey = `kr1_${metric.key}_actual`;
            const targetKey = `kr1_${metric.key}_target`;
            const actual = parseFloat(formValues[actualKey] || "0") || 0;
            const target = parseFloat(formValues[targetKey] || "0") || 0;
            const { value: percent, color } = calculatePercent(actual, target);

            return (
              <div key={metric.key} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 rounded-lg bg-muted/30">
                <div className="md:col-span-1">
                  <Label className="text-sm font-medium">{metric.label} Actual</Label>
                  <div className="relative mt-1">
                    {metric.isCurrency && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    )}
                    <Input
                      type="number"
                      value={formValues[actualKey] || ""}
                      onChange={(e) => updateField(actualKey, e.target.value)}
                      onBlur={(e) => saveField(actualKey, e.target.value)}
                      placeholder="0"
                      className={metric.isCurrency ? "pl-7" : ""}
                      data-testid={`input-${actualKey}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                </div>
                <div className="md:col-span-1">
                  <Label className="text-sm font-medium">{metric.label} Target</Label>
                  <div className="relative mt-1">
                    {metric.isCurrency && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    )}
                    <Input
                      type="number"
                      value={formValues[targetKey] || ""}
                      onChange={(e) => updateField(targetKey, e.target.value)}
                      onBlur={(e) => saveField(targetKey, e.target.value)}
                      placeholder="0"
                      className={metric.isCurrency ? "pl-7" : ""}
                      data-testid={`input-${targetKey}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Target value</p>
                </div>
                <div className="md:col-span-1">
                  <Label className="text-sm font-medium">{metric.label} %</Label>
                  <div className={`mt-1 px-4 py-2 rounded-md text-center font-bold text-lg ${
                    color === "green" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    color === "yellow" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {target > 0 ? `${percent}%` : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">Auto-calculated</p>
                </div>
                <div className="md:col-span-1 flex items-center justify-center">
                  {(savedFields.has(actualKey) || savedFields.has(targetKey)) && (
                    <div className="flex items-center gap-1 text-chart-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Saved</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// KR2 Section - Development with pre-launch/post-launch toggle
interface KR2SectionProps {
  status: KR2Status;
  onStatusChange: (status: KR2Status) => void;
  formValues: Record<string, string>;
  savedFields: Set<string>;
  updateField: (name: string, value: string) => void;
  saveField: (name: string, value: string) => void;
  isSaving: boolean;
}

function KR2Section({ status, onStatusChange, formValues, savedFields, updateField, saveField, isSaving }: KR2SectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-chart-2/10">
              <Rocket className="w-5 h-5 text-chart-2" />
            </div>
            <CardTitle>KR2 - Development</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Product Status:</Label>
            <Tabs value={status} onValueChange={(v) => onStatusChange(v as KR2Status)}>
              <TabsList>
                <TabsTrigger value="pre-launch" data-testid="tab-kr2-prelaunch">
                  <Shield className="w-4 h-4 mr-1" />
                  Pre-Launch
                </TabsTrigger>
                <TabsTrigger value="post-launch" data-testid="tab-kr2-postlaunch">
                  <Rocket className="w-4 h-4 mr-1" />
                  Post-Launch
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <CardDescription>
          {status === "pre-launch" ? "Track sprint progress and blockers" : "Monitor uptime, response times, and error rates"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "pre-launch" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Sprint Name</Label>
              <Input
                value={formValues["kr2_sprint_name"] || ""}
                onChange={(e) => updateField("kr2_sprint_name", e.target.value)}
                onBlur={(e) => saveField("kr2_sprint_name", e.target.value)}
                placeholder="e.g., Sprint 3"
                data-testid="input-kr2-sprint-name"
              />
              <p className="text-xs text-muted-foreground">Current sprint identifier</p>
            </div>
            <div className="space-y-2">
              <Label>Tasks Completed</Label>
              <Input
                type="number"
                value={formValues["kr2_tasks_completed"] || ""}
                onChange={(e) => updateField("kr2_tasks_completed", e.target.value)}
                onBlur={(e) => saveField("kr2_tasks_completed", e.target.value)}
                placeholder="0"
                data-testid="input-kr2-tasks-completed"
              />
              <p className="text-xs text-muted-foreground">Tasks done this sprint</p>
            </div>
            <div className="space-y-2">
              <Label>Tasks Total</Label>
              <Input
                type="number"
                value={formValues["kr2_tasks_total"] || ""}
                onChange={(e) => updateField("kr2_tasks_total", e.target.value)}
                onBlur={(e) => saveField("kr2_tasks_total", e.target.value)}
                placeholder="0"
                data-testid="input-kr2-tasks-total"
              />
              <p className="text-xs text-muted-foreground">Total tasks in sprint</p>
            </div>
            <div className="space-y-2">
              <Label>Sprint Progress</Label>
              {(() => {
                const completed = parseFloat(formValues["kr2_tasks_completed"] || "0") || 0;
                const total = parseFloat(formValues["kr2_tasks_total"] || "0") || 0;
                const { value: percent, color } = calculatePercent(completed, total);
                return (
                  <div className={`px-4 py-2 rounded-md text-center font-bold text-lg ${
                    color === "green" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    color === "yellow" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {total > 0 ? `${percent}%` : "-"}
                  </div>
                );
              })()}
              <p className="text-xs text-muted-foreground text-center">Auto-calculated</p>
            </div>
            <div className="space-y-2">
              <Label>Blockers Count</Label>
              <Input
                type="number"
                value={formValues["kr2_blockers_count"] || ""}
                onChange={(e) => updateField("kr2_blockers_count", e.target.value)}
                onBlur={(e) => saveField("kr2_blockers_count", e.target.value)}
                placeholder="0"
                data-testid="input-kr2-blockers-count"
              />
              <p className="text-xs text-muted-foreground">Number of blockers</p>
            </div>
            <div className="space-y-2">
              <Label>Critical Blockers</Label>
              <Input
                type="number"
                value={formValues["kr2_critical_blockers"] || ""}
                onChange={(e) => updateField("kr2_critical_blockers", e.target.value)}
                onBlur={(e) => saveField("kr2_critical_blockers", e.target.value)}
                placeholder="0"
                data-testid="input-kr2-critical-blockers"
              />
              <p className="text-xs text-muted-foreground">Critical blockers</p>
            </div>
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <Label>Blocker Details</Label>
              <Textarea
                value={formValues["kr2_blocker_details"] || ""}
                onChange={(e) => updateField("kr2_blocker_details", e.target.value)}
                onBlur={(e) => saveField("kr2_blocker_details", e.target.value)}
                placeholder="Describe blockers (optional)"
                rows={3}
                data-testid="input-kr2-blocker-details"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {[
              { key: "uptime", label: "Uptime", unit: "%", higherBetter: true },
              { key: "response_time", label: "Response Time", unit: "ms", higherBetter: false },
              { key: "error_rate", label: "Error Rate", unit: "%", higherBetter: false },
            ].map((metric) => {
              const actualKey = `kr2_${metric.key}_actual`;
              const targetKey = `kr2_${metric.key}_target`;
              const actual = parseFloat(formValues[actualKey] || "0") || 0;
              const target = parseFloat(formValues[targetKey] || "0") || 0;
              const { color } = metric.higherBetter 
                ? calculatePercent(actual, target) 
                : calculatePercentInverse(actual, target);

              return (
                <div key={metric.key} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 rounded-lg bg-muted/30">
                  <div>
                    <Label>{metric.label} Actual</Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={formValues[actualKey] || ""}
                        onChange={(e) => updateField(actualKey, e.target.value)}
                        onBlur={(e) => saveField(actualKey, e.target.value)}
                        placeholder="0"
                        data-testid={`input-${actualKey}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{metric.unit}</span>
                    </div>
                  </div>
                  <div>
                    <Label>{metric.label} Target</Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={formValues[targetKey] || ""}
                        onChange={(e) => updateField(targetKey, e.target.value)}
                        onBlur={(e) => saveField(targetKey, e.target.value)}
                        placeholder="0"
                        data-testid={`input-${targetKey}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{metric.unit}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className={`mt-1 px-4 py-2 rounded-md text-center font-bold ${
                      color === "green" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      color === "yellow" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {target > 0 ? (color === "green" ? "On Target" : color === "yellow" ? "Warning" : "Off Target") : "-"}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    {(savedFields.has(actualKey) || savedFields.has(targetKey)) && (
                      <div className="flex items-center gap-1 text-chart-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Saved</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// KR3 Section - Operations/Wildcard with focus area dropdown
interface KR3SectionProps {
  focusArea: KR3FocusArea;
  onFocusAreaChange: (area: KR3FocusArea) => void;
  formValues: Record<string, string>;
  savedFields: Set<string>;
  updateField: (name: string, value: string) => void;
  saveField: (name: string, value: string) => void;
  isSaving: boolean;
}

function KR3Section({ focusArea, onFocusAreaChange, formValues, savedFields, updateField, saveField, isSaving }: KR3SectionProps) {
  const focusOptions = [
    { value: "onboarding", label: "Customer Onboarding", icon: Users },
    { value: "support", label: "Customer Support", icon: Headphones },
    { value: "content", label: "Content & Marketing", icon: FileText },
    { value: "custom", label: "Custom (free-form)", icon: Settings },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-chart-4/10">
              <Settings className="w-5 h-5 text-chart-4" />
            </div>
            <CardTitle>KR3 - Operations / Wildcard</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Focus Area:</Label>
            <Select value={focusArea} onValueChange={(v) => onFocusAreaChange(v as KR3FocusArea)}>
              <SelectTrigger className="w-[200px]" data-testid="select-kr3-focus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {focusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>
          Flexible metrics section for team-specific priorities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {focusArea === "onboarding" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FieldInput
              label="Customers Onboarded"
              name="kr3_customers_onboarded"
              type="number"
              description="Customers who completed onboarding"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Onboarding Target"
              name="kr3_onboarding_target"
              type="number"
              description="Target number of customers"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <PercentDisplay
              label="Completion Rate"
              actual={parseFloat(formValues["kr3_customers_onboarded"] || "0") || 0}
              target={parseFloat(formValues["kr3_onboarding_target"] || "0") || 0}
            />
            <FieldInput
              label="Avg Time to Value"
              name="kr3_avg_time_to_value"
              type="number"
              description="Average days to first value"
              suffix="days"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Time to Value Target"
              name="kr3_time_to_value_target"
              type="number"
              description="Target days to value"
              suffix="days"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
          </div>
        )}

        {focusArea === "support" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FieldInput
              label="Support Tickets"
              name="kr3_support_tickets"
              type="number"
              description="Total tickets this period"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Avg Resolution Time"
              name="kr3_avg_resolution_time"
              type="number"
              description="Average resolution time"
              suffix="hrs"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Resolution Target"
              name="kr3_resolution_target"
              type="number"
              description="Target resolution time"
              suffix="hrs"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Escalations"
              name="kr3_escalations"
              type="number"
              description="Number of escalations"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="CSAT Score"
              name="kr3_csat_score"
              type="number"
              description="Customer satisfaction (1-5)"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
          </div>
        )}

        {focusArea === "content" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FieldInput
              label="Blog Posts"
              name="kr3_blog_posts"
              type="number"
              description="Published blog posts"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Case Studies"
              name="kr3_case_studies"
              type="number"
              description="Published case studies"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Webinars"
              name="kr3_webinars"
              type="number"
              description="Webinars hosted"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Total Views"
              name="kr3_total_views"
              type="number"
              description="Content views/engagement"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Conversion Rate"
              name="kr3_conversion_rate"
              type="number"
              description="Content conversion rate"
              suffix="%"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
          </div>
        )}

        {focusArea === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldInput
              label="Metric 1 Name"
              name="kr3_metric1_name"
              type="text"
              description="Custom metric name"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Metric 1 Value"
              name="kr3_metric1_value"
              type="text"
              description="Custom metric value"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Metric 2 Name"
              name="kr3_metric2_name"
              type="text"
              description="Custom metric name (optional)"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Metric 2 Value"
              name="kr3_metric2_value"
              type="text"
              description="Custom metric value (optional)"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Metric 3 Name"
              name="kr3_metric3_name"
              type="text"
              description="Custom metric name (optional)"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <FieldInput
              label="Metric 3 Value"
              name="kr3_metric3_value"
              type="text"
              description="Custom metric value (optional)"
              formValues={formValues}
              savedFields={savedFields}
              updateField={updateField}
              saveField={saveField}
            />
            <div className="md:col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formValues["kr3_notes"] || ""}
                onChange={(e) => updateField("kr3_notes", e.target.value)}
                onBlur={(e) => saveField("kr3_notes", e.target.value)}
                placeholder="Additional context (optional)"
                rows={3}
                data-testid="input-kr3-notes"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// North Star Section
interface NorthStarSectionProps {
  product: { fields: Array<{ name: string; placeholder: string; type: string; description: string; example: string; frequency: string; category: string }> };
  periodType: "weekly" | "monthly";
  formValues: Record<string, string>;
  savedFields: Set<string>;
  updateField: (name: string, value: string) => void;
  saveField: (name: string, value: string) => void;
  isSaving: boolean;
}

function NorthStarSection({ product, periodType, formValues, savedFields, updateField, saveField, isSaving }: NorthStarSectionProps) {
  const northStarFields = product.fields.filter(f => f.category === "northstar" && f.frequency === periodType);

  if (northStarFields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <CardTitle>North Star Metrics</CardTitle>
        </div>
        <CardDescription>Key performance indicators for product success</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {northStarFields.map((field) => {
            if (field.name === "Trend") {
              return (
                <div key={field.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{field.name}</Label>
                    {savedFields.has(field.name) && <CheckCircle className="w-4 h-4 text-chart-2" />}
                  </div>
                  <Select 
                    value={formValues[field.name] || ""} 
                    onValueChange={(v) => {
                      updateField(field.name, v);
                      saveField(field.name, v);
                    }}
                  >
                    <SelectTrigger data-testid={`select-${field.placeholder}`}>
                      <SelectValue placeholder="Select trend" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-chart-2" />
                          <span>Trending Up</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="down">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-destructive" />
                          <span>Trending Down</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="flat">
                        <div className="flex items-center gap-2">
                          <Minus className="w-4 h-4 text-muted-foreground" />
                          <span>Flat</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                </div>
              );
            }

            return (
              <FieldInput
                key={field.name}
                label={field.name}
                name={field.name}
                type={field.type === "currency" ? "currency" : field.type === "percentage" ? "percentage" : "number"}
                description={field.description}
                placeholder={field.example}
                formValues={formValues}
                savedFields={savedFields}
                updateField={updateField}
                saveField={saveField}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Reusable FieldInput component
interface FieldInputProps {
  label: string;
  name: string;
  type: "text" | "number" | "currency" | "percentage";
  description: string;
  placeholder?: string;
  suffix?: string;
  formValues: Record<string, string>;
  savedFields: Set<string>;
  updateField: (name: string, value: string) => void;
  saveField: (name: string, value: string) => void;
}

function FieldInput({ label, name, type, description, placeholder, suffix, formValues, savedFields, updateField, saveField }: FieldInputProps) {
  const isCurrency = type === "currency";
  const isPercentage = type === "percentage";
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {savedFields.has(name) && <CheckCircle className="w-4 h-4 text-chart-2" />}
      </div>
      <div className="relative">
        {isCurrency && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
        )}
        <Input
          type={type === "text" ? "text" : "number"}
          value={formValues[name] || ""}
          onChange={(e) => updateField(name, e.target.value)}
          onBlur={(e) => saveField(name, e.target.value)}
          placeholder={placeholder || "0"}
          className={`${isCurrency ? "pl-7" : ""} ${suffix || isPercentage ? "pr-12" : ""}`}
          data-testid={`input-${name}`}
        />
        {(suffix || isPercentage) && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {suffix || "%"}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

// Percent display component for calculated values
interface PercentDisplayProps {
  label: string;
  actual: number;
  target: number;
}

function PercentDisplay({ label, actual, target }: PercentDisplayProps) {
  const { value: percent, color } = calculatePercent(actual, target);
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className={`px-4 py-2 rounded-md text-center font-bold text-lg ${
        color === "green" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
        color === "yellow" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}>
        {target > 0 ? `${percent}%` : "-"}
      </div>
      <p className="text-xs text-muted-foreground text-center">Auto-calculated</p>
    </div>
  );
}
