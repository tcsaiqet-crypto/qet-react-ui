# Contracts: Feature 022 — Test Case & Synthetic Data Intelligence, Script Visibility, and Selective Execution

## 1. Type Interfaces

```typescript
export interface TestCase {
  case_id: string;
  title: string;
  case_type: string;  // Positive, Negative, Boundary, Validation, Error-Handling
  feature_area: string;
  priority: string;    // Critical, High, Medium, Low
  description: string;
  review_status: string;
  steps?: string[];
  expected_result?: string;
  preconditions?: string[];
  synthetic_data_keys?: string[];
  requirement_id?: string;
  confidence?: string;
}

export interface SyntheticRecord {
  record_id: string;
  target_test_case: string;
  category: string;
  username?: string;
  password?: string;
  full_name?: string;
  ssn?: string;
  monthly_income?: number;
  employment_status?: string;
  document_file?: string;
  terms_accepted?: boolean;
  is_synthetic?: boolean;
  [key: string]: any;
}

export interface SyntheticDataset {
  dataset_id: string;
  dataset_name: string;
  data_schema: Record<string, string>;
  records: SyntheticRecord[];
  test_case_id_mapping: Record<string, SyntheticRecord[]>;
  is_synthetic: boolean;
  non_pii_disclaimer: string;
  provenance: Record<string, any>;
  upstream_case_ids?: string[];
  validation_status: string;
  synthetic_only_validated: boolean;
  fallback_used: boolean;
}

export interface PlaywrightScript {
  script_id: string;
  test_case_id: string;
  filename: string;
  code: string;
  page_objects: string[];
  selectors_used: string[];
  uncertain_selectors?: string[];
  provenance: Record<string, any>;
  upstream_case_ids?: string[];
  validation_status: string;
  selector_confidence_map?: Record<string, string>;
  fallback_used: boolean;
}
```
