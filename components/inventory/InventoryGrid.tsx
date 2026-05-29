import type { CanonicalItem } from "@/types";
import { ItemCard } from "./ItemCard";

interface InventoryGridProps {
  items: CanonicalItem[];
}

export function InventoryGrid({ items }: InventoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
