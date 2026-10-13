---
name: slice-stories
description: Break an epic, a PRD or a large story into thin vertical slices, each of which delivers user-visible value on its own and can ship in a few days. Use when the user asks to split, slice or break down work, write user stories, plan an MVP or first release, or says a story is too big.
---

# Slice stories

A good slice cuts through every layer (UI, logic, data) and ends in something a user can use or a team can learn from. A layer ("build the API", "design the screens") is not a slice: nothing can be shipped or tested with users until all layers are done.

CLI: `node "${CLAUDE_PLUGIN_ROOT}/cli/pm-skills.mjs"` (or `../../cli/pm-skills.mjs` relative to this file). Below, `pm-skills`.

## 1. Understand the whole

Read the PRD or epic. Write down, for yourself, the end-to-end user journey in five to ten steps, and the one outcome that matters most. If you cannot name that outcome, ask the user before slicing.

## 2. Find the first slice

The first slice is the thinnest path through the whole journey that a real user could use, even if it is manual, ugly or limited. Ask: what is the smallest thing we could ship that tests the riskiest assumption?

## 3. Split the rest with SPIDR

Use the five ways of splitting, in roughly this order, and say which one you used for each split:

- **Paths**: the happy path first; alternative and error paths become their own slices.
- **Interfaces**: one platform, device or channel first (web before app, one payment method first).
- **Data**: one data type, segment or locale first (one country, one product category).
- **Rules**: simplest business rule first; complex rules, limits and exceptions later.
- **Spike**: when nobody knows how to build it, a time-boxed spike whose output is a decision, not code.

Stop splitting when a slice fits in a few days for one or two people. Do not split below the level where a slice still gives value or learning.

## 4. Write each slice

Start from `pm-skills template slice-stories`. Each slice gets:

- A title that is a behaviour, not a component (`Guest can pay with a saved card`, not `Payment service`).
- A story: `As a <user>, I want <capability>, so that <outcome>`. The "so that" is mandatory: it is what lets you cut scope later.
- Two to five acceptance criteria. For the important ones, use the `acceptance-criteria` skill.
- The split method used, and what this slice deliberately leaves out.
- INVEST check: Independent, Negotiable, Valuable, Estimable, Small, Testable. Flag any letter that fails.

Order slices so that value and learning arrive early, and so that each one still makes sense if the project stops after it.

## 5. Check

Run `pm-skills lint <file> --type stories`. It flags stories without "so that", slices estimated above 8 points and titles that join two behaviours with "and". Fix them or explain why not.

Give the user the slice list and say which slice is the MVP cut, which slices are optional, and which assumption the first slice tests.
