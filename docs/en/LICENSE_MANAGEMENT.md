---
layout: default
title: "License Management"
nav_order: 4
lang: en
hreflang_alt: "ja/LICENSE_MANAGEMENT"
hreflang_lang: "ja"
---

# License Management

This page describes how to manage your QUBO++ license using the **`qbpp-license`** command-line utility.
The license system is shared between **QUBO++ (C++)** and **PyQBPP (Python)**.

## License Types

QUBO++ offers several license types with different variable count limits and validity periods.

| License Type | Key Required | Validity | CPU Variables | GPU Variables |
|---|---|---|---|---|
| **Trial** | Yes | 30 days (renewable) | 10,000 | 10,000 |
| **Standard** | Yes | Agreement term | 2,147,483,647 | 10,000 |
| **Professional** | Yes | Agreement term | 2,147,483,647 | 2,147,483,647 |
| **Fallback** | N/A | Always | 100 | 100 |

- **Trial License**: Free, self-service. Sign up at the [QUBO++ User Portal](https://qubo-plus.github.io/portal/) using the sign-up code printed by `qbpp-license -s`. The Trial license is delivered via email on completion of registration.
- **Standard License**: For production use. Supports large-scale CPU optimization.
- **Professional License**: For production use with GPU acceleration (ABS3 Solver, Exhaustive Solver).
- **Fallback Mode**: When no valid license is set, the license is suspended, or the cache has expired with no network, QUBO++ runs with a 100-variable limit.

## Obtaining a Trial License

1. Install QUBO++ on a Linux machine.
2. Run `qbpp-license -s` — your terminal prints today's 8-character sign-up code along with the portal URL.
3. Open <https://qubo-plus.github.io/portal/>, fill the sign-up form, and enter the code from step 2.
4. After confirming your email, the portal displays your Trial license key (`T-PREFIX-XXXXXX-XXXXXX-XXXXXX`, where PREFIX is derived from your email local part).
5. Activate the key on your machine: `qbpp-license -k T-... -a`.

The 30-day Trial clock starts at the moment you sign up — the expiry date is fixed when the key is issued, so you can see your deadline in the portal immediately. Within the final week before expiry, the User Portal allows you to renew the Trial — issuing a fresh 30-day key.

## Setting and Activating the License Key

> **Scope of this section:** the activation flow described below — together with [Checking License Status](#checking-license-status) and [Deactivating a License](#deactivating-a-license) — applies to **node-locked licenses** (Trial, Standard, Professional with single-machine keys). Activation binds the key to a specific physical machine. For floating licenses, see [Floating Licenses](#floating-licenses) at the bottom of this page.
>
> **Virtual environments (Docker, VMs, ephemeral containers, etc.) are not supported with node-locked licenses.** The machine fingerprint may not be stable, activation may fail, or the cached activation may be lost when the container is rebuilt — leaving the deactivation slot stranded on the server. If you need to run QUBO++ inside a virtual environment, use a **floating license**, which is designed for this case and works without any per-machine activation.

If you have a license key, set it using one of the following methods.

### Method 1: Activate with `qbpp-license` (recommended)

Run the following command once per machine:

```bash
qbpp-license -k XXXXXX-XXXXXX-XXXXXX-XXXXXX -a
```

The license key is encrypted and cached locally. After activation, no environment variable or `-k` option is needed for subsequent runs — QUBO++ programs automatically use the cached key.

To re-activate or change the key, simply run the command again with a new key.

### Method 2: Environment Variable

Set the `QBPP_LICENSE_KEY` environment variable. This is useful for Docker/CI environments where the local cache is not persistent.

```bash
export QBPP_LICENSE_KEY=XXXXXX-XXXXXX-XXXXXX-XXXXXX
```

### Priority

When multiple methods are used, the following priority applies:

1. **`-k` argument** or `qbpp::license_key()` in code (highest)
2. **`QBPP_LICENSE_KEY` environment variable**
3. **Cached key** (lowest)

> **Note**: A Trial license key is required even for evaluation. Run `qbpp-license -s` to obtain a sign-up code, then register at the [User Portal](https://qubo-plus.github.io/portal/) to receive your Trial key.

## Checking License Status

To display the current license status without making any changes:

```bash
qbpp-license
```

This shows the license type, expiry date, variable limits, and activation usage. The command contacts the license server to refresh the status.

## Deactivating a License

To move a license to another machine, first deactivate it on the current machine:

```bash
qbpp-license -d
```

- Each license key has a limited number of allowed activations.
- Deactivation frees up one activation slot.
- There is a **24-hour cooldown** between consecutive deactivations to prevent abuse.


## Command Reference

```
Usage: qbpp-license [options]

Options:
  -h, --help          Show help message and exit
  -v, --version       Show version and exit
  -k, --key KEY       Specify a license key
  -a, --activate      Activate the license on this machine
  -d, --deactivate    Deactivate the license on this machine
  -s, --signup-code   Print today's portal sign-up code and exit
  -t, --time-out SEC  Set the server communication timeout (default: 20 seconds)
```

### Examples

| Command | Description |
|---|---|
| `qbpp-license` | Display current license status |
| `qbpp-license -s` | Print today's sign-up code for portal registration |
| `qbpp-license -k KEY -a` | Activate with a specific key |
| `qbpp-license -d` | Deactivate the license on this machine |
| `qbpp-license -t 60` | Check status with a 60-second timeout |
| `qbpp-license -k KEY -t 60 -a` | Activate with a key and extended timeout |

## How License Verification Works

- **`qbpp-license` command**: Always contacts the license server to get the latest status. This may take a few seconds depending on network conditions.
- **QUBO++ programs**: Verify the license using the **local cache** and do not block on server communication. The server is contacted only when the cache needs to be refreshed (e.g., after a long period without synchronization).
- **License key storage**: When a license is activated, the key is encrypted and cached locally. This allows subsequent runs without setting the key again.


## Network and Timeout

If your network is slow or behind a firewall/proxy, the default 20-second timeout may not be enough.

To increase the timeout:

```bash
qbpp-license -t 60 -a
```

If the server is unreachable, QUBO++ falls back to the cached license status. If no cache exists, QUBO++ runs in **Fallback Mode** (100-variable limit).

### Programs work but with limited variables

- QUBO++ may be running in Fallback Mode. Check the license status:
  ```bash
  $ qbpp-license
  ```
- Ensure the license key is set correctly via `qbpp-license -k KEY -a` or `QBPP_LICENSE_KEY`.
- Re-activate if necessary: `qbpp-license -a`

### "Deactivation cooldown"

- There is a 24-hour waiting period between consecutive deactivations.
- Wait and try again after the cooldown period has elapsed.

## Floating Licenses

Floating licenses allow shared access across multiple machines within an organization. Instead of being permanently locked to a machine, a floating license uses a **lease-based** mechanism.

- When a QUBO++ program starts, it acquires a lease from the license server.
- The lease is automatically renewed while the program is running.
- When the program exits, the lease is released, making the slot available for other machines.
- If the program crashes or the network is lost, the lease expires automatically after a timeout period.
- **Virtual environments (Docker, VMs, ephemeral containers, etc.) are fully supported.** Floating licenses do not bind to a machine fingerprint, so rebuilding a container or starting a fresh VM does not strand any activation slot.

Usage is the same as node-locked licenses:

```bash
qbpp-license -k F-XXXXXX-XXXXXX-XXXXXX-XXXXXX -a
```

The floating license key is also cached locally, so subsequent runs do not require setting the key again.
