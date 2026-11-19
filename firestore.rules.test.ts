/**
 * Security Rules Specification & Dirty Dozen Verification Cases for Campus Cravings.
 * Designed for @firebase/rules-unit-testing against firestore.rules.
 */

export const DIRTY_DOZEN_TEST_CASES = [
  {
    name: '1. Unauthenticated order creation is denied',
    operation: 'create',
    path: 'orders/CC-9999',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Unverified email spoof of admin account is denied',
    operation: 'create',
    path: 'users/spoof_uid',
    auth: { uid: 'spoof_uid', email: 'vishal.0251mba431@dgu.ac.in', email_verified: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Identity spoofing on order creation is denied',
    operation: 'create',
    path: 'orders/CC-8888',
    auth: { uid: 'attacker_uid', email: 'a@example.com', email_verified: true },
    payload: { userId: 'victim_uid' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Shadow field (isAdmin: true) injection on profile is denied',
    operation: 'create',
    path: 'users/u1',
    auth: { uid: 'u1', email: 'u1@example.com', email_verified: true },
    payload: { uid: 'u1', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Cross-user PII read on users/{userId} is denied',
    operation: 'get',
    path: 'users/victim_uid',
    auth: { uid: 'attacker_uid', email: 'a@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Blanket list scraping on orders without owner filter is denied',
    operation: 'list',
    path: 'orders',
    auth: { uid: 'attacker_uid', email: 'a@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. ID poisoning with invalid path characters is denied',
    operation: 'create',
    path: 'orders/bad..id$123',
    auth: { uid: 'u1', email: 'u1@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Value poisoning on order stage update (string instead of int) is denied',
    operation: 'update',
    path: 'orders/CC-1001',
    auth: { uid: 'u1', email: 'u1@example.com', email_verified: true },
    payload: { stage: 'hacked' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Terminal state bypass (reverting delivered order back to active) is denied',
    operation: 'update',
    path: 'orders/CC-1001',
    auth: { uid: 'u1', email: 'u1@example.com', email_verified: true },
    payload: { status: 'active', stage: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Immutable field tampering (modifying order total after creation) is denied',
    operation: 'update',
    path: 'orders/CC-1001',
    auth: { uid: 'u1', email: 'u1@example.com', email_verified: true },
    payload: { total: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Orphaned survey submission referencing non-existent order is denied',
    operation: 'create',
    path: 'survey_responses/sr-1',
    auth: { uid: 'u1', email: 'u1@example.com', email_verified: true },
    payload: { userId: 'u1', orderId: 'CC-NONEXISTENT', npsScore: 10 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Unbounded items array (>20 items) DoS payload is denied',
    operation: 'create',
    path: 'orders/CC-7777',
    auth: { uid: 'u1', email: 'u1@example.com', email_verified: true },
    payload: { itemsCount: 50 },
    expected: 'PERMISSION_DENIED',
  },
];
