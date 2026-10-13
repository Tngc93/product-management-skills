---
name: write-prd
description: Turn rough input (meeting notes, a Slack thread, a feature idea, customer feedback, a half-written doc) into a one-page product requirements document with a problem statement, users, measurable success metrics, non-goals, requirements and open questions. Use when the user asks for a PRD, a spec, a one-pager, a product brief or "write this up properly".
---

# Write a PRD

A PRD exists so that people who were not in the room build the right thing and know when it worked. Optimise for that reader. One page is the goal, two is the limit.

The CLI used below runs with Node 18.17+:

```bash
node "${CLAUDE_PLUGIN_ROOT}/cli/pm-skills.mjs" <command>
```

If `${CLAUDE_PLUGIN_ROOT}` was not substituted (for example in Codex), the CLI is at `../../cli/pm-skills.mjs` relative to this file. Below, `pm-skills` means that command.

## 1. Collect the input

Read everything the user gave you. Before writing, you need four things. If the input does not contain them, ask for the missing ones in **one** message, at most three questions:

1. **The problem**, in the user's or customer's words, and evidence that it is real (data, tickets, quotes, lost deals).
2. **Who** has it, and roughly how many of them.
3. **What success looks like**: the metric that should move, its current value, and by when.
4. **Constraints**: deadline, budget, platforms, legal, dependencies.

If the user cannot answer, write the PRD anyway and put each gap in Open questions with a name next to it. Never invent numbers. A metric with an unknown baseline is written as `baseline: unknown, measure in week 1`.

## 2. Write it

Start from the template: `pm-skills template write-prd`. Rules:

- **Problem before solution.** The problem section must make sense even if the proposed solution is thrown away.
- **Metrics are numbers with a baseline and a date**: `checkout conversion on mobile 2.1% → 2.5% by 30 Nov`. Include one guardrail metric that must not get worse.
- **Non-goals are decisions**, not a dumping ground. Each one saves a future argument.
- **Requirements are observable behaviour**, numbered so they can be referenced (R1, R2…). Mark each Must or Should. If everything is Must, nothing is.
- **No vague words.** "Fast", "easy", "seamless", "intuitive", "improve" are replaced by what they mean in this case.
- **Open questions have an owner and a date**, or they are not questions, they are hopes.
- Write in the language the user writes in. Keep product and technical terms as the team uses them.

## 3. Check it

Run `pm-skills lint <file> --type prd`. Fix every error. For each warning, either fix it or leave it on purpose and be ready to say why. Then re-read the document as an engineer who must estimate it, and as an executive who must fund it. Cut anything neither of them needs.

## 4. Hand it over

Give the user the document and, in two or three lines, the decisions you made on their behalf and the open questions that block work. If they want stories next, the `slice-stories` skill takes it from here.
