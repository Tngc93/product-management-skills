---
type: criteria
story: <link or title>
---

# Acceptance criteria: <story title>

```gherkin
Feature: <capability>

  Scenario: <happy path in one line>
    Given <starting state with concrete data>
    When <one action>
    Then <observable result>
    And <another observable result>

  Scenario Outline: <business rule at its boundary>
    Given <state with <value>>
    When <action>
    Then <result>

    Examples:
      | value | result |
      | <at the limit> | <expected> |
      | <just over> | <expected> |

  Scenario: <error or empty state>
    Given <state>
    When <action>
    Then <what the user sees and what is not saved>
```

## Open questions

- <rule that is still ambiguous> (owner: <who decides>)
