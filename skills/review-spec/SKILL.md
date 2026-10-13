---
name: review-spec
description: Review a PRD, spec, one-pager or set of stories the way a demanding senior PM, engineer and designer would, and return prioritised, specific feedback with suggested rewrites. Use when the user asks to review, critique, sanity-check, tighten or "poke holes in" a product document, or before a spec goes to engineering or leadership.
---

# Review a product document

Your job is to find what will cause rework, arguments or a failed launch, while it is still cheap to fix. Be direct and specific. Praise only what the author should keep doing.

CLI: `node "${CLAUDE_PLUGIN_ROOT}/cli/pm-skills.mjs"` (or `../../cli/pm-skills.mjs` relative to this file). Below, `pm-skills`.

## 1. Run the mechanical checks first

Run `pm-skills lint <file>` (add `--type prd`, `stories`, `criteria` or `update` if the type is not detected). Its findings go in your review as-is, grouped, so you can spend your attention on judgment.

## 2. Read as three people

- **Engineer**: Can I estimate this? Which requirement is ambiguous, contradictory or missing an edge case? What dependency or data migration is unmentioned? What will be hard that the doc treats as easy?
- **Designer / user**: Is the problem real and evidenced? Is the user's journey clear end to end, including errors and empty states? Who is left out?
- **Executive**: Why now? How will we know it worked: is the success metric the right one, with a baseline and a date? What does it cost, and what are we not doing instead? What is the riskiest assumption, and is there a cheap way to test it first?

## 3. Write the review

Start from `pm-skills template review-spec`. Rules:

- Order findings by impact: **Blocking** (must fix before work starts), **Important** (fix before launch), **Minor** (polish).
- Each finding quotes or points to the exact place, explains the consequence if left as is, and proposes a concrete rewrite or question.
- Limit to the 10 findings that matter most. A review with 40 comments gets none of them fixed.
- Do not rewrite the whole document unless asked. Do not change the author's decisions; challenge them with reasons.
- End with the three questions the author should be able to answer before the next review.
