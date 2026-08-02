# NOUN Student Bot — v1 Setup & Deployment

Live repo: https://github.com/carbonactual/noun-student-bot
Live admin dashboard: https://noun-student-bot-dashboard.vercel.app

## What this does right now
- Onboards a student: asks their level (100/200/300/400) and course codes
- Exam Hall Entry Checklist: track 3 stamps + laminated-and-ready, per course
- Deadline reminders: you (admin) add a deadline, students in that level+course get auto-reminded 3 days and 1 day before
- Auto group creation: you run one command, it creates a WhatsApp group and adds every matching level+course student automatically — solving the mixed-level-groups problem directly
- **Telegram admin bridge**: pushes curated updates (new student signups, completed exam checklists, groups created, and students who got stuck) into a Telegram chat you and staff watch
- **Live admin dashboard**: a real, deployed web page showing student counts, upcoming deadlines, and exam-checklist progress — reads from the same Supabase database the bot writes to

## What this does NOT do (by design, v1)
- Does not log into the NOUN portal or touch registration/exams — nothing here reads or writes your academic record
- Does not summarize course material or past questions yet — that's v2, once this core loop is proven with real users

## Important architecture note
The WhatsApp bot itself (index.js) **cannot run on Vercel** — it needs a persistent, always-on connection that serverless platforms don't support. Only the admin dashboard runs on Vercel. The bot still needs a real always-on machine (your laptop while open, or a VPS).

---

## How to actually run it (15-20 minutes)

### 1. Clone this repo
```
git clone https://github.com/carbonactual/noun-student-bot.git
cd noun-student-bot
```

### 2. Set up Supabase (the shared database)
1. Go to supabase.com → New Project → give it a name, set a database password, pick a region close to Nigeria (e.g. a European region).
2. Once created: Project Settings → API. Copy your **Project URL**, **anon public key**, and **service_role key** — you'll need all three.
3. Go to SQL Editor → New Query → paste the entire contents of `supabase-schema.sql` → Run. This creates the `students`, `deadlines`, and `exam_checklists` tables.
4. (Recommended) Go to Authentication → Policies for each table and enable Row Level Security with a read-only policy for the `anon` role, so the public dashboard can only read, never write.

### 3. Connect the bot to Supabase
Open `db-supabase.js`, and either:
- Set environment variables (recommended): `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, or
- Paste your values directly at the top of the file, replacing the placeholders.

Use the **service_role** key here — it has write access, which the bot needs.

### 4. Connect the dashboard to Supabase
Open `dashboard/index.html`, find `SUPABASE_URL` and `SUPABASE_ANON_KEY` near the top of the script, paste in your **Project URL** and **anon public** key (not the service_role key — the dashboard should only ever get read access). Commit and push — if the Vercel project is connected to this GitHub repo, it redeploys automatically.

### 5. Get a computer/server that can stay on (for the bot)
Your laptop (while it's on and connected), or a cheap always-on VPS (DigitalOcean, a Nigerian VPS provider, or a spare Android phone running Termux). Don't use your only personal WhatsApp number if you plan to scale — consider a second SIM/number once you're past a handful of test users.

### 6. Install Node.js
If not already installed: https://nodejs.org (LTS version). Confirm with `node --version` — should show v18+.

### 7. Install dependencies
```
npm install
```

### 8. Add your admin number
Open `index.js`, find `ADMIN_NUMBERS` near the top, replace with your real WhatsApp number in international format, no `+`, no spaces (e.g. `234803xxxxxxx`).

### 9. Set up the Telegram admin bridge
See `telegram.js` header comments — brief version: message @BotFather → `/newbot` → get a token; create a staff Telegram group, add the bot; get the chat ID via @RawDataBot; set `TELEGRAM_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID`.

### 10. Start the bot
```
npm start
```
Scan the QR code with WhatsApp → Settings → Linked Devices → Link a Device. Once connected, the bot is live, and the dashboard shows real data.

**Keep the terminal/server running** — that's what keeps the bot live 24/7.

---

## Connecting Vercel to this repo for auto-deploys (recommended)
Vercel dashboard → Add New Project → Import `carbonactual/noun-student-bot` → set **Root Directory** to `dashboard` → Deploy. From then on, every push to `main` auto-redeploys the dashboard — no manual redeploy needed.

---

## Admin commands (send these from your admin number)

**Add a deadline:**
```
admin adddeadline 300 CIT301 TMA 2 submission | 2026-08-15
```

**Auto-create a level+course group with all matching students:**
```
admin creategroup 300 CIT301
```

**Broadcast a message to everyone in a level+course:**
```
admin broadcast 300 CIT301 Reminder: exam moved to Friday
```

---

## Testing it yourself first
Before showing this to real students, message the bot from your own second number (or ask a friend) and walk through: onboarding → `examcheck CIT301` → `done CIT301 1` → confirm it tracks correctly. Then test `admin adddeadline` and `admin creategroup` with a couple of test accounts registered under the same level+course.

## Realistic next steps once this is live with real users
1. Get 10-20 real students using it for 1-2 weeks
2. Watch what breaks or confuses people — the fallback message ("Not sure what you mean") will tell you a lot about what students actually try to type
3. Only then build v2: portal integration, study material summarization, past-question packs — the paid tier
