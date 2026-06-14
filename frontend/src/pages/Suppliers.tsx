import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db, type LocalSupplier } from "@/lib/db";
import { Plus, Pencil, Trash2, X, Search, Truck } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function SupplierForm({ supplier, onClose }: { supplier?: LocalSupplier; onClose: () => void }) {
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

  async function onSubmit(data: FormData) {
    const now = new Date().toISOString();
    if (supplier?.localId) {
      await db.suppliers.update(supplier.localId, data);
      toast.success("Supplier updated");
    } else {
      await db.suppliers.add({ ...data, createdAt: now });
      toast.success("Supplier added");
    }
    onClose();
  }

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
            <input {...register("name")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Acme Wholesale" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Name</label>
            <input {...register("contactName")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input {...register("phone")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...register("email")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input {...register("address")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-md py-2 text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {isSubmitting ? "Saving..." : supplier ? "Save Changes" : "Add Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Suppliers() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LocalSupplier | undefined>();
  const [search, setSearch] = useState("");

  const suppliers = useLiveQuery(async () => {
    const all = await db.suppliers.orderBy("name").toArray();
    return search ? all.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())) : all;
  }, [search]);

  async function deleteSupplier(s: LocalSupplier) {
    if (!confirm(`Delete supplier "${s.name}"?`)) return;
    await db.suppliers.delete(s.localId!);
    toast.success("Supplier deleted");
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Suppliers</h1>
        <button
          onClick={() => { setEditing(undefined); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
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
          className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        {!suppliers || suppliers.length === 0 ? (
          <div className="py-12 text-center">
            <Truck className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground text-sm">No suppliers yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {suppliers.map((s) => (
              <div key={s.localId} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium">{s.name}</p>
                  <div className="flex flex-wrap gap-x-4 mt-0.5">
                    {s.contactName && <span className="text-xs text-muted-foreground">{s.contactName}</span>}
                    {s.phone && <span className="text-xs text-muted-foreground">{s.phone}</span>}
                    {s.email && <span className="text-xs text-muted-foreground">{s.email}</span>}
                  </div>
                  {s.address && <p className="text-xs text-muted-foreground mt-0.5">{s.address}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(s); setShowForm(true); }} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteSupplier(s)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <SupplierForm supplier={editing} onClose={() => { setShowForm(false); setEditing(undefined); }} />}
    </div>
  );
}
