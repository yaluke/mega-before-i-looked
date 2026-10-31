---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Ask the human what every issue here must carry (fields, labels, wording), unless it is
   already written down in this session or in the repo. It is: see **Issue shape** below.
   Ask only if the human wants to change it, and update that section when they do.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## Issue shape

Approved by the human on 2026-10-31 (plan morning-digest). Every issue carries:

- **Title:** short, names the unit of work.
- **Label:** `plan:<plan>` from the plan's frontmatter (e.g. `plan:morning-digest`). Create the
  label first if it doesn't exist.
- **Body**, in this order:

  ```md
  Source: plan.md § <n>

  ## Scope
  <what this issue covers, from the plan section; nothing the plan doesn't say>

  ## Done when
  <the plan's "Done when", copied as written>

  ## Blocked by
  <real issue numbers, or "None". Say what is needed to start vs. what is needed for done.>

  ## Suggested model
  <strongest for logic and shared contracts; cheaper for views and tests>
  ```

- The first line is exactly `Source: plan.md § <n>`; the reviewer sorts on it. One plan section may
  become more than one issue (both cite the same `§`).
- An issue whose "Done when" depends on someone else (a reviewer looking, a human approving)
  stays open until they have done it, not until our side is sent.

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
