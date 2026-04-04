---
layout: default
nav_exclude: true
title: "Array Operations"
nav_order: 12
lang: en
hreflang_alt: "ja/python/OPVECTOR"
hreflang_lang: "ja"
---

# Basic Operators and Functions for Arrays
Operators and functions for arrays operate element-wise.

## Basic operators for arrays
The basic operators **`+`**, **`-`**, **`*`**, and **`/`** work for arrays of variables and expressions.
These operators are applied element-wise.

### Array--Scalar Operations
When you combine an array and a scalar, the scalar is applied to each element of the array.

The following program illustrates this behavior:
```python
import pyqbpp as qbpp

x = qbpp.var("x", 3)
f = 2 * x + 1

print("f =", f)
for i in range(len(f)):
    print(f"f[{i}] =", f[i])
```
This program produces the following output:
```
f = {1 +2*x[0],1 +2*x[1],1 +2*x[2]}
f[0] = 1 +2*x[0]
f[1] = 1 +2*x[1]
f[2] = 1 +2*x[2]
```

### Array--Array Operations
When you combine two arrays of the same size, the operation is performed element-wise.

```python
import pyqbpp as qbpp

x = qbpp.var("x", 3)
y = qbpp.var("y", 3)
f = 2 * x + 3 * y + 1

print("f =", f)
for i in range(len(f)):
    print(f"f[{i}] =", f[i])
```
This program produces the following output:
```
f = {1 +2*x[0] +3*y[0],1 +2*x[1] +3*y[1],1 +2*x[2] +3*y[2]}
f[0] = 1 +2*x[0] +3*y[0]
f[1] = 1 +2*x[1] +3*y[1]
f[2] = 1 +2*x[2] +3*y[2]
```

## Compound operators for arrays
The compound operators **`+=`**, **`-=`**, **`*=`**, and **`/=`** also work element-wise for arrays:
```python
import pyqbpp as qbpp

x = qbpp.var("x", 3)
y = qbpp.var("y", 3)
f = 6 * x + 4

f += 3 * y
print("f =", f)
f -= 12
print("f =", f)
f *= 2 * y
print("f =", f)
f /= 2
print("f =", f)
```
This program produces the following output:
```
f = {4 +6*x[0] +3*y[0],4 +6*x[1] +3*y[1],4 +6*x[2] +3*y[2]}
f = {-8 +6*x[0] +3*y[0],-8 +6*x[1] +3*y[1],-8 +6*x[2] +3*y[2]}
f = {12*x[0]*y[0] +6*y[0]*y[0] -16*y[0],12*x[1]*y[1] +6*y[1]*y[1] -16*y[1],12*x[2]*y[2] +6*y[2]*y[2] -16*y[2]}
f = {6*x[0]*y[0] +3*y[0]*y[0] -8*y[0],6*x[1]*y[1] +3*y[1]*y[1] -8*y[1],6*x[2]*y[2] +3*y[2]*y[2] -8*y[2]}
```

## Square function for arrays
The square function also works element-wise for arrays:
```python
import pyqbpp as qbpp

x = qbpp.var("x", 3)
f = qbpp.sqr(x + 1)

print("f =", f)
```
This program produces the following output:
```
f = {1 +x[0]*x[0] +x[0] +x[0],1 +x[1]*x[1] +x[1] +x[1],1 +x[2]*x[2] +x[2] +x[2]}
```

## Simplify functions for arrays
Simplify functions also work element-wise for arrays:
```python
import pyqbpp as qbpp

x = qbpp.var("x", 3)
f = qbpp.sqr(x - 1)
print("f =", f)
print("qbpp.simplify(f) =", qbpp.simplify(f))
print("qbpp.simplify_as_binary(f) =", qbpp.simplify_as_binary(f))
print("qbpp.simplify_as_spin(f) =", qbpp.simplify_as_spin(f))
```
This program produces the following output:
```
f = {1 +x[0]*x[0] -x[0] -x[0],1 +x[1]*x[1] -x[1] -x[1],1 +x[2]*x[2] -x[2] -x[2]}
simplify(f) = {1 -2*x[0] +x[0]*x[0],1 -2*x[1] +x[1]*x[1],1 -2*x[2] +x[2]*x[2]}
simplify_as_binary(f) = {1 -x[0],1 -x[1],1 -x[2]}
simplify_as_spin(f) = {2 -2*x[0],2 -2*x[1],2 -2*x[2]}
```

> **NOTE**
> These operators and functions also work for **multi-dimensional arrays**.

## Axis-wise Sum: **`sum(axis)`**
The method **`sum(axis)`** sums elements along the specified axis, reducing the dimension by one.
Calling **`sum()`** with no argument sums all elements to a scalar `Expr`:
```python
import pyqbpp as qbpp

x = qbpp.var("x", 3, 4)
col_sums = x.sum(0)          # shape (4,)
e = col_sums.sum()           # scalar Expr (sum of all elements)
print("e =", e)
```
