# PRD: Delivery estimates

## Overview

We want to improve the product page by showing delivery dates. This should make the experience more intuitive and seamless for users and reduce support tickets significantly.

## Goals

- Increase conversion
- Fewer "where is my order" tickets

## Requirements

- Show a delivery estimate on the product page
- Estimates should be accurate
- It should be fast
- Works on mobile, tablet etc.

As a shopper I want to see when my sofa arrives.

```gherkin
Scenario: Estimate is shown
  Given an in-stock product
  Then the delivery window is shown
```

## Open questions

- Supplier lead times TBD
