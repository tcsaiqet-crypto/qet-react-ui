# Constitution 003: Next Implementation Rules

1. **Frontend-Backend Parity**: All TypeScript interfaces must match Pydantic schemas 1:1.
2. **Error Transparency**: HTTP 4xx and 5xx errors must carry structured diagnostic error codes.
3. **No Mock Data in Production Paths**: Understanding outputs must reflect actual ingested codebases.
