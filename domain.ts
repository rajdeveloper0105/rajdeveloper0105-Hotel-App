export type Role = "Owner" | "Cashier" | "Waiter" | "Kitchen";
export type OrderType = "DINE-IN" | "PARCEL";
export type Status = "New" | "Preparing" | "Ready" | "Served" | "Cancelled";
export type Food = {
  id: string;
  name: string;
  tamilName?: string;
  category: string;
  price: number;
  parcelPrice: number;
  tax: number;
  veg: boolean;
  available: boolean;
  image: string;
};
export type Line = {
  foodId: string;
  name: string;
  category: string;
  price: number;
  tax: number;
  quantity: number;
};
const tamilFoodNames: Record<string, string> = {
  idly: "இட்லி",
  idli: "இட்லி",
  dosa: "தோசை",
  dosai: "தோசை",
  dosha: "தோசை",
  "masala dosai": "மசாலா தோசை",
  "plain dosa": "சாதா தோசை",
  "ghee roast": "நெய் ரோஸ்ட்",
  "onion dosa": "வெங்காய தோசை",
  "rava dosa": "ரவா தோசை",
  poori: "பூரி",
  puri: "பூரி",
  chapati: "சப்பாத்தி",
  chapathi: "சப்பாத்தி",
  chappathi: "சப்பாத்தி",
  idiyappam: "இடியாப்பம்",
  appam: "ஆப்பம்",
  upma: "உப்புமா",
  uppuma: "உப்புமா",
  uthappam: "ஊத்தப்பம்",
  uttapam: "ஊத்தப்பம்",
  vadai: "வடை",
  "medu vada": "மெது வடை",
  "medu vadai": "மெது வடை",
  "masala vada": "மசாலா வடை",
  "curd rice": "தயிர் சாதம்",
  "lemon rice": "எலுமிச்சை சாதம்",
  "tomato rice": "தக்காளி சாதம்",
  "sambar rice": "சாம்பார் சாதம்",
  "fried rice": "ஃப்ரைடு ரைஸ்",
  "veg biryani": "காய்கறி பிரியாணி",
  "mutton biryani": "மட்டன் பிரியாணி",
  biryani: "பிரியாணி",
  biriyani: "பிரியாணி",
  "chicken biriyani": "சிக்கன் பிரியாணி",
  tea: "தேநீர்",
  coffee: "காபி",
  milk: "பால்",
  juice: "பழச்சாறு",
  "ice cream": "ஐஸ்கிரீம்",
  samosa: "சமோசா",
  bajji: "பஜ்ஜி",
  bonda: "போண்டா",
  "idly (2 pcs)": "இட்லி (2 எண்ணிக்கை)",
  "ven pongal": "வெண் பொங்கல்",
  "masala dosa": "மசாலா தோசை",
  "poori masala": "பூரி மசாலா",
  "chicken biryani": "சிக்கன் பிரியாணி",
  "veg meals": "சைவ சாப்பாடு",
  parotta: "பரோட்டா",
  "paneer dosa": "பனீர் தோசை",
  "filter coffee": "ஃபில்டர் காபி",
  "masala tea": "மசாலா தேநீர்",
  "medhu vadai": "மெது வடை",
  "gulab jamun": "குலாப் ஜாமுன்",
  pongal: "பொங்கல்",
  vada: "வடை",
};
export const getTamilName = (food: Pick<Food, "name" | "tamilName">) =>
  food.tamilName?.trim() || tamilFoodNames[food.name.trim().toLowerCase().replace(/\s+/g, " ")] || "";

export function updateFoodName(food: Food, name: string): Food {
  const previousAutomaticName = getTamilName({ name: food.name });
  const hasCustomTamilName = food.tamilName?.trim() &&
    food.tamilName.trim() !== previousAutomaticName;
  return {
    ...food,
    name,
    tamilName: hasCustomTamilName ? food.tamilName : getTamilName({ name }),
  };
}

export const removeOne = (lines: Line[], foodId: string): Line[] =>
  lines
    .map((line) => line.foodId === foodId
      ? { ...line, quantity: line.quantity - 1 }
      : line)
    .filter((line) => line.quantity > 0);
export type Order = {
  id: string;
  number: number;
  createdAt: string;
  type: OrderType;
  table: string;
  guests: number;
  customer: string;
  mobile: string;
  lines: Line[];
  discount: number;
  parcelCharge: number;
  status: Status;
  payment: "Pending" | "Cash" | "UPI" | "Card";
  paidAt?: string;
};
export const categories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Tiffin",
  "Beverages",
  "Snacks",
  "Desserts",
];
export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
export const round = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;
export function totals(
  order: Pick<Order, "lines" | "discount" | "parcelCharge" | "type">,
) {
  const subtotal = round(
    order.lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
  );
  const discount = Math.min(Math.max(order.discount, 0), subtotal);
  const taxable = round(subtotal - discount);
  const tax = round(
    order.lines.reduce(
      (sum, line) =>
        sum +
        (line.price *
          line.quantity *
          (subtotal ? taxable / subtotal : 0) *
          line.tax) /
          100,
      0,
    ),
  );
  const parcel = order.type === "PARCEL" ? round(order.parcelCharge) : 0;
  return {
    subtotal,
    discount,
    tax,
    parcel,
    total: round(taxable + tax + parcel),
  };
}
export function localDate(value = new Date().toISOString()) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function salesSummary(orders: Order[]) {
  const active = orders.filter((order) => order.status !== "Cancelled");
  const paid = active.filter((order) => order.payment !== "Pending");
  const pending = active.filter((order) => order.payment === "Pending");
  const sum = (rows: Order[]) => round(rows.reduce((value, order) => value + totals(order).total, 0));
  const foods = new Map<string, { id: string; name: string; quantity: number; gross: number }>();
  const days = new Map<string, number>();
  for (const order of paid) {
    const date = localDate(order.createdAt);
    days.set(date, round((days.get(date) ?? 0) + totals(order).total));
    for (const line of order.lines) {
      const row = foods.get(line.foodId) ?? { id: line.foodId, name: line.name, quantity: 0, gross: 0 };
      row.quantity += line.quantity;
      row.gross = round(row.gross + line.price * line.quantity);
      foods.set(line.foodId, row);
    }
  }
  return {
    active, paid, pending,
    billed: sum(active), collected: sum(paid), outstanding: sum(pending),
    foods: [...foods.values()].sort((a, b) => b.gross - a.gross),
    days: [...days.entries()].sort(([a], [b]) => a.localeCompare(b)),
    methods: (["Cash", "UPI", "Card"] as const).map((method) => {
      const rows = paid.filter((order) => order.payment === method);
      return { method, count: rows.length, amount: sum(rows) };
    }),
  };
}
const examples: [string, string, number, string, boolean][] = [
  ["Idly (2 pcs)", "Breakfast", 30, "🍚", true],
  ["Ven Pongal", "Breakfast", 50, "🥣", true],
  ["Masala Dosa", "Breakfast", 85, "🥞", true],
  ["Poori Masala", "Breakfast", 70, "🫓", true],
  ["Chicken Biryani", "Lunch", 180, "🍗", false],
  ["Veg Meals", "Lunch", 120, "🍱", true],
  ["Parotta", "Dinner", 25, "🫓", true],
  ["Paneer Dosa", "Tiffin", 110, "🥞", true],
  ["Filter Coffee", "Beverages", 20, "☕", true],
  ["Masala Tea", "Beverages", 15, "🍵", true],
  ["Medhu Vadai", "Snacks", 20, "🥯", true],
  ["Gulab Jamun", "Desserts", 45, "🍮", true],
];
export const initialMenu: Food[] = examples.map(
  ([name, category, price, image, veg], index) => ({
    id: `food-${index}`,
    name,
    category,
    price,
    parcelPrice: price,
    tax: 5,
    veg,
    image,
    available: true,
  }),
);
export const storageKey = "zealit-hotel-pos-v1";
export function loadData(): { menu: Food[]; orders: Order[] } {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return { menu: initialMenu, orders: [] };
  const data = JSON.parse(saved);
  if (!Array.isArray(data.menu) || !Array.isArray(data.orders))
    throw new Error("Invalid saved data");
  return data;
}
