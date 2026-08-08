import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { suppliersApi, type Supplier } from "@/lib/db";
import { queryKeys } from "@/lib/queryKeys";
import { Plus, Pencil, X, Search, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { SortableHeader, type SortDirection } from "@/components/ui/sortable-header";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function SupplierForm({ supplier, onClose }: { supplier?: Supplier; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: supplier?.name ?? "",
      contactName: supplier?.contactName ?? "",
      phone: supplier?.phone ?? "",
      email: supplier?.email ?? "",
      address: supplier?.address ?? "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => suppliersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
      toast.success("Supplier added");
      onClose();
    },
    onError: (err: AxiosError<{ error: string }>) => {
      toast.error(err.response?.data?.error ?? "Failed to add supplier");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => suppliersApi.update(supplier!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
      toast.success("Supplier updated");
      onClose();
    },
    onError: (err: AxiosError<{ error: string }>) => {
      toast.error(err.response?.data?.error ?? "Failed to update supplier");
    },
  });

  function onSubmit(data: FormData) {
    if (supplier) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  const isBusy = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-card-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
          <h2 className="font-semibold">{supplier ? "Edit Supplier" : "Add Supplier"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name *</label>
            <input {...register("name")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[42px]" placeholder="Acme Wholesale" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Name</label>
            <input {...register("contactName")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[42px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input {...register("phone")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[42px]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...register("email")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[42px]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input {...register("address")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[42px]" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-md py-2 text-sm font-medium hover:bg-muted/50 transition-colors min-h-[42px]">Cancel</button>
            <button type="submit" disabled={isBusy} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[42px]">
              {isBusy ? "Saving..." : supplier ? "Save Changes" : "Add Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type SupplierSortKey = "name" | "contactName" | "phone" | "email" | "address";

export default function Suppliers() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | undefined>();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SupplierSortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (key: SupplierSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const { data: suppliers, isLoading, isError } = useQuery({
    queryKey: queryKeys.suppliers.list({ search: search || undefined }),
    queryFn: () => suppliersApi.list({ search: search || undefined }),
  });

  const sortedSuppliers = useMemo(() => {
    if (!suppliers) return [];
    return [...suppliers].sort((a, b) => {
      let valA = (a[sortKey] || "").toString();
      let valB = (b[sortKey] || "").toString();
      let comparison = valA.localeCompare(valB, undefined, { sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [suppliers, sortKey, sortDirection]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Suppliers</h1>
        <button
          onClick={() => { setEditing(undefined); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity min-h-[40px]"
        >
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px]"
        />
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="py-12 text-center">
            <p className="text-destructive text-sm">Failed to load suppliers. Check your connection.</p>
          </div>
        ) : !sortedSuppliers || sortedSuppliers.length === 0 ? (
          <div className="py-12 text-center">
            <Truck className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground text-sm">No suppliers yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <SortableHeader label="Company Name" sortKey="name" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="left" />
                  <SortableHeader label="Contact Person" sortKey="contactName" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="left" />
                  <SortableHeader label="Phone" sortKey="phone" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="left" />
                  <SortableHeader label="Email" sortKey="email" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="left" />
                  <SortableHeader label="Address" sortKey="address" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="left" />
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider select-none">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.contactName ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.phone ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.email ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.address ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditing(s); setShowForm(true); }}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <SupplierForm supplier={editing} onClose={() => { setShowForm(false); setEditing(undefined); }} />}
    </div>
  );
}

