# Zealit Hotel POS

A working React + TypeScript + Vite frontend for a hotel/restaurant. Start in Point of sale, choose Dine-in or Parcel, add items, and send an order to the kitchen. Open Orders to collect payment and print the receipt (choose Save as PDF in the browser print dialog).

## Start

```powershell
cd 'D:\Aggrandize Project\Project\Zealit-App'
npm install
npm run dev
```

If the machine's npm launcher fails, use:

```powershell
node 'C:\nvm4w\nodejs\node_modules\npm\bin\npm-cli.js' run dev
```

## Included

- Twelve dine-in tables, guest counts, editable pending orders and occupied-table validation.
- Separate parcel prices, optional customer/mobile and parcel charges.
- Menu search, category filters, quantity controls, discounts and item-specific tax.
- Kitchen queue: New → Preparing → Ready → Served; unpaid cancellation from Orders.
- Cash/UPI/Card payment records, immutable paid orders, printable receipts and browser PDF.
- Food editor with vegetarian status, availability, separate prices and image upload (500 KB).
- Today's dashboard; date-range, weekly and monthly reports; food/category/payment/tax breakdowns and CSV.
- Owner, Cashier, Waiter and Kitchen demo views with UI permissions.
- Browser-local persistence under `zealit-hotel-pos-v1`. Menu prices are copied into order lines so historical bills retain their prices.

## Financial conventions

Prices exclude tax. Fixed discounts are applied before tax and allocated proportionally across items. Tax and totals round to two decimals. Parcel charges are added after tax. The starter menu uses an illustrative, configurable 5% rate: configure the actual rates and charge rules before real use. Sales reports count paid non-cancelled orders by local order date; food/category totals show gross line sales before discounts/tax. Partial payments, refunds and split bills are not implemented.

## Verification

```powershell
npm run build
npm run lint
npm test
```

The test runner uses Node's built-in TypeScript stripping (Node 22.18+ or a newer supported release).

## Scope and backend

This is a local frontend prototype, not a production or multi-terminal billing service. Roles are a demo selector, not authenticated accounts. Payment buttons record the chosen method; they do not transfer money. Data is browser-specific, can be cleared by the browser, and does not sync across tabs or devices. Do not rely on it as the sole store for real financial records.

`database/schema.sql` provides a normalized PostgreSQL design for users, restaurants, tables, categories, food, orders, order items, bills, payments, customers, discounts and daily reporting. It is a reference schema and is not connected. A production backend still needs authentication, server-side role/restaurant authorization, atomic payment/bill writes, idempotency, audit trails, backups and API integration.

## Files

- `src/App.tsx`: views and workflows.
- `src/domain.ts`: typed data model, money calculation, starter menu and storage loader.
- `src/domain.test.mjs`: billing regression tests.
- `src/App.css`: responsive design and print styles.
- `database/schema.sql`: future backend reference.
