import * as zod from 'zod';

/**
 * @summary Dashboard summary - stock status counts and recent activity
 */
export const GetDashboardResponse = zod.object({
  "totalItems": zod.number(),
  "inStockCount": zod.number(),
  "lowStockCount": zod.number(),
  "outOfStockCount": zod.number(),
  "todayPurchases": zod.object({
    "count": zod.number(),
    "totalValue": zod.number()
  }),
  "todaySales": zod.object({
    "count": zod.number(),
    "totalValue": zod.number()
  }),
  "recentActivity": zod.array(zod.object({
    "id": zod.string(),
    "type": zod.enum(['purchase', 'sale']),
    "description": zod.string(),
    "date": zod.coerce.date(),
    "value": zod.number().nullish()
  })),
  "topItems": zod.array(zod.object({
    "itemId": zod.number(),
    "itemName": zod.string(),
    "totalQuantity": zod.number(),
    "totalValue": zod.number()
  }))
})

/**
 * @summary Daily purchases and sales summary
 */
export const GetDailyReportQueryParams = zod.object({
  "date": zod.date().optional()
})

export const GetDailyReportResponse = zod.object({
  "date": zod.coerce.date(),
  "purchases": zod.object({
    "count": zod.number(),
    "totalValue": zod.number(),
    "items": zod.array(zod.object({
      "id": zod.number(),
      "itemId": zod.number(),
      "itemName": zod.string(),
      "supplierId": zod.number(),
      "supplierName": zod.string(),
      "quantity": zod.number(),
      "unitPrice": zod.number(),
      "totalPrice": zod.number(),
      "notes": zod.string().nullish(),
      "date": zod.coerce.date(),
      "createdAt": zod.coerce.date()
    }))
  }),
  "sales": zod.object({
    "count": zod.number(),
    "totalValue": zod.number(),
    "items": zod.array(zod.object({
      "id": zod.number(),
      "itemId": zod.number(),
      "itemName": zod.string(),
      "customerId": zod.number(),
      "customerName": zod.string(),
      "quantity": zod.number(),
      "unitPrice": zod.number(),
      "totalPrice": zod.number(),
      "notes": zod.string().nullish(),
      "date": zod.coerce.date(),
      "createdAt": zod.coerce.date()
    }))
  })
})

/**
 * @summary Monthly purchases and sales summary
 */
export const GetMonthlyReportQueryParams = zod.object({
  "year": zod.coerce.number().optional(),
  "month": zod.coerce.number().optional()
})

export const GetMonthlyReportResponse = zod.object({
  "year": zod.number(),
  "month": zod.number(),
  "purchases": zod.object({
    "count": zod.number(),
    "totalValue": zod.number()
  }),
  "sales": zod.object({
    "count": zod.number(),
    "totalValue": zod.number()
  }),
  "dailyBreakdown": zod.array(zod.object({
    "date": zod.coerce.date(),
    "purchaseCount": zod.number(),
    "purchaseValue": zod.number(),
    "saleCount": zod.number(),
    "saleValue": zod.number()
  }))
})

/**
 * @summary Sales grouped by customer
 */
export const GetByCustomerReportQueryParams = zod.object({
  "dateFrom": zod.date().optional(),
  "dateTo": zod.date().optional()
})

export const GetByCustomerReportResponseItem = zod.object({
  "customerId": zod.number(),
  "customerName": zod.string(),
  "totalSales": zod.number(),
  "totalValue": zod.number(),
  "items": zod.array(zod.object({
    "itemId": zod.number(),
    "itemName": zod.string(),
    "totalQuantity": zod.number(),
    "totalValue": zod.number()
  }))
})

export const GetByCustomerReportResponse = zod.array(GetByCustomerReportResponseItem)

/**
 * @summary Purchases grouped by supplier
 */
export const GetBySupplierReportQueryParams = zod.object({
  "dateFrom": zod.date().optional(),
  "dateTo": zod.date().optional()
})

export const GetBySupplierReportResponseItem = zod.object({
  "supplierId": zod.number(),
  "supplierName": zod.string(),
  "totalPurchases": zod.number(),
  "totalValue": zod.number(),
  "items": zod.array(zod.object({
    "itemId": zod.number(),
    "itemName": zod.string(),
    "totalQuantity": zod.number(),
    "totalValue": zod.number()
  }))
})

export const GetBySupplierReportResponse = zod.array(GetBySupplierReportResponseItem)
