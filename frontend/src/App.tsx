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

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
      <Toaster richColors position="top-right" />
    </WouterRouter>
  );
}

export default App;
