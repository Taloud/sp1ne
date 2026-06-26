# Deep Modules

From "A Philosophy of Software Design":

**Deep module** = small interface + lots of implementation

```
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│                     │
│  Deep Implementation│  ← Complex logic hidden
│                     │
│                     │
└─────────────────────┘
```

**Shallow module** = large interface + little implementation (avoid)

```
┌─────────────────────────────────┐
│       Large Interface           │  ← Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Just passes through
└─────────────────────────────────┘
```

When designing interfaces, ask:

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

## Seams and decision heuristics

A **seam** (Michael Feathers) is a place where you can alter behavior without editing in that place — the *location* where a module's interface lives. Where to put the seam is its own decision, distinct from what goes behind it. (Say "seam", not "boundary" — the latter is overloaded with DDD's bounded context.)

Use these to decide whether a module or seam earns its keep:

- **The deletion test.** Imagine deleting the module. If complexity vanishes, it was a pass-through — collapse it. If the same complexity reappears across N callers, the module was earning its keep.
- **One adapter means a hypothetical seam; two means a real one.** Don't introduce a seam (a port/interface) unless something actually varies across it — typically a production adapter *and* a test adapter. A single-adapter seam is just indirection.
- **Internal vs external seams.** A deep module can have internal seams (private to its implementation, used by its own tests) as well as the external seam at its interface. Don't expose internal seams through the interface just because tests use them.
