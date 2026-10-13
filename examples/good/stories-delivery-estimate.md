---
type: stories
source: prd-delivery-estimate.md
---

# Stories: delivery window

Outcome that matters most: shoppers know when furniture arrives before they buy.
Riskiest assumption: the windows we compute are right often enough, tested by slice 1.

| # | Slice | Split by | Points | Release |
| --- | --- | --- | --- | --- |
| 1 | Shopper sees a window for in-stock items on the product page | Data: in-stock only | 5 | MVP |
| 2 | Shopper sees a window for made-to-order items | Data: made-to-order | 5 | MVP |
| 3 | Unreliable suppliers show "confirmed after order" | Rules: exception list | 2 | MVP |
| 4 | Cart shows the latest date for the whole order | Interfaces: cart | 3 | MVP |
| 5 | Window updates when the postcode changes | Rules: postcode | 3 | Later |

## 1. Shopper sees a window for in-stock items on the product page

As a shopper, I want to see when an in-stock item would arrive, so that I can decide whether it arrives in time before I buy.

Acceptance criteria:
- The product page shows "Arrives between" with two dates for in-stock items.
- The analytics event `delivery_window_shown` is sent with both dates.

Leaves out: made-to-order items, postcode changes, the cart.
INVEST: all pass.
