# When to Mock

Mocking is a last resort, not a default. The right test strategy depends on what kind of dependency sits across the seam. Classify it first, then pick the lightest stand-in that still exercises real behavior:

| Category | Examples | Test strategy |
|---|---|---|
| **In-process** | pure computation, in-memory state, no I/O | No mock. Test through the interface directly. |
| **Local-substitutable** | DB with a local stand-in (test DB, PGLite, SQLite), in-memory filesystem | No mock. Run the real stand-in in the test suite; the seam stays internal. |
| **Remote but owned** | your own services across a network (microservices, internal APIs) | Define a **port** at the seam; inject an in-memory adapter in tests, the real transport (HTTP/gRPC/queue) in production. |
| **True external** | third-party services you don't control (payment, SMS, email) | Inject the dependency as a port; tests provide a **mock** adapter. |

The rule the old "mock at system boundaries only" was reaching for: never mock your own classes, internal collaborators, or anything you control: deepen or substitute instead. Only categories 3 and 4 (things you can't run honestly in a test) justify a real mock, and even then you mock the *adapter*, not your logic.

## Designing for Mockability

At the seams that genuinely need a stand-in (categories 3 and 4 above), design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. Prefer SDK-style interfaces over generic fetchers**

Create specific functions for each external operation instead of one generic function with conditional logic:

```typescript
// GOOD: Each function is independently mockable
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: Mocking requires conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

The SDK approach means:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint
