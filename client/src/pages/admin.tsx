import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Users, 
  Package,
  Shield,
  UserPlus,
  Loader2,
  Trash2,
  Edit,
  Zap,
  LogOut,
  LayoutDashboard,
  FileText,
  Calendar
} from "lucide-react";
import type { User, DeckGeneration, FinancialRecord } from "@shared/schema";
import { products, getCurrentWeekStart, getCurrentMonthStart } from "@shared/schema";
import { DollarSign, ExternalLink } from "lucide-react";

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: currentUser?.role === "admin",
  });

  const { data: generations, isLoading: generationsLoading } = useQuery<DeckGeneration[]>({
    queryKey: ["/api/admin/generations"],
    enabled: currentUser?.role === "admin",
  });

  const { data: financials, isLoading: financialsLoading } = useQuery<FinancialRecord[]>({
    queryKey: ["/api/admin/financials"],
    enabled: currentUser?.role === "admin",
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setLocation("/login");
  };

  if (userLoading) {
    return (
      <div className="min-h-screen p-6">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
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
                  <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
                  <p className="text-sm text-muted-foreground">Manage users and view generations</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" data-testid="link-dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="generations" data-testid="tab-generations">
              <FileText className="w-4 h-4 mr-2" />
              Deck Generations
            </TabsTrigger>
            <TabsTrigger value="financials" data-testid="tab-financials">
              <DollarSign className="w-4 h-4 mr-2" />
              Financials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-foreground">User Management</h2>
                <p className="text-muted-foreground">Add, edit, or remove users</p>
              </div>
              <CreateUserDialog />
            </div>

            {usersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {allUsers?.map((user) => (
                  <UserCard key={user.id} user={user} currentUserId={currentUser.id} />
                ))}
                
                {allUsers?.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Users</h3>
                      <p className="text-muted-foreground">Create your first user to get started.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="generations" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Deck Generations</h2>
                <p className="text-muted-foreground">View past deck generations</p>
              </div>
              <GenerateDeckDialog />
            </div>

            {generationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {generations?.map((gen) => (
                  <GenerationCard key={gen.id} generation={gen} />
                ))}
                
                {generations?.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Generations</h3>
                      <p className="text-muted-foreground">Generate your first deck to see it here.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="financials" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-foreground">LivePlan Financials</h2>
                <p className="text-muted-foreground">Enter company financial data from LivePlan</p>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href="https://app.liveplan.com/company/a7882fa6-a2c9-4e4f-8b1d-d19f13b46edf/774f6dfd-46f7-4a97-9b1e-1694a86c775b/dashboard/overview" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" data-testid="button-open-liveplan">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open LivePlan
                  </Button>
                </a>
                <FinancialEntryDialog />
              </div>
            </div>

            {financialsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {financials?.map((record) => (
                  <FinancialCard key={record.id} record={record} />
                ))}
                
                {financials?.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Financial Data</h3>
                      <p className="text-muted-foreground">Add your first financial entry to see it here.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function UserCard({ user, currentUserId }: { user: User; currentUserId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/admin/users/${user.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "The user has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isCurrentUser = user.id === currentUserId;

  return (
    <Card data-testid={`card-user-${user.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <span className="text-lg font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{user.name}</h3>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
                {isCurrentUser && (
                  <Badge variant="outline">You</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Package className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {user.products.length} products assigned
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <EditUserDialog user={user} open={isEditOpen} onOpenChange={setIsEditOpen} />
            {!isCurrentUser && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                data-testid={`button-delete-user-${user.id}`}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "operator">("operator");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/users", {
        email,
        password,
        name,
        role,
        products: selectedProducts,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User created",
        description: "The new user has been created successfully.",
      });
      setOpen(false);
      setEmail("");
      setPassword("");
      setName("");
      setRole("operator");
      setSelectedProducts([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Create failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-user">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Add a new user to the system</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Full Name</Label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              data-testid="input-create-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@moxywolf.com"
              data-testid="input-create-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-password">Password</Label>
            <Input
              id="create-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              data-testid="input-create-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-role">Role</Label>
            <Select value={role} onValueChange={(v: "admin" | "operator") => setRole(v)}>
              <SelectTrigger data-testid="select-create-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assigned Products</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {products.map((product) => (
                <div key={product.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`create-product-${product.id}`}
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProducts([...selectedProducts, product.id]);
                      } else {
                        setSelectedProducts(selectedProducts.filter(p => p !== product.id));
                      }
                    }}
                  />
                  <label htmlFor={`create-product-${product.id}`} className="text-sm">
                    {product.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => createMutation.mutate()} 
            disabled={createMutation.isPending}
            data-testid="button-confirm-create"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, open, onOpenChange }: { user: User; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<"admin" | "operator">(user.role);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(user.products);

  // Sync state when user prop changes (fixes stale data when editing different users)
  useEffect(() => {
    if (open) {
      setName(user.name);
      setRole(user.role);
      setSelectedProducts(user.products || []);
    }
  }, [user.id, open, user.name, user.role, user.products]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/admin/users/${user.id}`, {
        name,
        role,
        products: selectedProducts,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      // Also invalidate current user data so dashboard shows updated products
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid={`button-edit-user-${user.id}`}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user details for {user.email}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-edit-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={role} onValueChange={(v: "admin" | "operator") => setRole(v)}>
              <SelectTrigger data-testid="select-edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assigned Products</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {products.map((product) => (
                <div key={product.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-product-${product.id}`}
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProducts([...selectedProducts, product.id]);
                      } else {
                        setSelectedProducts(selectedProducts.filter(p => p !== product.id));
                      }
                    }}
                  />
                  <label htmlFor={`edit-product-${product.id}`} className="text-sm">
                    {product.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            data-testid="button-confirm-edit"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GenerateDeckDialog() {
  const [open, setOpen] = useState(false);
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">("weekly");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const periodStart = periodType === "weekly" ? getCurrentWeekStart() : getCurrentMonthStart();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/generate-deck", {
        periodType,
        periodStart,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generations"] });
      toast({
        title: "Deck generation started",
        description: data.message || "The deck will be ready soon.",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-generate-deck">
          <FileText className="h-4 w-4 mr-2" />
          Generate Deck
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Board Deck</DialogTitle>
          <DialogDescription>Create a new deck from submitted data</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Period Type</Label>
            <Select value={periodType} onValueChange={(v: "weekly" | "monthly") => setPeriodType(v)}>
              <SelectTrigger data-testid="select-period-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Period Start</Label>
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{periodStart}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => generateMutation.mutate()} 
            disabled={generateMutation.isPending}
            data-testid="button-confirm-generate"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Deck"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GenerationCard({ generation }: { generation: DeckGeneration }) {
  const statusColors: Record<string, string> = {
    pending: "bg-chart-4/10 text-chart-4",
    in_progress: "bg-chart-2/10 text-chart-2",
    completed: "bg-green-500/10 text-green-500",
    failed: "bg-destructive/10 text-destructive",
  };

  return (
    <Card data-testid={`card-generation-${generation.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground capitalize">
                  {generation.periodType} Deck
                </h3>
                <Badge variant="secondary" className={statusColors[generation.status]}>
                  {generation.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Period: {generation.periodStart}
              </p>
              <p className="text-xs text-muted-foreground">
                Generated: {new Date(generation.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {generation.slidesUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={generation.slidesUrl} target="_blank" rel="noopener noreferrer">
                View Deck
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialCard({ record }: { record: FinancialRecord }) {
  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
    return value < 0 ? `-${formatted}` : formatted;
  };

  const periodLabel = new Date(record.periodStart + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <Card data-testid={`card-financial-${record.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-medium text-foreground text-lg">{periodLabel}</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Updated: {new Date(record.updatedAt).toLocaleString()} by {record.updatedBy}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="font-medium text-foreground">{formatCurrency(record.revenue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expenses</p>
                <p className="font-medium text-foreground">{formatCurrency(record.expenses)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Operating Income</p>
                <p className={`font-medium ${record.operatingIncome < 0 ? 'text-destructive' : 'text-green-500'}`}>
                  {formatCurrency(record.operatingIncome)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Operating Margin</p>
                <p className={`font-medium ${record.operatingMargin < 0 ? 'text-destructive' : 'text-green-500'}`}>
                  {record.operatingMargin}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net Profit</p>
                <p className={`font-medium ${record.netProfit < 0 ? 'text-destructive' : 'text-green-500'}`}>
                  {formatCurrency(record.netProfit)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cash Balance</p>
                <p className={`font-medium ${record.cashBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {formatCurrency(record.cashBalance)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Accounts Receivable</p>
                <p className="font-medium text-foreground">{formatCurrency(record.accountsReceivable)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Days to Get Paid</p>
                <p className="font-medium text-foreground">{record.daysToGetPaid} days</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialEntryDialog() {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear().toString());
  const [month, setMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));
  
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [operatingIncome, setOperatingIncome] = useState("");
  const [operatingMargin, setOperatingMargin] = useState("");
  const [netProfit, setNetProfit] = useState("");
  const [cashBalance, setCashBalance] = useState("");
  const [accountsReceivable, setAccountsReceivable] = useState("");
  const [daysToGetPaid, setDaysToGetPaid] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const periodStart = `${year}-${month}-01`;
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const periodEnd = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/financials", {
        periodStart,
        periodEnd,
        revenue: parseFloat(revenue) || 0,
        expenses: parseFloat(expenses) || 0,
        operatingIncome: parseFloat(operatingIncome) || 0,
        operatingMargin: parseFloat(operatingMargin) || 0,
        netProfit: parseFloat(netProfit) || 0,
        cashBalance: parseFloat(cashBalance) || 0,
        accountsReceivable: parseFloat(accountsReceivable) || 0,
        daysToGetPaid: parseInt(daysToGetPaid) || 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/financials"] });
      toast({
        title: "Financial data saved",
        description: "The financial record has been saved successfully.",
      });
      setOpen(false);
      setRevenue("");
      setExpenses("");
      setOperatingIncome("");
      setOperatingMargin("");
      setNetProfit("");
      setCashBalance("");
      setAccountsReceivable("");
      setDaysToGetPaid("");
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const years = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - 2 + i).toString());
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-financial">
          <DollarSign className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Financial Data</DialogTitle>
          <DialogDescription>Enter company financial data from LivePlan</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger data-testid="select-financial-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger data-testid="select-financial-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenue">Revenue ($)</Label>
              <Input
                id="revenue"
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="10558"
                data-testid="input-revenue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenses">Expenses & Costs ($)</Label>
              <Input
                id="expenses"
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="11740"
                data-testid="input-expenses"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operatingIncome">Operating Income ($)</Label>
              <Input
                id="operatingIncome"
                type="number"
                value={operatingIncome}
                onChange={(e) => setOperatingIncome(e.target.value)}
                placeholder="-1183"
                data-testid="input-operating-income"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operatingMargin">Operating Margin (%)</Label>
              <Input
                id="operatingMargin"
                type="number"
                value={operatingMargin}
                onChange={(e) => setOperatingMargin(e.target.value)}
                placeholder="-11"
                data-testid="input-operating-margin"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="netProfit">Net Profit ($)</Label>
              <Input
                id="netProfit"
                type="number"
                value={netProfit}
                onChange={(e) => setNetProfit(e.target.value)}
                placeholder="-1183"
                data-testid="input-net-profit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashBalance">Cash Balance ($)</Label>
              <Input
                id="cashBalance"
                type="number"
                value={cashBalance}
                onChange={(e) => setCashBalance(e.target.value)}
                placeholder="-38593"
                data-testid="input-cash-balance"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountsReceivable">Accounts Receivable ($)</Label>
              <Input
                id="accountsReceivable"
                type="number"
                value={accountsReceivable}
                onChange={(e) => setAccountsReceivable(e.target.value)}
                placeholder="10558"
                data-testid="input-accounts-receivable"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daysToGetPaid">Days to Get Paid</Label>
              <Input
                id="daysToGetPaid"
                type="number"
                value={daysToGetPaid}
                onChange={(e) => setDaysToGetPaid(e.target.value)}
                placeholder="31"
                data-testid="input-days-to-get-paid"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending}
            data-testid="button-save-financial"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Entry"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
