# 🎓 HSC 2026 Rag Day — Registration Website
**BKSP Public School & College**

A professional registration website for the HSC Batch 2026 Rag Day celebration. Students fill in their name, serial number, and section — and their details are stored in this GitHub repository and displayed live on the website.

---

## 📁 Project Structure

```
HSC-26-Rag-Day/
├── index.html                        # Main website
├── style.css                         # Styles
├── app.js                            # Frontend logic
├── netlify.toml                      # Netlify config
├── data/
│   └── registrations.json            # 📦 All registrations stored here
└── netlify/
    └── functions/
        ├── register.js               # POST: save a new registration
        └── get-participants.js       # GET: fetch all participants
```

---

## 🚀 Deployment Guide

### Step 1 — Push to GitHub

1. Go to your repo: https://github.com/AlifKhan1911391/HSC-26-Rag-Day
2. Upload / push all the project files.
3. Make sure `data/registrations.json` (contains `[]`) is committed — this is where registrations will be saved.

### Step 2 — Create a GitHub Personal Access Token

1. Go to **GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Give it a name like `rag-day-registration`
4. Select the **`repo`** scope (full control of private repositories)
5. Click **Generate token** and **copy it immediately** (you won't see it again)

### Step 3 — Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and log in.
2. Click **"Add new site" → "Import an existing project"**
3. Connect your GitHub account and select the `HSC-26-Rag-Day` repo.
4. Build settings will be detected automatically from `netlify.toml`.
5. Click **Deploy site**.

### Step 4 — Set the Environment Variable

> ⚠️ This is **critical** — without this, registrations won't work.

1. In Netlify, go to your site → **Site configuration → Environment variables**
2. Click **"Add a variable"**
3. Set:
   - **Key:** `GITHUB_TOKEN`
   - **Value:** *(paste the token you copied in Step 2)*
4. Click **Save** and then **Trigger a redeploy** from the Deploys tab.

---

## ✅ How It Works

1. A student fills the registration form (name, serial, section).
2. The form sends a POST request to the **Netlify Function** (`register.js`).
3. The function reads `data/registrations.json` from **this GitHub repo** via the GitHub API.
4. It appends the new student and writes the file back.
5. The participant list on the website updates in real-time by calling `get-participants.js`.
6. Students can filter the list by **Section A / B / C / D**.

---

## 🔒 Security Notes

- The `GITHUB_TOKEN` is **never exposed** in the frontend — it lives only in Netlify's server-side environment.
- Duplicate serial numbers are rejected automatically.
- Only sections A, B, C, D are accepted.

---

## 🛠 Local Development (optional)

Install the Netlify CLI:
```bash
npm install -g netlify-cli
```

Create a `.env` file in the project root:
```
GITHUB_TOKEN=your_token_here
```

Run locally:
```bash
netlify dev
```

The site will be available at `http://localhost:8888`.

---

*Made with ❤️ for HSC Batch 2026 — BKSP Public School & College*
