import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LayoutDashboard, 
  Package, 
  Calendar,
  Clock,
  TrendingUp,
  LogOut,
  ChevronRight,
  Zap
} from "lucide-react";
import type { User, Product } from "@shared/schema";
import { products as allProducts, getCurrentWeekStart, getCurrentMonthStart } from "@shared/schema";

export default function DashboardPage() {
  const [, setLocation] = useLocation();

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setLocation("/login");
  };

  if (userLoading) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const userProducts = currentUser?.products || [];
  const isAdmin = currentUser?.role === "admin";
  
  // All users only see their assigned products
  const assignedProducts = allProducts.filter(p => userProducts.includes(p.id));

  const weekStart = getCurrentWeekStart();
  const monthStart = getCurrentMonthStart();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">MoxyWolf Board Deck</h1>
                <p className="text-sm text-muted-foreground">Data Submission Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{currentUser?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentUser?.role}</p>
              </div>
              {currentUser?.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" data-testid="link-admin">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Week</p>
                    <p className="font-medium">{weekStart}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-2/10">
                    <Clock className="w-5 h-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Month</p>
                    <p className="font-medium">{monthStart}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-4/10">
                    <Package className="w-5 h-5 text-chart-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned Products</p>
                    <p className="font-medium">{currentUser?.products?.length || 0} products</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Your Products</h2>
              <p className="text-muted-foreground">Select a product to submit data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {assignedProducts.length === 0 && !isAdmin && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Products Assigned</h3>
                <p className="text-muted-foreground">
                  No products assigned yet. Please contact your administrator.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const weeklyFields = product.fields.filter(f => f.frequency === "weekly").length;
  const monthlyFields = product.fields.filter(f => f.frequency === "monthly").length;
  
  const categoryColors: Record<string, string> = {
    kr1: "bg-chart-1/10 text-chart-1",
    kr2: "bg-chart-2/10 text-chart-2",
    kr3: "bg-chart-4/10 text-chart-4",
    northstar: "bg-primary/10 text-primary",
  };

  const categories = Array.from(new Set(product.fields.map(f => f.category)));

  return (
    <Link href={`/submit/${product.id}`}>
      <Card className="group cursor-pointer transition-all hover-elevate active-elevate-2" data-testid={`card-product-${product.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {product.name}
              </CardTitle>
              <CardDescription>Slide #{product.slideNumber}</CardDescription>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <Badge 
                key={cat} 
                variant="secondary" 
                className={categoryColors[cat] || ""}
              >
                {cat.toUpperCase()}
              </Badge>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{weeklyFields}</span>
                <span className="text-muted-foreground"> weekly</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{monthlyFields}</span>
                <span className="text-muted-foreground"> monthly</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
