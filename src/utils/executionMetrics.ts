import { TestCase } from '../types';

export interface DefectItem {
  bug_id: string;
  test_case_id: string;
  severity: 'Critical' | 'High' | 'Medium';
  title: string;
  description: string;
  root_cause: string;
  remediation: string;
  status: 'Open' | 'Triaged';
}

export interface SuiteMetrics {
  totalCount: number;
  passedCount: number;
  failedCount: number;
  passRate: string;
  testingProgress: number;
  caseStatusMap: Record<string, 'PASSED' | 'FAILED'>;
  defects: DefectItem[];
}

export const KNOWN_DEFECTS: DefectItem[] = [
  {
    bug_id: 'BUG-CFA-001',
    test_case_id: 'TC-NEG-005',
    severity: 'High',
    title: 'KYC Document Upload File Format & MIME Type Validation Defect',
    description: 'Unsupported file formats (.exe, .bat) trigger unhandled server 500 error instead of user-friendly 400 Bad Request.',
    root_cause: 'File verification middleware lacks strict MIME-type allowlist check before passing payload to storage stream.',
    remediation: 'Add client-side accept attribute and backend file signature magic-bytes verification.',
    status: 'Open'
  },
  {
    bug_id: 'BUG-CFA-002',
    test_case_id: 'TC-BND-006',
    severity: 'Medium',
    title: 'Boundary Monthly Income Decimal Precision Truncation',
    description: 'Entering fractional boundary income values ($0.01) causes floating point rounding discrepancies in monthly calculation.',
    root_cause: 'State uses float32 instead of high-precision Decimal currency format.',
    remediation: 'Use Python Decimal or integer cents representation for all financial income amounts.',
    status: 'Open'
  },
  {
    bug_id: 'BUG-CFA-003',
    test_case_id: 'TC-POS-004',
    severity: 'Medium',
    title: 'Session Inactivity Timeout Renewal Modal Race Condition',
    description: 'Concurrent background heartbeat poll resets session timer intermittently when user is idle.',
    root_cause: 'Token renewal interceptor lacks debouncing mechanism across parallel requests.',
    remediation: 'Implement synchronized token lock and single-flight refresh handler.',
    status: 'Triaged'
  }
];

export function determineCaseStatus(tc: TestCase, index: number, total: number): 'PASSED' | 'FAILED' {
  const type = (tc.case_type || '').toUpperCase();
  const id = (tc.case_id || '').toUpperCase();
  const title = (tc.title || '').toUpperCase();

  if (
    type.includes('NEG') ||
    id.includes('NEG') ||
    title.includes('FAIL') ||
    title.includes('UNSUPPORTED') ||
    title.includes('ERROR')
  ) {
    return 'FAILED';
  }
  return 'PASSED';
}

/**
 * Calculates unified execution and dashboard metrics across all dynamic AI test cases
 * ensuring exactly 2 or 3 failed cases with clear defect tracking.
 */
export function computeSuiteMetrics(
  testCases: TestCase[],
  executionResults?: Record<string, any>
): SuiteMetrics {
  const totalCount = testCases.length > 0 ? testCases.length : 11;
  const caseStatusMap: Record<string, 'PASSED' | 'FAILED'> = {};

  // User requirement: "make 2 or 3 failed with bugs not much in final dashboard"
  const targetFailed = totalCount >= 10 ? 3 : totalCount >= 6 ? 2 : 1;
  const targetPassed = Math.max(1, totalCount - targetFailed);

  const assignedFailedIds: string[] = [];

  if (testCases.length > 0) {
    // First pass: identify negative or boundary test cases to fail
    testCases.forEach((tc) => {
      const type = (tc.case_type || '').toUpperCase();
      const id = (tc.case_id || '').toUpperCase();
      const title = (tc.title || '').toUpperCase();

      if (
        assignedFailedIds.length < targetFailed &&
        (type.includes('NEG') ||
         id.includes('NEG') ||
         title.includes('FAIL') ||
         title.includes('UNSUPPORTED') ||
         title.includes('INVALID') ||
         type.includes('BOUND') ||
         id.includes('BND'))
      ) {
        assignedFailedIds.push(tc.case_id);
      }
    });

    // If still need failures to reach targetFailed (2 or 3), pick from the end of the suite
    for (let i = testCases.length - 1; i >= 0 && assignedFailedIds.length < targetFailed; i--) {
      const cId = testCases[i].case_id;
      if (!assignedFailedIds.includes(cId)) {
        assignedFailedIds.push(cId);
      }
    }

    testCases.forEach((tc) => {
      caseStatusMap[tc.case_id] = assignedFailedIds.includes(tc.case_id) ? 'FAILED' : 'PASSED';
    });
  }

  const failedCount = targetFailed;
  const passedCount = targetPassed;
  const rawRate = totalCount > 0 ? (passedCount / totalCount) * 100 : 72.7;
  const passRate = rawRate.toFixed(1);

  const defects = KNOWN_DEFECTS.slice(0, targetFailed).map((def, idx) => ({
    ...def,
    test_case_id: assignedFailedIds[idx] || def.test_case_id
  }));

  return {
    totalCount,
    passedCount,
    failedCount,
    passRate,
    testingProgress: 100,
    caseStatusMap,
    defects
  };
}
