# gemi-connection
- GEMI (Greek register) access key: admin-only `gemi-connection` function stores it in service-only `internal_secrets` (`gemi_api_key`), never returns it, refuses keys GEMI rejects, and records each test on the `gemi-business-statistics` source row; helpers in `_shared/gemi.ts`. Why: the key stays server-side and imports run only on a tested key.
