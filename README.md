# Bistro Lumière

A French restaurant delivery app built on the MERN stack (MongoDB, Express, React, Node).

Customers order without ever creating an account. The restaurant signs in at a
separate `/admin` area to receive orders, move them through the kitchen, and
manage la carte.

```
Customer                              Restaurant (/admin)
────────                              ───────────────────
Visit website
Select food        ┐
Add to cart        │ no login
Enter address      │ required
Payment            │
Place order        ┘  ──────────────▶  Receives order      ┐
                                       Prepare food        │ login
                                       Out for delivery    │ required
Track order  ◀──── live status ──────  Delivered           ┘
```

---

## What you need

- **Node.js 20.19+** (`node -v`)
- **A MongoDB Atlas cluster** — free tier is fine

## Setup

### 1. Get a database

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a user with a password.
3. **Network Access** → add your IP (or `0.0.0.0/0` while developing).
4. **Connect → Drivers** → copy the connection string.

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set:

- `MONGO_URI` — your Atlas string, with `<password>` replaced (drop the angle
  brackets — they're placeholders). Keep `/fooddelivery` in the path.
- `JWT_SECRET` — any long random string.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the restaurant account the seed script creates.

### 3. Install and seed

```bash
npm run install:all   # installs root, server, and client
npm run seed          # creates 24 dishes + your admin account
```

### 4. Run it

```bash
npm run dev           # starts the API on :5000 and the site on :5173
```

| | |
|---|---|
| Customer site | http://localhost:5173 |
| Restaurant admin | http://localhost:5173/admin/login |
| API health check | http://localhost:5000/api/health |

Sign in to the admin with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

---

## Trying the full flow

1. Go to **La Carte**, add a couple of dishes.
2. **Cart → Continue to address**, fill in the form.
3. On **Payment**, use the test card `4242 4242 4242 4242`, any future expiry
   (e.g. `12/29`), any CVV. To see a failure, use `4000 0000 0000 0002`.
4. You land on a tracking page with an order number like `BL-7K3M9P`. It polls
   for updates on its own — leave it open.
5. In another tab, open `/admin/orders`, and walk the order through
   **Accept → Start preparing → Send for delivery → Mark delivered**.
6. Watch the customer's tracking page follow along.

Cash on delivery skips the card form entirely and is marked paid when the
restaurant marks the order delivered.

---

## How it's put together

```
server/
  src/
    constants.js          Order lifecycle, allowed transitions, fees, TVA, allergens
    models/               MenuItem, Order, Admin (Mongoose)
    controllers/          Request handling per resource
    routes/               menu (public) · orders (public) · admin (protected)
    middleware/auth.js    JWT check — guards every /api/admin/* route
    utils/pricing.js      Rebuilds and prices the cart from the database
    utils/mockPayment.js  Stand-in gateway; swap this one file for Stripe
    seed.js               La carte + admin account

client/
  public/menu/            Dish photography, served same-origin
  src/
    context/CartContext   Cart state, persisted to localStorage
    pages/                The customer flow, in order
    admin/                Login, dashboard, orders, menu manager
    lib/api.js            Axios instance + token handling
```

### Things worth knowing

**The browser never decides what anything costs.** Checkout sends only menu item
ids and quantities. The server looks each dish up in MongoDB, uses *that* price,
and recomputes the subtotal, delivery fee, TVA and total itself. A tampered
request body changes nothing. `server/src/utils/pricing.js` is where this happens.

**Euro amounts are rounded to cents at every step.** Floating point makes
`2.20 × 3` come out as `6.6000000000000005`. Both the server and the cart round
to cents before any total is stored or displayed, so a bag of croissants costs
what it should.

**Orders can't skip steps.** `ALLOWED_TRANSITIONS` in `server/src/constants.js`
defines the state machine. An order sitting at `PLACED` cannot be marked
`DELIVERED`; the API returns 409. Cancelling is only possible before the food
leaves the restaurant.

**Order lines are snapshots.** Each line stores the dish's name and price as they
were at the time of the order. Raising a price later doesn't rewrite history.

**Allergens are first-class.** Every dish carries a list drawn from the 14
allergens an EU food business must declare. They show on the menu card and in the
admin editor. Prices include TVA at 10%, the French rate on prepared food.

**Payment is simulated.** `mockPayment.js` validates the card shape, runs a Luhn
checksum, rejects expired cards, pauses ~900ms, then returns a fake transaction
id. Nothing leaves the machine. Replacing it with a real Stripe PaymentIntent
call means editing that one file — the order controller above it doesn't change.

**Only the admin has auth.** The customer flow is deliberately open, so the rate
limiter is what stands between it and abuse: 15 orders per IP per 10 minutes, and
8 admin sign-in attempts per 15 minutes.

---

## Deploying to Render

The app deploys as **one** service: Express serves the API *and* the built React
app from the same origin, so there is no CORS to configure and only one URL.

### 1. Open Atlas to the internet

Render connects from addresses that change. In Atlas → **Network Access** →
**Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`). Your database
is still protected by its username and password.

### 2. Push this repo to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/bistro-lumiere.git
git branch -M main
git push -u origin main
```

### 3. Create the service

In Render: **New → Blueprint**, pick the repo. `render.yaml` sets the build and
start commands, health check, and generates `JWT_SECRET` for you. Render will
prompt for the values marked `sync: false`:

| Variable | Value |
|---|---|
| `MONGO_URI` | Your Atlas string, with the real password and `/fooddelivery` in the path |
| `ADMIN_EMAIL` | Whatever you seeded with |
| `ADMIN_PASSWORD` | Your admin password |

First build takes a few minutes. Your link is `https://<service-name>.onrender.com`.

### 4. Seeding

If your Atlas database already has the menu (because you ran `npm run seed`
locally against it) there is nothing to do — the deployed app reads the same
database. Otherwise run `npm run seed` locally once, pointed at the same
`MONGO_URI`.

> **The free tier sleeps.** After 15 minutes idle, the first request takes ~50
> seconds to wake the service. Whoever you share the link with will see a slow
> first load, then normal speed.

---

## Before you deploy this

This runs correctly, but a few things are demo-grade on purpose:

- **The dish photos are placeholders.** They came from a random Flickr image
  service, matched by keyword. They are the right *subject* but not licensed for
  your use and not styled as a set. Replace them with real photography — drop
  files into `client/public/menu/` and point each dish at them from the admin
  menu editor.
- **Swap in a real payment gateway.** `mockPayment.js` never charges anyone. The
  deployed site takes card numbers and always "succeeds" — do not let a real
  customer near it.
- **Rotate the Atlas database password** if it has ever been pasted anywhere.
  Atlas → Database Access → Edit → Edit Password, then update `MONGO_URI` in
  Render.
- **Use a long random `JWT_SECRET`.** Render generates one; don't replace it with
  something memorable.
- **Order numbers are the only key to a tracking page.** They're random
  6-character codes (about a billion combinations) and the endpoint is
  rate-limited, but anyone holding the number can see the order's name, address
  and phone. If that matters, add a second factor to the lookup.
- **The tracking page polls every 15 seconds.** Fine for a handful of orders; move
  to WebSockets before real volume.
- **Refunds aren't real.** Cancelling a paid order marks the payment failed. It
  doesn't return money, because no money moved.
- Tighten CORS (`CLIENT_URL`) and put the API behind HTTPS.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API and site together, both watching for changes |
| `npm run seed` | Resets la carte, creates the admin if missing (leaves orders alone) |
| `npm run build` | Production build of the React app into `client/dist` |
