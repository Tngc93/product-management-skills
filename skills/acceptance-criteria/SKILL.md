---
name: acceptance-criteria
description: Write acceptance criteria and test scenarios for a user story or requirement in Given/When/Then (Gherkin), including edge cases, error paths and non-functional checks, so that a developer and a tester agree on "done" before work starts. Use when the user asks for acceptance criteria, test cases, test scenarios, Gherkin, BDD, definition of done, or QA handoff for a story.
---

# Write acceptance criteria

Acceptance criteria are the contract for "done". Each one must be checkable by someone who did not write it, without asking the author what they meant.

CLI: `node "${CLAUDE_PLUGIN_ROOT}/cli/pm-skills.mjs"` (or `../../cli/pm-skills.mjs` relative to this file). Below, `pm-skills`.

## 1. Understand the story

Read the story and its parent PRD if there is one. Identify the actor, the trigger, the expected outcome and the business rules involved. If a rule is ambiguous (what happens at exactly the limit? who sees what?), list it as a question rather than picking an answer silently.

## 2. Find the scenarios

Work through these, in order, and keep the ones that apply:

1. **Happy path**: the main thing working.
2. **Business rules**: one scenario per rule, including the exact boundary (`at 100`, `at 101`).
3. **Alternative paths**: other valid ways to get the outcome.
4. **Errors and empty states**: invalid input, missing data, no results, timeouts, the other system being down.
5. **Permissions**: who must not be able to do this.
6. **Non-functional**, only where they matter for this story: performance budget, accessibility, localisation, analytics events, audit trail.

## 3. Write them

Start from `pm-skills template acceptance-criteria`. Rules:

- One behaviour per scenario. One `When` per scenario.
- `Given` sets up state, not actions. `Then` describes something observable: what the user sees, what is stored, which event is sent. Never "the system works correctly".
- Use concrete example data (`a cart of 3 items totalling 1,250 TL`), not placeholders. Use a Scenario Outline with an Examples table when only the data changes.
- Use the domain's words, not UI implementation details, unless the detail is the requirement.
- If the team writes in Turkish, Turkish Gherkin keywords are fine: `Senaryo`, `Diyelim ki`, `Eğer ki`, `O zaman`, `Ve`.

## 4. Check

Run `pm-skills lint <file> --type criteria`. Every scenario must have Given, When and Then; criteria using "should" without anything measurable are flagged; vague words are flagged.

Return the scenarios plus a short list of the questions you could not resolve, each with who should answer it.
