# Security and Privacy Review

**Updated:** 2026-07-12 after hardening

Fixed: High toast DOM injection; malformed/oversized import resource exposure; unbounded image history; blocked UI-state storage; missing direct-provider timeouts. Behavioral tests cover hostile markup, import bounds, retention, timeout, and cancellation.

Remaining accepted/deferred risks: debug/training redaction is best-effort and exports require review; knowledge is uncapped because silent durable-data deletion is unsafe; manual cancellation is not end-to-end safe for the SillyTavern route, so no fake control was added.

No known credential literal was found in reviewed runtime files. The artifact excludes logs, local configuration, tests, audit reports, generated output, and datasets. Repeat the secret scan after the intended tree is committed.
