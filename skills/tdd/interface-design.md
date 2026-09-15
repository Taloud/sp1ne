# Interface Design for Testability

An **interface** is everything a caller must know to use a module correctly: not just the type signature, but also its invariants, ordering constraints, error modes, required configuration, and performance characteristics. "Small surface area" means small along *all* of those axes, not just a short signature. A function with two parameters but five undocumented failure modes has a large interface.

Good interfaces make testing natural:

1. **Accept dependencies, don't create them**

   ```typescript
   // Testable
   function processOrder(order, paymentGateway) {}

   // Hard to test
   function processOrder(order) {
     const gateway = new StripeGateway();
   }
   ```

2. **Return results, don't produce side effects**

   ```typescript
   // Testable
   function calculateDiscount(cart): Discount {}

   // Hard to test
   function applyDiscount(cart): void {
     cart.total -= discount;
   }
   ```

3. **Small surface area**
   - Fewer methods = fewer tests needed
   - Fewer params = simpler test setup
