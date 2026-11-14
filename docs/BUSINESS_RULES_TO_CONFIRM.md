# Order rules requiring confirmation

The supplied PRD requires valid wholesale orders, but does not define these
calculation and inventory details. No production values are assumed.

## 1. Tax

- Are listed wholesale prices tax-inclusive or tax-exclusive?
- Is tax product/variant-specific or uniform?
- Which verified rate applies to each applicable product?
- What rounding rules and billing-location rules apply?

## 2. Delivery and discounts

- Is delivery free, fixed, location-dependent, or quoted by the manufacturer?
- Must delivery be known before submission?
- Are any discounts actually in the approved MVP? If none, explicitly confirm
  zero discount rather than introducing an offers module.

## 3. Inventory

- Is stock reserved at Pending order submission, manufacturer confirmation,
  or only reduced at dispatch?
- What happens to reservations when an order is rejected/cancelled?
- Are backorders allowed, and how should untracked stock be treated?

## Integration contract

After approval, add a NEW migration replacing these hooks:

### public.calculate_order_charges

Inputs: business UUID, dealer UUID, authoritative subtotal (numeric).

Return JSON:

- ready: true only when all required final charges are known
- discountTotal: nonnegative currency amount <= subtotal
- taxTotal: nonnegative currency amount
- deliveryTotal: nonnegative currency amount

All amounts must have at most two decimal places. Calculation must be
server-side. Read approved product/location data if required; the function
must not trust frontend prices. Its signature is a hook, not a decision that
all businesses use a uniform tax percentage.

### public.apply_confirmed_order_stock_policy

Input: newly created order UUID. Called inside the order transaction after
item snapshots exist and before cart clearing.

Implement the approved reservation/deduction policy atomically. If required
stock cannot be reserved, raise an exception so the entire order rolls back.
Extend the schema in a new migration if the approved reservation model needs
additional records. Match future rejection/cancellation restoration behavior.

The default pricing hook reports ready=false and the default stock hook
raises an exception. Both are intentional gates, not finished business rules.

Never copy test-only example policies into production without approval.
