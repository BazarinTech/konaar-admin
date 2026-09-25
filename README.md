# Konar Console

Platform administration for Konar: users, pricing, resources, revenue and the
people who are allowed to change them.

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:3002
```

It needs the Konar API running, and `KONAR_API_URL` pointing at it:

```
KONAR_API_URL=http://127.0.0.1:3001/v1
```

Sign in with a platform administrator's email and password. The first one is
seeded by the API from `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`, and only ever
when the administrator table is empty.

## How it is put together

**The session token never reaches the browser.** It lives in an httpOnly cookie
and is attached to API calls on the server, in `src/lib/api.ts`. An
administrator's token is total access to every workspace on the platform, so
keeping it out of `localStorage` removes the whole class of attacks where one
piece of injected script walks away with it. Every mutation is a server action
for the same reason.

**Pages are server components.** They fetch what they need, render it, and are
never cached — an operations console showing a stale number is worse than one
that takes another 200ms. Client components exist only where there is
interaction: forms, dialogs, and the charts.

**Navigation follows the administrator's areas, but does not enforce them.**
Hiding a link is presentation. The API answers 404 — not 403 — for an area
someone was not granted, so an administrator cannot map the parts of the
platform they do not hold by watching which URLs answer differently.

## The areas

| Area | What it is for |
| --- | --- |
| Dashboard | Users, builds, revenue and margin, with growth over thirty days |
| Users | Every account, what it paid, what it cost, and ban / sessions / credits |
| Platform | Margins, spend ceilings, plans, and the model rate card |
| Resources | Host, Postgres, Redis, queues, containers and storage, read live |
| Revenue | Revenue against cost, the combined ledger, and hand-entered lines |
| Administrators | Who may sign in, and which areas each of them sees |
| Activity | Every change an administrator has made |

Nothing in this console can edit the activity log.
