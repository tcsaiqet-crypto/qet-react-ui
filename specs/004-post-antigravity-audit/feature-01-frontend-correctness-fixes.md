# Feature 01: Frontend Correctness Fixes

## Goal
Make the React app compile and run reliably.

## Tasks
1. Fix TypeScript syntax in HomeUploadPage upload handlers.
2. Replace invalid `int | number` types with `number`.
3. Verify all frontend type definitions align with backend payloads.
4. Ensure no unhandled promise branches in upload and understanding polling.

## Acceptance
1. TypeScript check passes.
2. Production build passes.
3. Home and Understanding pages render without compile-time exceptions.
