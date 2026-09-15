# Refactor Candidates

After TDD cycle, look for:

- **Duplication** → Extract function/class
- **Long methods** → Break into private helpers (keep tests on public interface)
- **Shallow modules** → Combine or deepen
- **Feature envy** → Move logic to where data lives
- **Primitive obsession** → Introduce value objects
- **Existing code** the new code reveals as problematic

## Replace, don't layer

When you deepen a cluster of shallow modules, the old unit tests that targeted the shallow pieces become waste once tests exist at the deepened module's interface: **delete them, don't keep both layers**. The interface is the test surface: new tests assert on observable outcomes through it, not on internal state. Layering new tests on top of the old ones leaves you maintaining tests coupled to an implementation that no longer has an independent existence, exactly the implementation-coupled tests this loop warns against.
