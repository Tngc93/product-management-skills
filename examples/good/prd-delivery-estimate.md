---
type: prd
status: draft
owner: Product, Storefront
updated: 2026-10-15
---

# PRD: Delivery window on product and cart pages

## Problem

Shoppers cannot see when a product will arrive until after they pay. For made-to-order furniture this is weeks, not days, and they find out from the confirmation email. They either abandon on the product page or contact support after ordering.

Evidence:
- 31% of support tickets in September were "where is my order", 2,140 tickets (help desk export, 1 to 30 Sep).
- Product pages of made-to-order items convert at 0.9% against 2.4% for in-stock items (analytics, last 90 days).
- 6 of 10 interviewed shoppers said they need the delivery date before they buy a sofa (user interviews, August).

## Users

- **Primary:** shoppers viewing in-stock and made-to-order furniture, about 180,000 product-page sessions a week.
- **Secondary:** support agents, who answer delivery questions today.

## Goals and success metrics

| Metric | Baseline | Target | By |
| --- | --- | --- | --- |
| Conversion of made-to-order product pages | 0.9% | 1.2% | 31 Dec 2026 |
| "Where is my order" tickets per 1,000 orders | 64 | 45 | 31 Dec 2026 |
| Guardrail: orders delivered after the shown window | unknown, measure in week 1 | under 5% | 31 Dec 2026 |

## Non-goals

- Mobile app. The app release train cannot ship before December; web first.
- Exact delivery day or time slot. We show a window, because carriers do not give us days for furniture.
- Changing supplier lead times. We display what the ERP has; data quality is fixed separately with purchasing.

## Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| R1 | Product pages show "Arrives between {earliest} and {latest}" for in-stock items, using stock location and carrier transit times. | Must |
| R2 | Product pages of made-to-order items add the supplier lead time from the ERP to the window. | Must |
| R3 | Items whose supplier is on the unreliable lead-time list show "Delivery date confirmed after order" instead of a window. | Must |
| R4 | The cart shows one window per delivery group and the latest date for the whole order. | Must |
| R5 | The window is recalculated when the shopper changes the delivery postcode. | Should |
| R6 | An analytics event records the window shown, so it can be compared with the actual delivery date. | Must |

## Rollout

- Behind a flag, 10% of web traffic for one week, then 100% if conversion is not lower and fewer than 5% of orders miss the window.
- Roll back by turning the flag off; nothing is stored that depends on it.

## Open questions

| Question | Owner | Needed by |
| --- | --- | --- |
| Which suppliers go on the unreliable lead-time list, and who keeps it current? | Purchasing lead | 22 Oct 2026 |
| Do carriers expose transit times by postcode through an API, or do we keep a table? | Logistics engineer | 22 Oct 2026 |
