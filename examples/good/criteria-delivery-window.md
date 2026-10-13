---
type: criteria
story: Shopper sees a window for made-to-order items
---

# Acceptance criteria: delivery window for made-to-order items

```gherkin
Feature: Delivery window on the product page

  Scenario: Made-to-order item from a reliable supplier
    Given a made-to-order sofa with a supplier lead time of 21 days
    And carrier transit of 2 to 4 days to postcode 34000
    When the shopper opens the product page on 15 Oct 2026
    Then the page shows "Arrives between 7 Nov and 9 Nov"
    And the event "delivery_window_shown" is sent with both dates

  Scenario Outline: Weekends and public holidays are skipped
    Given an in-stock lamp with carrier transit of <transit> working days
    When the shopper opens the product page on <today>
    Then the window ends on <last day>

    Examples:
      | transit | today       | last day    |
      | 2       | Thu 15 Oct  | Mon 19 Oct  |
      | 2       | Fri 16 Oct  | Tue 20 Oct  |

  Scenario: Supplier on the unreliable lead-time list
    Given a made-to-order bed from a supplier on the unreliable list
    When the shopper opens the product page
    Then the page shows "Delivery date confirmed after order"
    And no window is shown

  Scenario: Lead time missing in the ERP
    Given a made-to-order item with no lead time in the ERP
    When the shopper opens the product page
    Then the page shows "Delivery date confirmed after order"
    And an error "lead_time_missing" is logged with the product ID
```

## Open questions

- Do public holidays come from the carrier or from our own calendar? (owner: logistics engineer)
