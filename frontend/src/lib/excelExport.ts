import * as XLSX from "xlsx";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { toast } from "sonner";
import type { Item, Purchase, Sale } from "./db";

function getTodayFilenameStr(): string {
  return new Date().toLocaleDateString("sv-SE");
}

async function saveWorkbook(workbook: XLSX.WorkBook, filename: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: filename,
        text: `Exported ${filename}`,
        url: result.uri,
        dialogTitle: `Save or Share ${filename}`,
      });
      toast.success(`Exported ${filename}`);
    } catch (err: any) {
      console.error("Native export error:", err);
      toast.error(err?.message || "Failed to export Excel file on device");
    }
  } else {
    XLSX.writeFile(workbook, filename);
    toast.success(`Exported ${filename}`);
  }
}

export async function exportItemsToExcel(items: Item[]) {
  const data = items.map((item, index) => ({
    "S.No": index + 1,
    "Item Name": item.name,
    "Quantity": item.quantity,
    "Low Stock Threshold": item.lowStockThreshold,
    "Status": item.status === "in_stock" ? "In Stock" : item.status === "low_stock" ? "Low Stock" : "Out of Stock",
    "Last Updated": item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Items");

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
    { wch: 22 },
  ];

  const filename = `Items_${getTodayFilenameStr()}.xlsx`;
  await saveWorkbook(workbook, filename);
}

export async function exportPurchasesToExcel(purchases: Purchase[]) {
  const data = purchases.map((p, index) => ({
    "S.No": index + 1,
    "Date": p.date,
    "Item Name": p.itemName,
    "Supplier Name": p.supplierName,
    "Quantity": p.quantity,
    "Notes": p.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Purchases");

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 25 },
    { wch: 25 },
    { wch: 12 },
    { wch: 30 },
  ];

  const filename = `Purchases_${getTodayFilenameStr()}.xlsx`;
  await saveWorkbook(workbook, filename);
}

export async function exportSalesToExcel(sales: Sale[]) {
  const data = sales.map((s, index) => ({
    "S.No": index + 1,
    "Date": s.date,
    "Item Name": s.itemName,
    "Customer Name": s.customerName,
    "Quantity": s.quantity,
    "Notes": s.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 25 },
    { wch: 25 },
    { wch: 12 },
    { wch: 30 },
  ];

  const filename = `Sales_${getTodayFilenameStr()}.xlsx`;
  await saveWorkbook(workbook, filename);
}
