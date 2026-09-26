import { useState } from "react";
import type { FormEvent } from "react";
import {
  categories,
  getTamilName,
  updateFoodName,
  removeOne,
  initialMenu,
  loadData,
  localDate,
  money,
  storageKey,
  totals,
} from "./domain";
import type { Food, Line, Order, OrderType, Role, Status } from "./domain";
import "./App.css";
import Dashboard from "./Dashboard";
import Login, { hasLoginSession, loginSessionKey } from "./Login";

type Page =
  "Overview" | "Point of sale" | "Orders" | "Kitchen" | "Food menu" | "Reports";
const pages: Page[] = [
  "Overview",
  "Point of sale",
  "Orders",
  "Kitchen",
  "Food menu",
  "Reports",
];
const icons = ["◫", "▦", "☷", "♨", "◉", "↗"];
const permissions: Record<Role, Page[]> = {
  Owner: pages,
  Cashier: ["Point of sale", "Orders"],
  Waiter: ["Point of sale", "Orders"],
  Kitchen: ["Kitchen"],
};
const emptyFood: Food = {
  id: "",
  name: "",
  category: "Breakfast",
  price: 0,
  parcelPrice: 0,
  tax: 5,
  veg: true,
  available: true,
  image: "🍽️",
};
function App() {
  const [signedIn, setSignedIn] = useState(hasLoginSession);
  function logout() {
    try { sessionStorage.removeItem(loginSessionKey); } catch { /* Clear the in-memory session too. */ }
    setSignedIn(false);
  }
  return signedIn ? <Workspace onLogout={logout} /> : <Login onLogin={() => setSignedIn(true)} />;
}

function Workspace({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState(() => {
    try {
      return loadData();
    } catch {
      return { menu: initialMenu, orders: [] as Order[] };
    }
  });
  const [page, setPage] = useState<Page>("Point of sale");
  const [role, setRole] = useState<Role>("Owner");
  const [category, setCategory] = useState("All items");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<OrderType>("DINE-IN");
  const [lines, setLines] = useState<Line[]>([]);
  const [table, setTable] = useState("1");
  const [guests, setGuests] = useState(2);
  const [customer, setCustomer] = useState("");
  const [mobile, setMobile] = useState("");
  const [discount, setDiscount] = useState(0);
  const [parcelCharge, setParcelCharge] = useState(10);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [food, setFood] = useState<Food | null>(null);
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Order | null>(null);
  const [notice, setNotice] = useState("");
  const [from, setFrom] = useState(localDate());
  const [to, setTo] = useState(localDate());
  const [orderFilter, setOrderFilter] = useState("All orders");
  const [bootError, setBootError] = useState(() => {
    try {
      loadData();
      return "";
    } catch {
      return "Saved browser data could not be read. Export or recover it before saving new changes.";
    }
  });
  const canBill = role === "Owner" || role === "Cashier";
  const draft = { lines, discount, parcelCharge, type };
  const amount = totals(draft);
  const sum = (orders: Order[]) =>
    orders.reduce((n, o) => n + totals(o).total, 0);
  function persist(next: typeof data) {
    if (bootError) {
      setNotice("Storage recovery is needed before changes can be saved.");
      return false;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setData(next);
      return true;
    } catch {
      setNotice("Unable to save. Browser storage may be full or disabled.");
      return false;
    }
  }
  function switchRole(value: Role) {
    setRole(value);
    if (!permissions[value].includes(page)) setPage(permissions[value][0]);
    setPayment(null);
    setFood(null);
  }
  function add(item: Food) {
    if (!item.available) return;
    setLines((current) => {
      const found = current.find((l) => l.foodId === item.id);
      return found
        ? current.map((l) =>
            l.foodId === item.id ? { ...l, quantity: l.quantity + 1 } : l,
          )
        : [
            ...current,
            {
              foodId: item.id,
              name: item.name,
              category: item.category,
              price: type === "PARCEL" ? item.parcelPrice : item.price,
              tax: item.tax,
              quantity: 1,
            },
          ];
    });
  }
  function reset() {
    setLines([]);
    setDiscount(0);
    setCustomer("");
    setMobile("");
    setEditingOrder(null);
    setGuests(2);
    setParcelCharge(10);
  }
  function changeType(next: OrderType) {
    if (editingOrder) return;
    setType(next);
    setLines((current) =>
      current.map((l) => {
        const item = data.menu.find((i) => i.id === l.foodId);
        return item
          ? { ...l, price: next === "PARCEL" ? item.parcelPrice : item.price }
          : l;
      }),
    );
  }
  function saveOrder() {
    if (!lines.length) {
      setNotice("Add at least one food item.");
      return;
    }
    if (type === "DINE-IN" && (!Number.isInteger(guests) || guests < 1)) {
      setNotice("Enter at least one guest.");
      return;
    }
    if (mobile && !/^\d{10}$/.test(mobile)) {
      setNotice("Enter a valid 10-digit mobile number.");
      return;
    }
    if (discount > amount.subtotal) {
      setNotice("Discount cannot exceed the subtotal.");
      return;
    }
    if (
      type === "DINE-IN" &&
      data.orders.some(
        (o) =>
          o.id !== editingOrder &&
          o.table === table &&
          o.type === "DINE-IN" &&
          o.payment === "Pending" &&
          o.status !== "Cancelled",
      )
    ) {
      setNotice(
        "This table has an open order. Open it from Orders to add items.",
      );
      return;
    }
    const old = data.orders.find((o) => o.id === editingOrder);
    const order: Order = {
      id: old?.id ?? crypto.randomUUID(),
      number:
        old?.number ?? Math.max(1000, ...data.orders.map((o) => o.number)) + 1,
      createdAt: old?.createdAt ?? new Date().toISOString(),
      type,
      table: type === "DINE-IN" ? table : "",
      guests: type === "DINE-IN" ? guests : 0,
      customer: customer.trim(),
      mobile,
      lines,
      discount,
      parcelCharge: type === "PARCEL" ? parcelCharge : 0,
      status: "New",
      payment: "Pending",
    };
    if (
      persist({
        ...data,
        orders: old
          ? data.orders.map((o) => (o.id === old.id ? order : o))
          : [...data.orders, order],
      })
    ) {
      reset();
      setNotice(`Order #${order.number} sent to kitchen.`);
      setPage("Orders");
    }
  }
  function updateOrder(order: Order) {
    return persist({
      ...data,
      orders: data.orders.map((o) => (o.id === order.id ? order : o)),
    });
  }
  function editOrder(o: Order) {
    if (lines.length && !confirm("Replace the current unsaved order?")) return;
    setEditingOrder(o.id);
    setLines(o.lines.map((l) => ({ ...l })));
    setType(o.type);
    setTable(o.table || "1");
    setGuests(o.guests || 1);
    setCustomer(o.customer);
    setMobile(o.mobile);
    setDiscount(o.discount);
    setParcelCharge(o.parcelCharge);
    setPage("Point of sale");
  }
  function saveFood(e: FormEvent) {
    e.preventDefault();
    if (!food || !food.name.trim()) return;
    const next = {
      ...food,
      name: food.name.trim(),
      tamilName: getTamilName(food),
      id: food.id || crypto.randomUUID(),
    };
    if (
      persist({
        ...data,
        menu: food.id
          ? data.menu.map((i) => (i.id === food.id ? next : i))
          : [...data.menu, next],
      })
    )
      setFood(null);
  }
  const report = data.orders.filter(
    (o) => localDate(o.createdAt) >= from && localDate(o.createdAt) <= to,
  );
  const completed = report.filter(
    (o) => o.payment !== "Pending" && o.status !== "Cancelled",
  );
  function grouped(orders: Order[], byCategory = false) {
    const result: Record<string, { quantity: number; amount: number }> = {};
    orders.forEach((o) =>
      o.lines.forEach((l) => {
        const key = byCategory ? l.category : l.name;
        result[key] ??= { quantity: 0, amount: 0 };
        result[key].quantity += l.quantity;
        result[key].amount += l.price * l.quantity;
      }),
    );
    return Object.entries(result).sort((a, b) => b[1].quantity - a[1].quantity);
  }
  function exportCsv() {
    const rows = [
      [
        "Bill",
        "Date",
        "Type",
        "Status",
        "Payment",
        "Subtotal",
        "Discount",
        "Tax",
        "Parcel",
        "Total",
      ],
      ...report.map((o) => {
        const t = totals(o);
        return [
          o.number,
          localDate(o.createdAt),
          o.type,
          o.status,
          o.payment,
          t.subtotal,
          t.discount,
          t.tax,
          t.parcel,
          t.total,
        ];
      }),
    ];
    const blob = new Blob(
      [
        "\ufeff" +
          rows
            .map((row) =>
              row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","),
            )
            .join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `avn-sales-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const filteredMenu = data.menu.filter(
    (i) =>
      (category === "All items" || i.category === category) &&
      `${i.name} ${getTamilName(i)}`.toLowerCase().includes(search.toLowerCase()),
  );
  function stats(orders: Order[]) {
    return (
      <div className="stats">
        {[
          [
            "Collected sales",
            money(sum(orders.filter((o) => o.payment !== "Pending"))),
          ],
          ["Total orders", orders.length],
          ["Dine-in", orders.filter((o) => o.type === "DINE-IN").length],
          ["Parcel", orders.filter((o) => o.type === "PARCEL").length],
        ].map(([label, value]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Selected period</small>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-mark">AVN</span>AVN
          <span className="brand-dot">.</span>
        </a>
        <div className="restaurant">
          <span>🍽</span>
          <div>
            <b>ABC Hotel</b>
            <small>Restaurant workspace</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {pages
            .filter((p) => permissions[role].includes(p))
            .map((p) => (
              <button
                key={p}
                className={`menu-${pages.indexOf(p)}${page === p ? " active" : ""}`}
                aria-current={page === p ? "page" : undefined}
                aria-label={p}
                title={p}
                onClick={() => setPage(p)}
              >
                <span aria-hidden="true">{icons[pages.indexOf(p)]}</span>
                {p}
                {p === "Kitchen" && (
                  <em>
                    {
                      data.orders.filter((o) =>
                        ["New", "Preparing"].includes(o.status),
                      ).length
                    }
                  </em>
                )}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="online-dot" /> Local workspace
          <small>Saved in this browser only</small>
          <div className="profile">
            <span className="avatar">AK</span>
            <div>
              <b>AvnFood</b>
              <small>{role} · Local session</small>
            </div>
          </div>
          <select
            aria-label="Demo role"
            value={role}
            onChange={(e) => switchRole(e.target.value as Role)}
          >
            {Object.keys(permissions).map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            ABC HOTEL <i>/</i> <b>{page}</b>
          </span>
          <div className="topbar-actions">
            <button className="logout-button" onClick={onLogout}>Logout</button>
            <span className="live">● Open for orders</span>
            <span>
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </header>
        {bootError && (
          <div className="warning">
            {bootError}{" "}
            <button
              onClick={() => {
                if (
                  confirm(
                    "Start fresh? Existing unreadable browser data will be overwritten on your next save.",
                  )
                )
                  setBootError("");
              }}
            >
              Start fresh
            </button>
          </div>
        )}
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}
        {page !== "Point of sale" && page !== "Overview" && <div className="page-heading">
          <div>
            <div className="eyebrow">YOUR RESTAURANT, IN SYNC</div>
            <h1>{page}</h1>
            <p>
              A clear view of everything happening at your hotel.
            </p>
          </div>
          <span className="workspace-badge">LOCAL DEMO</span>
        </div>}
        {page === "Point of sale" && (
          <div className="pos-layout">
            <section className="menu-panel">
              <div className="menu-toolbar">
                <h2>
                  Explore the menu <span>{data.menu.length} items</span>
                </h2>
                <input
                  className="search"
                  placeholder="Search food or beverages…"
                  aria-label="Search menu"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="categories">
                {["All items", ...categories].map((c) => (
                  <button
                    key={c}
                    className={category === c ? "selected" : ""}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="food-grid">
                {filteredMenu.map((i) => (
                  <article
                    className={`food-card${!i.available ? " unavailable" : ""}`}
                    key={i.id}
                  >
                    <div
                      className={`food-art tone-${categories.indexOf(i.category) % 4}`}
                    >
                      {i.image.startsWith("data:image/") ||
                      i.image.startsWith("https://") ? (
                        <img src={i.image} alt={i.name} />
                      ) : (
                        <span>{i.image}</span>
                      )}
                      <small className={i.veg ? "veg" : "nonveg"}>▣</small>
                       <span className="food-badge">{!i.available ? "Unavailable" : i.category}</span>
                    </div>
                    <div className="food-info">
                      <h3>{i.name}</h3>
                      <p className="food-tamil" lang="ta">{getTamilName(i) || "\u00a0"}</p>
                      <div>
                        <b>
                          {money(type === "PARCEL" ? i.parcelPrice : i.price)}
                        </b>
                        <div className="card-quantity">
                          <button
                            type="button"
                            aria-label={`Remove one ${i.name}`}
                            disabled={!lines.some((line) => line.foodId === i.id && line.quantity > 0)}
                            onClick={() => setLines((current) => removeOne(current, i.id))}
                          >−</button>
                          <span aria-label={`${i.name} quantity`} aria-live="polite">
                            {lines.find((line) => line.foodId === i.id)?.quantity ?? 0}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${i.name} quantity`}
                            disabled={!i.available}
                            onClick={() => add(i)}
                          >+</button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {!filteredMenu.length && (
                <div className="empty">No items found. Try another search.</div>
              )}
              <p className="muted menu-foot">
                Prices before tax · Tap + to add an item to the order
              </p>
            </section>
            <aside className="bill-panel">
              <div className="bill-title">
                <div>
                  <h2>{editingOrder ? "Edit order" : "Current order"}</h2>
                  <small>
                    {editingOrder
                      ? "Changes return to the kitchen"
                      : "A fresh start for something delicious"}
                  </small>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    if (!lines.length || confirm("Clear this unsaved order?"))
                      reset();
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="segmented">
                {(["DINE-IN", "PARCEL"] as OrderType[]).map((t) => (
                  <button
                    key={t}
                    disabled={!!editingOrder}
                    onClick={() => changeType(t)}
                    className={type === t ? "selected" : ""}
                  >
                    {t === "DINE-IN" ? "♧  Dine-in" : "▱  Parcel"}
                  </button>
                ))}
              </div>
              <div className="order-inputs">
                {type === "DINE-IN" ? (
                  <>
                    <label>
                      Table
                      <select
                        value={table}
                        onChange={(e) => setTable(e.target.value)}
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i + 1}>
                            Table {String(i + 1).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Guests
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      Customer
                      <input
                        value={customer}
                        placeholder="Name (optional)"
                        onChange={(e) => setCustomer(e.target.value)}
                      />
                    </label>
                    <label>
                      Mobile
                      <input
                        value={mobile}
                        maxLength={10}
                        placeholder="10-digit number"
                        onChange={(e) =>
                          setMobile(e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </label>
                  </>
                )}
              </div>
              <div className="order-list">
                <div className="list-heading">
                  <span>ITEM</span>
                  <span>AMOUNT</span>
                </div>
                {!lines.length && (
                  <div className="empty">
                    <span className="empty-icon">♧</span>
                    <b>Your table is waiting</b>
                    <p>Add something delicious from the menu.</p>
                  </div>
                )}
                {lines.map((l) => (
                  <div className="order-line" key={l.foodId}>
                    <div>
                      <b>{l.name}</b>
                      <small>
                        {money(l.price)} each · {l.tax}% tax
                      </small>
                      <div className="quantity">
                        <button
                          aria-label={`Remove one ${l.name}`}
                          onClick={() =>
                            setLines((ls) =>
                              removeOne(ls, l.foodId),
                            )
                          }
                        >
                          −
                        </button>
                        <span>{l.quantity}</span>
                        <button
                          aria-label={`Add one ${l.name}`}
                          onClick={() =>
                            setLines((ls) =>
                              ls.map((x) =>
                                x.foodId === l.foodId
                                  ? { ...x, quantity: x.quantity + 1 }
                                  : x,
                              ),
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <strong>{money(l.price * l.quantity)}</strong>
                  </div>
                ))}
              </div>
              <div className="bill-totals">
                <div>
                  <span>Subtotal</span>
                  <b>{money(amount.subtotal)}</b>
                </div>
                <div>
                  <label htmlFor="discount">Discount (₹)</label>
                  <input
                    id="discount"
                    type="number"
                    min="0"
                    max={amount.subtotal}
                    value={discount}
                    onChange={(e) =>
                      setDiscount(Math.max(0, Number(e.target.value)))
                    }
                  />
                </div>
                {type === "PARCEL" && (
                  <div>
                    <label htmlFor="parcel">Parcel charges (₹)</label>
                    <input
                      id="parcel"
                      type="number"
                      min="0"
                      value={parcelCharge}
                      onChange={(e) =>
                        setParcelCharge(Math.max(0, Number(e.target.value)))
                      }
                    />
                  </div>
                )}
                <div>
                  <span>GST / tax</span>
                  <b>{money(amount.tax)}</b>
                </div>
                <div className="grand-total">
                  <span>Total amount</span>
                  <strong>{money(amount.total)}</strong>
                </div>
                <button
                  className="primary full"
                  disabled={!lines.length}
                  onClick={saveOrder}
                >
                  Send order to kitchen <span>→</span>
                </button>
                <p className="muted center">
                  {lines.reduce((n, l) => n + l.quantity, 0)} items · Payment
                  collected from Orders
                </p>
              </div>
            </aside>
          </div>
        )}
        {page === "Overview" && <Dashboard orders={data.orders} menu={data.menu} />}
        {page === "Orders" && (
          <section className="panel">
            <div className="section-title">
              <h2>
                Order history <span>{data.orders.length} orders</span>
              </h2>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
              >
                {[
                  "All orders",
                  "Pending",
                  "Paid",
                  "Cancelled",
                  "DINE-IN",
                  "PARCEL",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer / table</th>
                    <th>Type</th>
                    <th>Kitchen</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.orders]
                    .reverse()
                    .filter(
                      (o) =>
                        orderFilter === "All orders" ||
                        orderFilter === o.type ||
                        orderFilter === o.status ||
                        (orderFilter === "Pending" &&
                          o.payment === "Pending" &&
                          o.status !== "Cancelled") ||
                        (orderFilter === "Paid" && o.payment !== "Pending"),
                    )
                    .map((o) => (
                      <tr key={o.id}>
                        <td>
                          <b>#{o.number}</b>
                          <small>
                            {new Date(o.createdAt).toLocaleString("en-IN")}
                          </small>
                        </td>
                        <td>
                          {o.type === "DINE-IN"
                            ? `Table ${o.table} · ${o.guests} guests`
                            : o.customer || "Walk-in"}
                          <small>{o.mobile}</small>
                        </td>
                        <td>{o.type}</td>
                        <td>
                          <span className={`badge ${o.status.toLowerCase()}`}>
                            {o.status}
                          </span>
                        </td>
                        <td>
                          <b>{money(totals(o).total)}</b>
                        </td>
                        <td>{o.payment}</td>
                        <td>
                          <div className="actions">
                            <button onClick={() => setReceipt(o)}>View</button>
                            {o.payment === "Pending" &&
                              o.status !== "Cancelled" && (
                                <>
                                  <button onClick={() => editOrder(o)}>
                                    Edit
                                  </button>
                                  {canBill && (
                                    <button
                                      className="primary small"
                                      onClick={() => setPayment(o)}
                                    >
                                      Pay
                                    </button>
                                  )}
                                  {canBill && (
                                    <button
                                      className="danger"
                                      onClick={() => {
                                        if (
                                          confirm(`Cancel order #${o.number}?`)
                                        )
                                          updateOrder({
                                            ...o,
                                            status: "Cancelled",
                                          });
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </>
                              )}
                            {canBill && o.status === "Ready" && (
                              <button
                                onClick={() =>
                                  updateOrder({ ...o, status: "Served" })
                                }
                              >
                                Served
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!data.orders.length && (
              <div className="empty">
                No orders yet. Create your first order from Point of sale.
              </div>
            )}
          </section>
        )}
        {page === "Kitchen" && (
          <div className="kitchen-grid">
            {(["New", "Preparing", "Ready"] as Status[]).map((status) => (
              <section className="kitchen-column" key={status}>
                <h2>
                  {status}{" "}
                  <span>
                    {data.orders.filter((o) => o.status === status).length}
                  </span>
                </h2>
                {data.orders
                  .filter((o) => o.status === status)
                  .map((o) => (
                    <article className="kitchen-card" key={o.id}>
                      <div className="section-title">
                        <b>#{o.number}</b>
                        <span className="badge">
                          {o.type === "DINE-IN" ? `Table ${o.table}` : "Parcel"}
                        </span>
                      </div>
                      <small>
                        {new Date(o.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                      <ul>
                        {o.lines.map((l) => (
                          <li key={l.foodId}>
                            <strong>{l.quantity}×</strong> {l.name}
                          </li>
                        ))}
                      </ul>
                      <button
                        className="primary full"
                        onClick={() =>
                          updateOrder({
                            ...o,
                            status:
                              status === "New"
                                ? "Preparing"
                                : status === "Preparing"
                                  ? "Ready"
                                  : "Served",
                          })
                        }
                      >
                        {status === "New"
                          ? "Start preparing"
                          : status === "Preparing"
                            ? "Mark ready"
                            : "Mark served"}{" "}
                        →
                      </button>
                    </article>
                  ))}
                {!data.orders.some((o) => o.status === status) && (
                  <div className="empty">All caught up.</div>
                )}
              </section>
            ))}
          </div>
        )}
        {page === "Food menu" && (
          <section className="panel">
            <div className="section-title">
              <div>
                <h2>Your food collection</h2>
                <p className="muted">
                  Manage prices, tax, categories and today’s availability.
                </p>
              </div>
              <button
                className="primary"
                onClick={() => setFood({ ...emptyFood })}
              >
                + Add food item
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Dine-in</th>
                    <th>Parcel</th>
                    <th>Tax</th>
                    <th>Availability</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.menu.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <b>{i.name}</b>
                        <small>{i.veg ? "Vegetarian" : "Non-vegetarian"}</small>
                      </td>
                      <td>{i.category}</td>
                      <td>{money(i.price)}</td>
                      <td>{money(i.parcelPrice)}</td>
                      <td>{i.tax}%</td>
                      <td>
                        <button
                          className={`badge ${i.available ? "ready" : "cancelled"}`}
                          onClick={() =>
                            persist({
                              ...data,
                              menu: data.menu.map((x) =>
                                x.id === i.id
                                  ? { ...x, available: !x.available }
                                  : x,
                              ),
                            })
                          }
                        >
                          {i.available ? "Available" : "Unavailable"}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => setFood({ ...i })}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {page === "Reports" && (
          <>
            <section className="panel report-controls">
              <label>
                From
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  min={from}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
              <button
                onClick={() => {
                  setFrom(localDate());
                  setTo(localDate());
                }}
              >
                Today
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 6);
                  setFrom(localDate(d.toISOString()));
                  setTo(localDate());
                }}
              >
                Last 7 days
              </button>
              <button
                onClick={() => {
                  setFrom(`${localDate().slice(0, 7)}-01`);
                  setTo(localDate());
                }}
              >
                This month
              </button>
              <button
                className="primary"
                disabled={!from || !to || from > to}
                onClick={exportCsv}
              >
                ↓ Export CSV
              </button>
            </section>
            {from > to && (
              <p className="warning">From date must be before To date.</p>
            )}
            {stats(report.filter((o) => o.status !== "Cancelled"))}
            <p className="muted">
              Sales reflect paid, non-cancelled orders by order date. Item and
              category amounts are before discounts and tax.
            </p>
            <div className="two-column">
              <section className="panel">
                <h2>Sales breakdown</h2>
                {["DINE-IN", "PARCEL"].map((t) => (
                  <div className="report-row" key={t}>
                    <span>{t}</span>
                    <b>{money(sum(completed.filter((o) => o.type === t)))}</b>
                  </div>
                ))}
                {["Cash", "UPI", "Card"].map((m) => (
                  <div className="report-row" key={m}>
                    <span>{m}</span>
                    <b>
                      {money(sum(completed.filter((o) => o.payment === m)))}
                    </b>
                  </div>
                ))}
                <div className="report-row">
                  <span>GST / tax collected</span>
                  <b>
                    {money(completed.reduce((n, o) => n + totals(o).tax, 0))}
                  </b>
                </div>
                <div className="report-row">
                  <span>Cancelled orders</span>
                  <b>{report.filter((o) => o.status === "Cancelled").length}</b>
                </div>
                <div className="report-row">
                  <span>Pending bills</span>
                  <b>
                    {money(
                      sum(
                        report.filter(
                          (o) =>
                            o.payment === "Pending" && o.status !== "Cancelled",
                        ),
                      ),
                    )}
                  </b>
                </div>
              </section>
              <section className="panel">
                <h2>Food-wise sales</h2>
                {grouped(completed).map(([name, v]) => (
                  <div className="report-row" key={name}>
                    <span>
                      {name}
                      <small>{v.quantity} items</small>
                    </span>
                    <b>{money(v.amount)}</b>
                  </div>
                ))}
                {!completed.length && (
                  <div className="empty">No paid orders in this period.</div>
                )}
              </section>
              <section className="panel">
                <h2>Category-wise sales</h2>
                {grouped(completed, true).map(([name, v]) => (
                  <div className="report-row" key={name}>
                    <span>{name}</span>
                    <b>{money(v.amount)}</b>
                  </div>
                ))}
              </section>
            </div>
          </>
        )}
        <footer>
          AVN POS{" "}
          <span>Made for the everyday rhythm of your restaurant.</span>
        </footer>
      </main>
      {food && role === "Owner" && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={saveFood}>
            <div className="section-title">
              <h2>{food.id ? "Edit food item" : "Add food item"}</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setFood(null)}
              >
                ×
              </button>
            </div>
            <label>
                Food name
              <input
                required
                value={food.name}
                onChange={(e) => setFood(updateFoodName(food, e.target.value))}
              />
            </label>
            <label>
              Tamil name / தமிழ் பெயர்
              <input
                lang="ta"
                value={food.tamilName ?? getTamilName(food)}
                placeholder="தமிழ் பெயரை உள்ளிடவும்"
                onChange={(e) => setFood({ ...food, tamilName: e.target.value })}
              />
              <small>Common food names fill automatically. You can edit the Tamil name.</small>
            </label>
            <div className="form-grid">
              <label>
                Category
                <select
                  value={food.category}
                  onChange={(e) =>
                    setFood({ ...food, category: e.target.value })
                  }
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Food type
                <select
                  value={food.veg ? "veg" : "nonveg"}
                  onChange={(e) =>
                    setFood({ ...food, veg: e.target.value === "veg" })
                  }
                >
                  <option value="veg">Vegetarian</option>
                  <option value="nonveg">Non-vegetarian</option>
                </select>
              </label>
              {(["price", "parcelPrice", "tax"] as const).map((key) => (
                <label key={key}>
                  {key === "price"
                    ? "Dine-in price (₹)"
                    : key === "parcelPrice"
                      ? "Parcel price (₹)"
                      : "Tax (%)"}
                  <input
                    type="number"
                    min="0"
                    max={key === "tax" ? 100 : 100000}
                    step="0.01"
                    required
                    value={food[key]}
                    onChange={(e) =>
                      setFood({ ...food, [key]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
            </div>
            <label>
              Image or emoji
              <input
                value={food.image}
                placeholder="Emoji or HTTPS image URL"
                onChange={(e) => setFood({ ...food, image: e.target.value })}
              />
            </label>
            <label>
              Upload image (max 500 KB)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 500000) {
                    setNotice("Choose an image smaller than 500 KB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () =>
                    setFood((current) =>
                      current
                        ? { ...current, image: String(reader.result) }
                        : null,
                    );
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={food.available}
                onChange={(e) =>
                  setFood({ ...food, available: e.target.checked })
                }
              />
              Available today
            </label>
            <button className="primary full" type="submit">
              Save food item
            </button>
          </form>
        </div>
      )}
      {payment && canBill && (
        <div className="modal-backdrop">
          <div className="modal payment-modal">
            <button
              className="close"
              onClick={() => setPayment(null)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="eyebrow">COLLECT PAYMENT</div>
            <h2>Bill #{payment.number}</h2>
            <div className="payment-total">{money(totals(payment).total)}</div>
            <p>Choose how the customer paid.</p>
            <div className="payment-options">
              {(["Cash", "UPI", "Card"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    const next = {
                      ...payment,
                      payment: mode,
                      paidAt: new Date().toISOString(),
                    };
                    if (updateOrder(next)) {
                      setPayment(null);
                      setReceipt(next);
                    }
                  }}
                >
                  {mode === "Cash" ? "▤" : mode === "UPI" ? "▦" : "▰"}
                  <b>{mode}</b>
                </button>
              ))}
            </div>
            <small className="muted">
              Records a payment only. No payment gateway is connected.
            </small>
          </div>
        </div>
      )}
      {receipt && (
        <div className="modal-backdrop receipt-backdrop">
          <div className="modal receipt">
            <div className="receipt-head">
              <div className="brand-mark">AVN</div>
              <h2>ABC HOTEL</h2>
              <p>Fresh food. Warm memories.</p>
            </div>
            <hr />
            <div className="report-row">
              <b>BILL #{receipt.number}</b>
              <span>{receipt.type}</span>
            </div>
            <small>{new Date(receipt.createdAt).toLocaleString("en-IN")}</small>
            <p>
              {receipt.type === "DINE-IN"
                ? `Table ${receipt.table} · ${receipt.guests} guests`
                : `${receipt.customer || "Walk-in customer"} ${receipt.mobile}`}
            </p>
            {receipt.status === "Cancelled" && <h2>CANCELLED</h2>}
            <hr />
            {receipt.lines.map((l) => (
              <div className="report-row" key={l.foodId}>
                <span>
                  {l.quantity} × {l.name}
                  <small>{money(l.price)} each</small>
                </span>
                <b>{money(l.quantity * l.price)}</b>
              </div>
            ))}
            <hr />
            {Object.entries(totals(receipt)).map(([key, value]) => (
              <div
                className={`report-row ${key === "total" ? "receipt-total" : ""}`}
                key={key}
              >
                <span>{key === "tax" ? "GST / tax" : key}</span>
                <b>
                  {key === "discount" ? "−" : ""}
                  {money(value)}
                </b>
              </div>
            ))}
            <p>
              Payment: <b>{receipt.payment}</b>
            </p>
            <p className="center">
              Thank you. Visit again!
              <br />
              <small>Powered by AVN POS</small>
            </p>
            <div className="actions no-print">
              <button onClick={() => setReceipt(null)}>Close</button>
              {canBill && (
                <button className="primary" onClick={() => window.print()}>
                  Print / Save PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
