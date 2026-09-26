import { test } from "node:test";
import assert from "node:assert/strict";
import { totals, getTamilName, removeOne, updateFoodName, salesSummary } from "./domain.ts";
const line = (price, quantity = 1, tax = 5) => ({
  foodId: "test",
  name: "Food",
  category: "Breakfast",
  price,
  quantity,
  tax,
});
const order = (lines, extra = {}) => ({
  lines,
  discount: 0,
  parcelCharge: 0,
  type: "DINE-IN",
  ...extra,
});

test("Tamil names work for saved items and custom translations", () => {
  assert.equal(getTamilName({ name: "Ven Pongal" }), "வெண் பொங்கல்");
  assert.equal(getTamilName({ name: " Vada " }), "வடை");
  assert.equal(getTamilName({ name: "Special", tamilName: " சிறப்பு " }), "சிறப்பு");
  assert.equal(getTamilName({ name: "Unknown" }), "");
});

test("typing food names fills Tamil and replaces or clears an automatic value", () => {
  const idly = updateFoodName({ name: "" }, "Idly");
  assert.equal(idly.tamilName, "இட்லி");
  assert.equal(getTamilName({ name: " IDLI " }), "இட்லி");
  assert.equal(getTamilName({ name: "Masala   Dosa" }), "மசாலா தோசை");
  assert.equal(updateFoodName(idly, "Dosa").tamilName, "தோசை");
  assert.equal(updateFoodName(idly, "Unknown").tamilName, "");
  assert.equal(updateFoodName(idly, "").tamilName, "");
  assert.equal(updateFoodName({ ...idly, tamilName: "மினி இட்லி" }, "Mini Idly").tamilName, "மினி இட்லி");
});

test("minus updates totals, preserves other items and removes the last unit", () => {
  const original = [line(30, 2), { ...line(50), foodId: "other" }];
  const reduced = removeOne(original, "test");
  assert.equal(reduced[0].quantity, 1);
  assert.equal(totals(order(reduced)).subtotal, 80);
  assert.equal(original[0].quantity, 2);
  assert.deepEqual(removeOne(reduced, "test"), [original[1]]);
  assert.deepEqual(removeOne([], "test"), []);
});
test("example breakfast bill has 120 subtotal and 126 total", () => {
  assert.deepEqual(totals(order([line(30), line(50), line(20, 2)])), {
    subtotal: 120,
    discount: 0,
    tax: 6,
    parcel: 0,
    total: 126,
  });
});
test("parcel charge only applies to takeaway", () => {
  assert.equal(totals(order([line(100)], { parcelCharge: 10 })).total, 105);
  assert.equal(
    totals(order([line(100)], { type: "PARCEL", parcelCharge: 10 })).total,
    115,
  );
});
test("flat discount reduces taxable subtotal proportionally for mixed tax rates", () => {
  assert.deepEqual(
    totals(order([line(100, 1, 5), line(100, 1, 12)], { discount: 20 })),
    { subtotal: 200, discount: 20, tax: 15.3, parcel: 0, total: 195.3 },
  );
});
test("discount is capped at subtotal and cannot produce negative tax", () => {
  assert.equal(totals(order([line(10)], { discount: 20 })).total, 0);
  assert.equal(totals(order([line(10)], { discount: -10 })).total, 10.5);
});
test("fractional prices round to paise", () => {
  assert.equal(totals(order([line(33.33, 3)])).total, 104.99);
  assert.equal(totals(order([])).total, 0);
});

test("dashboard reconciles collected and pending and excludes cancelled bills", () => {
  const base = { ...order([line(100, 2)]), createdAt: "2026-09-25T10:00:00Z", status: "Served", payment: "Cash" };
  const summary = salesSummary([
    base,
    { ...base, payment: "UPI", lines: [line(50)], discount: 10 },
    { ...base, payment: "Pending", lines: [line(20)] },
    { ...base, status: "Cancelled", lines: [line(999)] },
  ]);
  assert.equal(summary.collected, 252);
  assert.equal(summary.outstanding, 21);
  assert.equal(summary.billed, 273);
  assert.equal(summary.active.length, 3);
  assert.deepEqual(summary.methods.map((m) => m.amount), [210, 42, 0]);
  assert.equal(summary.foods[0].quantity, 3);
  assert.equal(summary.foods[0].gross, 250);
  assert.equal(summary.days[0][1], 252);
  assert.equal(salesSummary([]).collected, 0);
});
