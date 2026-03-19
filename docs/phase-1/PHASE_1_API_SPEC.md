# PHASE 1 API SPEC

## Endpoint
POST /api/scan

## Supported modes
- business
- product

## Request examples
### Business
```json
{
  "mode": "business",
  "url": "https://example.com"
}
```

### Product
```json
{
  "mode": "product"
}
```

## Response rules
* return success boolean
* return structured data only
* return safe error message on failure
* do not leak stack traces to UI

## Persistence rule
If scan succeeds, save result to database when DB is available.
If DB is unavailable, return graceful error/fallback and log issue.
