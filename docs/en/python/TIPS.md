---
layout: default
nav_exclude: true
title: "Performance Tips"
nav_order: 26
lang: en
hreflang_alt: "ja/python/TIPS"
hreflang_lang: "ja"
---

# Performance Tips

This page describes common pitfalls and best practices for writing efficient PyQBPP programs.
Since PyQBPP builds expressions symbolically before solving, the way expressions are constructed
can significantly impact performance.

## Tip 1: Use `+=` instead of `= +` when building expressions in a loop

When accumulating terms in a loop, always use the compound assignment operator `+=`:

```python
x = qbpp.var("x", shape=n)
f = qbpp.Expr()

# ❌ Slow: O(N²) — clones the entire expression on every iteration
for i in range(n):
    f = f + x[i]

# ✅ Fast: O(N) — appends to the existing expression in place
for i in range(n):
    f += x[i]
```

**Why:** The `+` operator must create a new `Expr` object because the result could be assigned
to a different variable (e.g., `g = f + x[i]`).
Therefore, `f = f + x[i]` copies all existing terms every iteration, resulting in O(N²) total cost.
In contrast, `f += x[i]` appends directly to the existing expression with no copy.
This is consistent with standard Python semantics — `list += [x]` modifies in place,
while `list = list + [x]` creates a new list.

The same applies to `-=` and `*=`.

## Tip 2: Use `sqr()` instead of `f * f`

```python
f = x + y + z + 1

# ❌ Slow: clones f, then performs generic multiplication
g = f * f

# ✅ Fast: directly expands (c + t₁ + ... + tₙ)² with optimized memory allocation
g = qbpp.sqr(f)

# ✅ Even faster: squares f in place (no extra copy)
f.sqr()
```

**Why:** `sqr()` uses a specialized expansion algorithm that pre-allocates the exact amount of
memory needed, avoiding all intermediate reallocations.

## Tip 3: Use `sum()` instead of accumulating with `+=`

```python
x = qbpp.var("x", shape=n)

# ❌ Slower: builds the expression incrementally, crossing the Python/C boundary each time
f = qbpp.Expr()
for i in range(n):
    f += x[i]

# ✅ Fast: the entire summation is done inside the shared library in a single call
f = qbpp.sum(x)
```

**Why:** `sum()` processes all elements internally in a single call to the shared library,
which avoids the overhead of repeated cross-boundary calls.
Additionally, for large arrays, `sum()` automatically uses multi-threaded parallel processing
inside the shared library, providing further speedup that is not possible with a sequential loop.

## Tip 4: Use Array operations instead of element-wise loops

PyQBPP supports Array-to-Array and Array-to-scalar operations.
Use these instead of writing explicit `for` loops over elements:

```python
x = qbpp.var("x", shape=n)
y = qbpp.var("y", shape=n)

# ❌ Slow: element-wise loop, one .so call per iteration
diff = qbpp.expr(shape=n)
for i in range(n):
    diff[i] = x[i] - y[i]
penalty = qbpp.expr(shape=n)
for i in range(n):
    penalty[i] = qbpp.sqr(diff[i])

# ✅ Fast: Array operations, processed inside the .so in bulk
diff = x - y           # Array - Array
penalty = qbpp.sqr(diff)    # sqr applied to entire Array
```

**Why:** Array operations are processed inside the shared library in bulk,
eliminating the overhead of per-element cross-boundary calls.
Furthermore, for large arrays, these operations automatically use multi-threaded
parallel processing, providing significant speedup over sequential loops.

## Tip 5: Pass all mappings to `replace()` at once

```python
x = qbpp.var("x", shape=n)
f = ...  # some expression using x

# ❌ Slow: O(N × M) — scans all terms N times, and the expression may grow after each replacement
for i in range(n):
    f = qbpp.replace(f, [(x[i], values[i])])

# ✅ Fast: O(M) — scans all terms just once with a hash map lookup for each variable
f = qbpp.replace(f, [(x[i], values[i]) for i in range(n)])
```

**Why:** Each call to `replace()` traverses every term of the expression and creates a new expression.
When called N times with one mapping each, the expression is scanned N times, and may also grow after
each variable-to-expression substitution, making later iterations progressively more expensive.
Passing all mappings at once uses a hash map to replace all variables in a single traversal.

## Tip 6: Call `simplify()` only after the expression is fully built

```python
# ❌ Inefficient: simplifying at every step
for i in range(n):
    f += some_term
    f.simplify_as_binary()  # O(N log N) each time → O(N² log N) total

# ✅ Efficient: simplify once at the end
for i in range(n):
    f += some_term
f.simplify_as_binary()  # O(N log N) once
```

**Why:** `simplify()` sorts all terms and merges like terms, which costs O(N log N).
Calling it inside a loop results in O(N² log N) total work.
Simplification is typically only needed once, just before passing the expression to a solver.

**Exception:** If a heavy operation like `sqr()` or `*` follows the construction,
simplifying beforehand to reduce the term count can make the overall computation
dramatically faster. For example:

```python
x = qbpp.var("x")
f = qbpp.Expr()
for i in range(1, 100):
    f += i * x

# Without simplify: f has 99 terms (1*x + 2*x + ... + 99*x)
# sqr() expands 99² ≈ 10000 terms

f.simplify_as_binary()  # Merges into a single term: 4950*x

# With simplify: sqr() expands just 1 term → much faster
f.sqr()
f.simplify_as_binary()
```

In general, calling `simplify()` before any operation whose cost depends on the
number of terms (such as `sqr()`, multiplication, or `replace()`) can yield large speedups
when many like terms exist.

