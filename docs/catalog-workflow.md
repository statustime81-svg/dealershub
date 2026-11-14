# DealersHub catalog workflow

## Product structure

A product contains:

- Name and description
- Store
- Canonical category
- Optional canonical brand
- Selling unit
- Packaging details
- Active status
- One or more variants

Each variant contains:

- Name
- Optional SKU
- Wholesale price
- MOQ
- Quantity increment
- Pack size
- Optional units per pack
- Optional exact stock quantity
- Availability
- Active status

## Save behavior

Product and variant changes are saved in one
database transaction.

The backend verifies:

1. The authenticated actor.
2. Active business-admin membership.
3. Business status.
4. Store ownership.
5. Category and brand availability.
6. Variant ownership.
7. SKU uniqueness within the store.
8. Numeric constraints.

A failed transaction must not leave a partially
created product.

## Quantity rules

Allowed quantity:

    MOQ + (non-negative integer × quantity increment)

Example:

- MOQ: 12
- Increment: 6
- Allowed: 12, 18, 24, 30

MOQ is not automatically the quantity increment.

Checkout must validate these rules again.

## Historical records

Products are deactivated rather than deleted.

Existing variants omitted from an edit are
deactivated, preserving historical references.

Order items retain their purchase-time snapshots.

Changing catalog prices must not change old orders.

## Category and brand ownership

The current implementation selects from canonical
categories and brands.

The selected taxonomy is enabled for the store
during the save transaction.

Manufacturer creation of new global taxonomy
requires a confirmed business rule.

## Current editor behavior

- Add products
- Edit products
- Multiple named variants
- Wholesale pricing
- MOQ and quantity increments
- Stock and availability
- Activation and deactivation

## Remaining catalog work

- Product image upload and gallery ordering
- Signed private-image previews
- Category and brand listing filters
- Structured size/color attribute editing
- Store/category administration screens
- Concurrency conflict handling for simultaneous edits

## Create-request recovery

A new product ID is generated before submission.

A repeated create using that ID cannot create
a second product.

If the response is lost, check the product list
before submitting a new create request.

Automatic recovery of a successful-but-unacknowledged
save is not implemented yet.

## Verification

Frontend:

    npm run build

Backend, after dependencies and tools are configured:

- Check the save-product Edge Function.
- Apply migration 202611130012_product_save.sql
  after earlier migrations.
- Test authorized creation and editing.
- Test cross-business and cross-store rejection.
- Test duplicate SKU rollback.
- Test variant ID ownership.
- Test unchanged historical order snapshots.
- Test private media separately when connected.

Frontend build does not validate SQL or Edge Functions.