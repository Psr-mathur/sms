import { prisma } from "./prisma.js";

async function main() {
  console.log("Setting up PostgreSQL database triggers for Stock Manager...");
  
  // Clear cached plans to prevent "cached plan must not change result type" error
  await prisma.$executeRawUnsafe("DISCARD ALL;");

  // 1. Create Purchase trigger function and trigger
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION update_stock_on_purchase()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            UPDATE items 
            SET current_stock = current_stock + NEW.quantity,
                updated_at = NOW()
            WHERE id = NEW.item_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE items 
            SET current_stock = GREATEST(0, current_stock - OLD.quantity),
                updated_at = NOW()
            WHERE id = OLD.item_id;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS purchase_stock_trigger ON purchases;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER purchase_stock_trigger
    AFTER INSERT OR DELETE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_stock_on_purchase();
  `);

  // 2. Create Sale trigger function and trigger
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION update_stock_on_sale()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            UPDATE items 
            SET current_stock = GREATEST(0, current_stock - NEW.quantity),
                updated_at = NOW()
            WHERE id = NEW.item_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE items 
            SET current_stock = current_stock + OLD.quantity,
                updated_at = NOW()
            WHERE id = OLD.item_id;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS sale_stock_trigger ON sales;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER sale_stock_trigger
    AFTER INSERT OR DELETE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_stock_on_sale();
  `);

  console.log("Triggers deployed successfully.");

  // 3. Initialize historical stock counts for existing items
  console.log("Initializing stock counts from historical transaction logs...");
  const items = await prisma.item.findMany({
    include: {
      purchases: { select: { quantity: true } },
      sales: { select: { quantity: true } }
    }
  });

  for (const item of items) {
    const totalPurchased = item.purchases.reduce((sum, p) => sum + parseFloat(p.quantity.toString()), 0);
    const totalSold = item.sales.reduce((sum, s) => sum + parseFloat(s.quantity.toString()), 0);
    const calculatedStock = Math.max(0, totalPurchased - totalSold);

    await prisma.item.update({
      where: { id: item.id },
      data: {
        currentStock: calculatedStock
      }
    });
    console.log(`Item "${item.name}" (ID ${item.id}) initialized to stock level: ${calculatedStock}`);
  }

  console.log("Stock levels initialization completed successfully.");
}

main()
  .catch((err) => {
    console.error("Error setting up triggers:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
