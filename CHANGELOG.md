# Changelog

## 0.1.0

First release.

- Six skills for Claude Code and Codex: `write-prd`, `slice-stories`, `prioritize`, `acceptance-criteria`, `stakeholder-update`, `review-spec`. Each has a Markdown output template.
- `pm-skills lint`: missing sections, vague words (English and Turkish), metrics without a number, baseline or date, incomplete Gherkin scenarios (English and Turkish keywords), untestable criteria, stories without "so that", oversized slices.
- `pm-skills score`: RICE and ICE ranking from a Markdown table, with scale checks, a warning for confidence above 80%, close-call detection and `--write` to add Score and Rank columns.
- Worked examples for one fictional feature, from meeting notes to PRD, stories, acceptance criteria, prioritisation and a status update.
