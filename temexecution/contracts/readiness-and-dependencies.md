# Readiness And Dependencies

| Stage | Required input |
|---|---|
| Intake | Run exists |
| Understanding | Requirement document or valid codebase manifest exists |
| Requirement Categorizer | Valid Understanding with requirements |
| Test Cases | Valid Understanding; categorized requirements when the feature is enabled |
| Test Data | Valid non-empty test suite |
| Playwright | Valid synthetic dataset and test suite |
| Report | Valid Playwright artifacts or controlled execution results |

A stage must return `blocked` with a reason when its dependency is absent. It must not start work or report success.
