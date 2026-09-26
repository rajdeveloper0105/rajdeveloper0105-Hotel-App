import { useState } from "react";
import { getTamilName, localDate, money, salesSummary, totals } from "./domain";
import type { Food, Order } from "./domain";

const chartColors = ["#0d9488", "#7c3aed", "#f59e0b", "#2563eb", "#e05283", "#64748b"];
function PieChart({ rows, label }: { rows: { name: string; amount: number }[]; label: string }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  let angle = 0;
  const slices = rows.map((row, index) => {
    const start = angle;
    angle += total ? row.amount / total * 360 : 0;
    return `${chartColors[index % chartColors.length]} ${start}deg ${angle}deg`;
  });
  return <div className="dashboard-pie-layout">
    <div className="dashboard-pie" role="img" aria-label={`${label}: ${total ? rows.map((row) => `${row.name} ${money(row.amount)}, ${(row.amount / total * 100).toFixed(1)}%`).join("; ") : "No sales yet"}`} style={{ background: total ? `conic-gradient(${slices.join(",")})` : "#e8eaf0" }}>
      <div className="dashboard-pie-center"><small>{total ? "Total" : "No sales"}</small><strong>{money(total)}</strong></div>
    </div>
    <ul className="dashboard-legend">{rows.map((row, index) => <li key={row.name}><span className="dashboard-dot" style={{ background: chartColors[index % chartColors.length] }} /><span>{row.name}<small>{money(row.amount)}</small></span><b>{total ? (row.amount / total * 100).toFixed(1) : "0"}%</b></li>)}</ul>
  </div>;
}

export default function Dashboard({ orders, menu }: { orders: Order[]; menu: Food[] }) {
  const [period, setPeriod] = useState("All time");
  const [from, setFrom] = useState(localDate());
  const [to, setTo] = useState(localDate());
  const [paymentFilter, setPaymentFilter] = useState("All payments");
  const [search, setSearch] = useState("");
  const [foodSearch, setFoodSearch] = useState("");
  const today = localDate();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const start = period === "Today" ? today : period === "Last 7 days" ? localDate(weekStart.toISOString()) : period === "Custom" ? from : "";
  const end = period === "Custom" ? to : period === "All time" ? "" : today;
  const invalid = period === "Custom" && (!from || !to || from > to);
  const selected = invalid ? [] : orders.filter((o) => (!start || localDate(o.createdAt) >= start) && (!end || localDate(o.createdAt) <= end));
  const summary = salesSummary(selected);
  const payments = summary.active.filter((o) =>
    (paymentFilter === "All payments" || (paymentFilter === "Paid" ? o.payment !== "Pending" : o.payment === paymentFilter)) &&
    `${o.number} ${o.customer} ${o.table}`.toLowerCase().includes(search.toLowerCase()),
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const foodRows = [...summary.foods, ...menu.filter((food) => !summary.foods.some((row) => row.id === food.id)).map((food) => ({ id: food.id, name: food.name, quantity: 0, gross: 0 }))]
    .filter((row) => `${row.name} ${getTamilName(menu.find((food) => food.id === row.id) ?? row)}`.toLowerCase().includes(foodSearch.toLowerCase()));
  const maxDay = Math.max(1, ...summary.days.map(([, amount]) => amount));
  const maxFood = Math.max(1, ...summary.foods.map((row) => row.gross));
  const foodShares = summary.foods.slice(0, 5).map((row) => ({ name: row.name, amount: row.gross }));
  if (summary.foods.length > 5) foodShares.push({ name: "Other foods", amount: summary.foods.slice(5).reduce((sum, row) => sum + row.gross, 0) });
  return <div className="dashboard">
    <section className="panel dashboard-toolbar">
      <div><h2>Sales & payments</h2><p>All figures use the order date. Cancelled orders are excluded.</p></div>
      <div className="dashboard-filters">
        <label>Period<select value={period} onChange={(e) => setPeriod(e.target.value)}>{["All time", "Today", "Last 7 days", "Custom"].map((value) => <option key={value}>{value}</option>)}</select></label>
        {period === "Custom" && <><label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></>}
      </div>
      {invalid && <p role="alert">Choose a valid date range with From on or before To.</p>}
    </section>
    <div className="dashboard-metrics">
      {[
        ["Overall billed", money(summary.billed), `${summary.active.length} orders · paid + pending`],
        ["Collected sales", money(summary.collected), `${summary.paid.length} paid orders`],
        ["Pending payment", money(summary.outstanding), `${summary.pending.length} unpaid orders`],
        ["Food items sold", String(summary.foods.reduce((sum, row) => sum + row.quantity, 0)), "Quantity from paid orders"],
      ].map(([label, value, detail]) => <div className="stat" key={label}>
        <svg className="metric-money-icon" viewBox="0 0 120 90" fill="none" aria-hidden="true" focusable="false">
          <rect x="8" y="24" width="96" height="56" rx="8" stroke="currentColor" strokeWidth="3" />
          <path d="M20 24V16a6 6 0 0 1 6-6h82a6 6 0 0 1 6 6v44" stroke="currentColor" strokeWidth="3" />
          <circle cx="56" cy="52" r="18" stroke="currentColor" strokeWidth="3" />
          <path d="M50 42h13m-13 6h13m-12-6c10 0 10 11 0 11l10 10M22 45v14m68-14v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{label}</span><strong>{value}</strong><small>{detail}</small>
      </div>)}
    </div>
    <div className="dashboard-charts">
      <section className="panel"><h2>Sales by day</h2><p className="dashboard-note">Paid bill totals, including tax and parcel charges, after discounts.</p>
        <div className="dashboard-trend">{summary.days.length ? summary.days.map(([day, value]) => <div className="dashboard-bar-row" key={day}><span>{day}</span><div className="dashboard-track"><div style={{ width: `${value / maxDay * 100}%` }} /></div><b>{money(value)}</b></div>) : <div className="empty">No paid sales in this period.</div>}</div>
      </section>
      <section className="panel"><h2>Payment split</h2><p className="dashboard-note">Cash, UPI and Card · collected payments only</p><PieChart label="Payment split" rows={summary.methods.map((row) => ({ name: row.method, amount: row.amount }))} /><div className="dashboard-pending-note">Pending <b>{money(summary.outstanding)}</b> · {summary.pending.length} bills</div></section>
      <section className="panel"><h2>Food sales share</h2><p className="dashboard-note">Top foods by sales before discounts and tax</p><PieChart label="Food sales share" rows={foodShares} />{!foodShares.length && <p className="dashboard-note">Your top-selling foods will appear here.</p>}</section>
    </div>
    <section className="panel">
      <div className="section-title"><div><h2>Each food’s sales</h2><p className="dashboard-note">Paid orders only. Item sales are before bill discounts, tax and parcel charges.</p></div><input aria-label="Search food sales" placeholder="Search food…" value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)} /></div>
      <div className="table-wrap dashboard-table"><table><thead><tr><th>Food item</th><th>Quantity sold</th><th>Item sales</th><th>Sales comparison</th></tr></thead><tbody>{foodRows.map((row) => <tr key={row.id}><td><b>{row.name}</b><small className="dashboard-tamil" lang="ta">{getTamilName(menu.find((food) => food.id === row.id) ?? row)}</small></td><td>{row.quantity}</td><td>{money(row.gross)}</td><td><div className="dashboard-track"><div style={{ width: `${row.gross / maxFood * 100}%` }} /></div></td></tr>)}</tbody></table>{!foodRows.length && <div className="empty">No matching food items.</div>}</div>
    </section>
    <section className="panel">
      <div className="section-title"><div><h2>Overall payment list</h2><p className="dashboard-note">{payments.length} bills · paid and pending</p></div><div className="dashboard-filters"><input aria-label="Search payments" placeholder="Bill, customer or table…" value={search} onChange={(e) => setSearch(e.target.value)} /><select aria-label="Payment status or method" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>{["All payments", "Paid", "Pending", "Cash", "UPI", "Card"].map((value) => <option key={value}>{value}</option>)}</select></div></div>
      <div className="table-wrap dashboard-table"><table><thead><tr><th>Bill</th><th>Order date</th><th>Customer / table</th><th>Type</th><th>Payment</th><th>Paid on</th><th>Bill total</th></tr></thead><tbody>{payments.map((o) => <tr key={o.id}><td>#{o.number}</td><td>{localDate(o.createdAt)}</td><td>{o.customer || (o.type === "DINE-IN" ? `Table ${o.table}` : "Walk-in")}</td><td>{o.type === "DINE-IN" ? "Dine-in" : "Parcel"}</td><td><span className={`dashboard-payment ${o.payment === "Pending" ? "is-pending" : ""}`}>{o.payment === "Pending" ? "Pending" : `Paid · ${o.payment}`}</span></td><td>{o.paidAt ? localDate(o.paidAt) : "—"}</td><td><b>{money(totals(o).total)}</b></td></tr>)}</tbody></table>{!payments.length && <div className="empty">No matching bills in this period.</div>}</div>
    </section>
  </div>;
}
