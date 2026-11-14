# Claude Code prompt: deploy yourmomlovesmyai.com

Unzip `yourmomlovesmyai-site.zip`, open a terminal in the unzipped `yourmomlovesmyai` folder,
start Claude Code there, and paste everything below the line.

---

You're deploying a finished static website. Don't change the site's content or design. Your job is
GitHub repo → Vercel project → custom domain → verify. The current folder is the site root
(it contains index.html, vercel.json, episodes.json, pages/, assets/, scripts/, .github/).

Ground rules:
- Never buy a domain, change a paid plan, or delete anything without asking me first.
- If a CLI needs me to log in, run the login command and wait for me to finish it in the browser.
- If something fails twice the same way, stop and tell me what you saw.

## 1. Preflight
- Confirm `git`, `gh` and `node`/`npx` are installed. Install the Vercel CLI if missing: `npm i -g vercel`.
- `gh auth status` (if not logged in: `gh auth login`, wait for me).
- `vercel whoami` (if not logged in: `vercel login`, wait for me).
- Run `python3 scripts/build.py` once and confirm it prints "built 10 episode pages + home + 404".

## 2. GitHub repo
- `git init -b main`, `git add -A`, commit with message "Initial site: AI Stack series".
- Create a **public** repo named `yourmomlovesmyai` under my account and push:
  `gh repo create yourmomlovesmyai --public --source . --push`
  (Public keeps GitHub Actions free for the hourly data job. If the name is taken, ask me.)
- Make sure Actions can push commits: `gh api -X PUT repos/{owner}/yourmomlovesmyai/actions/permissions/workflow -f default_workflow_permissions=write`
  (replace {owner} with my GitHub username from `gh api user -q .login`).

## 3. Vercel project, connected to the repo
- `vercel link --yes --project yourmomlovesmyai` (create it if it doesn't exist).
- Project settings: Framework preset **Other**, no build command, output directory = repo root,
  no install command. If `vercel link` asks, answer accordingly; otherwise leave defaults since there's
  no package.json.
- Connect Git so every push redeploys: `vercel git connect` (choose the yourmomlovesmyai repo).
- Deploy to production: `vercel --prod`. Note the production URL.

## 4. Custom domain: yourmomlovesmyai.com
- `vercel domains add yourmomlovesmyai.com` and `vercel domains add www.yourmomlovesmyai.com`
  (both attached to the yourmomlovesmyai project). Make www redirect to the apex domain.
- Run `vercel domains inspect yourmomlovesmyai.com` and tell me exactly which DNS records Vercel
  wants. Typically that's an **A record** for `@` and a **CNAME** for `www` (or switching nameservers
  to Vercel's). Use the values Vercel prints, not ones from memory.
- If the domain isn't registered to me yet, STOP and tell me. Don't buy it.
- I'll add the records at my registrar (likely Hostinger). Give me a short click-by-click list for
  Hostinger's DNS editor, then wait until I say they're in. After that, poll
  `vercel domains inspect yourmomlovesmyai.com` every minute or so (up to ~15 min) until it verifies
  and the SSL certificate is issued.

## 5. Kick the live-data job once
- `gh workflow run refresh-live-data.yml`, then `gh run watch` on that run.
- Confirm it either committed new `live.json` files or reported "No changes". If a refresh step
  failed (Yahoo sometimes rate-limits GitHub runners), show me the log lines. The site still works
  with the last snapshot, so don't block on this.

## 6. Verify
Against the production URL (and the custom domain once it's live), check that each of these returns
200: `/`, `/sand-to-thought/`, `/who-makes-ai-chips/`, `/sector-pulse/`, `/nvidia-dollar/`,
`/situational-awareness/`, `/open-vs-closed/`, `/neoclouds/`, `/neocloud-contagion/`,
`/ai-kill-switch/`, `/burry-depreciation/`, `/pages/02b-sector-pulse/assets/live.json`,
`/pages/06b-neocloud-contagion/assets/live.json`. A made-up path should return the 404 page.

## 7. Report back
Give me: the GitHub repo URL, the Vercel production URL, domain status (verified + SSL or what's
pending), whether the live-data job succeeded, and any check that failed.
