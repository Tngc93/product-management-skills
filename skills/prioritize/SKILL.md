---
name: prioritize
description: Rank a list of features, initiatives or backlog items with RICE or ICE, with every estimate written down and justified and the arithmetic done by a script rather than by the model. Use when the user asks to prioritise, rank, score, compare options, build a roadmap order, or decide what to do first.
---

# Prioritise with RICE or ICE

Scores are a way to make assumptions visible and arguable, not an oracle. The value is in the written reasons, and in noticing when two options are too close to call.

CLI: `node "${CLAUDE_PLUGIN_ROOT}/cli/pm-skills.mjs"` (or `../../cli/pm-skills.mjs` relative to this file). Below, `pm-skills`. **Never compute scores yourself. Always run `pm-skills score`.**

## 1. Choose the method

- **RICE** when you can estimate how many users an item reaches in a fixed period. Score = Reach × Impact × Confidence ÷ Effort.
- **ICE** for early ideas or growth experiments where reach is unknowable. Score = Impact × Confidence × Ease, each 1 to 10.

Use one method for the whole list. Ask the user which period reach is measured over (for example "users per quarter") and in which unit effort is measured (for example person-weeks), and use the same for every row.

## 2. Estimate each input, with a reason

Start from `pm-skills template prioritize`. For every item fill in the inputs **and a one-line reason for each**. Use the scales strictly:

| Input | Scale |
| --- | --- |
| Reach (RICE) | number of users or events in the chosen period, from data where possible |
| Impact (RICE) | 3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal |
| Confidence (RICE) | 100% with data, 80% with some evidence, 50% gut feel. Above 80% needs data |
| Effort (RICE) | person-weeks or person-months, from the people doing the work if possible |
| Impact, Confidence, Ease (ICE) | 1 to 10 each |

Where you are guessing, say so and lower confidence. Do not let the user's favourite item get a generous score that you would not give the others.

## 3. Score

Run `pm-skills score <file>`. It prints the ranked table, rejects inputs off the scale, flags confidence above 80% and lists pairs within 10% of each other. Add `--write` to put Score and Rank columns into the user's table.

## 4. Present the result

- The ranked table from the script, unchanged.
- **Close calls**: for each pair the script lists, say what would decide between them (strategy, dependencies, timing), not which number is bigger.
- **Sensitivity**: name the one or two estimates that, if wrong, would change the top three. Those are the ones worth validating first.
- What the score ignores: dependencies, deadlines, strategic bets, risk reduction. Point out where any of these should override the ranking.

Let the user make the call. Your job is to make the trade-offs visible.
