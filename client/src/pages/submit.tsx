import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Clock
} from "lucide-react";
import type { Product, FieldDefinition, Submission } from "@shared/schema";
import { getProduct, getCurrentWeekStart, getCurrentMonthStart } from "@shared/schema";

export default function SubmitPage() {
  const { productId } = useParams<{ productId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">("weekly");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set());

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
      setSavedFields(prev => new Set([...prev, variables.fieldName]));
      queryClient.invalidateQueries({ queryKey: ["/api/submissions", productId] });
      toast({
        title: "Saved!",
        description: "Field value has been saved successfully.",
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

  const saveAllMutation = useMutation({
    mutationFn: async () => {
      const fieldsToSave = filteredFields.filter(f => formValues[f.name]?.trim());
      for (const field of fieldsToSave) {
        await apiRequest("POST", "/api/submissions", {
          productId,
          fieldName: field.name,
          value: formValues[field.name],
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

  const filteredFields = product.fields.filter(f => f.frequency === periodType);
  const categories = [...new Set(filteredFields.map(f => f.category))];

  const categoryLabels: Record<string, string> = {
    kr1: "KR1 - Sales & Marketing",
    kr2: "KR2 - Development",
    kr3: "KR3 - Operations",
    northstar: "North Star Metrics",
  };

  const categoryColors: Record<string, string> = {
    kr1: "border-l-chart-1",
    kr2: "border-l-chart-2",
    kr3: "border-l-chart-4",
    northstar: "border-l-primary",
  };

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
            {categories.map((category) => {
              const categoryFields = filteredFields.filter(f => f.category === category);
              
              return (
                <Card key={category} className={`border-l-4 ${categoryColors[category]}`}>
                  <CardHeader>
                    <CardTitle>{categoryLabels[category]}</CardTitle>
                    <CardDescription>
                      {categoryFields.length} fields to complete
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryFields.map((field) => (
                        <FieldInput
                          key={field.name}
                          field={field}
                          value={formValues[field.name] || ""}
                          onChange={(value) => setFormValues(prev => ({ ...prev, [field.name]: value }))}
                          onSave={(value) => saveMutation.mutate({ fieldName: field.name, value })}
                          isSaving={saveMutation.isPending}
                          isSaved={savedFields.has(field.name)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredFields.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No {periodType} Fields</h3>
                  <p className="text-muted-foreground">
                    This product doesn't have any {periodType} fields to submit.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

interface FieldInputProps {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
  onSave: (value: string) => void;
  isSaving: boolean;
  isSaved: boolean;
}

function FieldInput({ field, value, onChange, onSave, isSaving, isSaved }: FieldInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value && localValue.trim()) {
      onChange(localValue);
      onSave(localValue);
    }
  };

  const getInputPrefix = () => {
    if (field.type === "currency") return "$";
    return null;
  };

  const getInputSuffix = () => {
    if (field.type === "percentage") return "%";
    if (field.type === "number" && field.name.includes("Response")) return "ms";
    return null;
  };

  if (field.type === "select" && field.name === "Trend") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{field.name}</Label>
          {isSaved && <CheckCircle className="w-4 h-4 text-chart-2" />}
        </div>
        <Select 
          value={localValue} 
          onValueChange={(v) => {
            setLocalValue(v);
            onChange(v);
            onSave(v);
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{field.name}</Label>
        {isSaved && <CheckCircle className="w-4 h-4 text-chart-2" />}
      </div>
      <div className="relative">
        {getInputPrefix() && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {getInputPrefix()}
          </span>
        )}
        <Input
          type={field.type === "number" || field.type === "currency" || field.type === "percentage" ? "number" : "text"}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={field.example}
          className={`${getInputPrefix() ? "pl-7" : ""} ${getInputSuffix() ? "pr-10" : ""}`}
          data-testid={`input-${field.placeholder}`}
        />
        {getInputSuffix() && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {getInputSuffix()}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{field.description}</p>
    </div>
  );
}
