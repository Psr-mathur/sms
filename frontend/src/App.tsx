import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Items from "@/pages/Items";
import Purchases from "@/pages/Purchases";
import Sales from "@/pages/Sales";
import Suppliers from "@/pages/Suppliers";
import Customers from "@/pages/Customers";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Login from "@/pages/Login";
import AndroidAppBackButtonHandler from "@/components/AndroidAppBackButtonHandler";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/items" component={Items} />
        <Route path="/purchases" component={Purchases} />
        <Route path="/sales" component={Sales} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/customers" component={Customers} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm tracking-wide">Loading Stock Manager...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Router />;
}

function App() {
  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AndroidAppBackButtonHandler />
        <AppContent />
        <Toaster richColors position="top-right" />
      </WouterRouter>
    </AuthProvider>
  );
}

export default App;
