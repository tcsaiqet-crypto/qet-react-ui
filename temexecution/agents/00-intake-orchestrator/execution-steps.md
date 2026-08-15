# Intake Execution Steps

1. Create a run and persist its generation.
2. Accept requirement documents and validate file type/size.
3. Accept a codebase ZIP and apply safe extraction rules.
4. Record included, excluded, and reviewed files with reasons.
5. Merge document and ZIP metadata without losing either lane.
6. Set `blocked` until the readiness contract is true.
7. Emit intake completion only after persistence succeeds.
8. Expose counts, filters, and detailed errors in the UI.
9. Test malformed uploads, empty intake, duplicate files, and refresh restore.
10. Hand off the immutable intake snapshot to Understanding.
