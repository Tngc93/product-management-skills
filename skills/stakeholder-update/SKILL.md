---
name: stakeholder-update
description: Write a short status update for stakeholders (executives, a steering group, partner teams or the whole team) from notes, task lists, metrics or a changelog, leading with what changed and what decisions are needed. Use when the user asks for a status update, weekly or monthly update, progress report, steering committee note, release summary or "update for my manager".
---

# Write a stakeholder update

Readers skim. In the first three lines they should learn whether things are on track, what changed since last time and what you need from them. Everything after that is supporting detail.

CLI: `node "${CLAUDE_PLUGIN_ROOT}/cli/pm-skills.mjs"` (or `../../cli/pm-skills.mjs` relative to this file). Below, `pm-skills`.

## 1. Know the reader

Ask, or infer from the request: who reads it (executive, peer team, own team), how often they get updates, and what they decide. Executives need status, risks and asks. Partner teams need dates and dependencies. The team needs context and recognition.

## 2. Gather facts

From the material the user gave: what shipped, what moved on the metrics (with numbers and the comparison period), what slipped and why, what is next with dates, and what is blocked. Do not round bad news into good news. If a date moved, say from when to when.

## 3. Write it

Start from `pm-skills template stakeholder-update`.

- **Status** in one word: On track, At risk or Off track. Choose honestly; "At risk" early is cheaper than "Off track" late.
- **TL;DR**: two or three sentences that stand on their own.
- **Progress**: outcomes, not activity. "Checkout errors down from 3.2% to 1.1%" beats "worked on checkout".
- **Next**: the next two or three milestones with dates.
- **Risks and blockers**: each with impact and what is being done about it.
- **Asks**: specific decisions or help, from a named person, by a date. If there are none, say so.
- Under 250 words for executives. Link to details instead of pasting them.
- Write in the reader's language; match the tone of the user's earlier updates if they shared one.

## 4. Check

Run `pm-skills lint <file> --type update`. It checks that summary, progress, next, risks and asks are all present and flags vague words.
