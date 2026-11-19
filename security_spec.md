# Campus Cravings Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Identity Integrity**: Every document in `users/{userId}`, `orders/{orderId}`, `survey_responses/{responseId}`, and `venture_plans/{userId}` MUST carry a `userId` (or `uid`) equal to `request.auth.uid` on creation, and that ownership field is immutable on updates.
2. **Verified Email Gate**: All authenticated writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **PII Isolation**: `users/{userId}` contains email, WhatsApp phone, and room/desk drop-off details; `read` is strictly restricted to the owner (`request.auth.uid == userId`) or bootstrapped admin.
4. **Order Terminal State Locking**: Once an `Order` reaches `status == 'delivered'` (and `stage == 3`), non-admin users cannot mutate `stage`, `status`, or `etaSeconds`. Stage transitions can only advance monotonically (`0 -> 1 -> 2 -> 3`).
5. **Relational Survey Referential Integrity**: A `SurveyResponse` document can only be created if the referenced `orders/{orderId}` document exists and belongs to `request.auth.uid`.
6. **Temporal Integrity**: `createdAt` and `updatedAt` fields must equal `request.time`; `createdAt` is immutable on updates.
7. **Shadow Field Rejection & Path Hardening**: Every collection enforces `keys().hasAll(...)` and `keys().hasOnly(...)`, plus `isValidId()` regex (`^[a-zA-Z0-9_\-]+$`, max 128 chars).

## 2. The "Dirty Dozen" Attack Payloads (All Must Return `PERMISSION_DENIED`)
1. **Unauthenticated Order Creation**: `create /orders/CC-9999` with `auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `create /users/u1` with `email == 'vishal.0251mba431@dgu.ac.in'` and `email_verified == false` -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Order**: `create /orders/CC-8888` by `uid: attacker` with `userId: 'victim_uid'` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Profile**: `create /users/u1` including ghost field `isAdmin: true` or `role: 'admin'` -> `PERMISSION_DENIED`.
5. **Cross-User PII Read**: `get /users/victim_uid` by `uid: attacker` -> `PERMISSION_DENIED`.
6. **Blanket List Scraping on Orders**: `list /orders` without a `where('userId', '==', auth.uid)` filter -> `PERMISSION_DENIED`.
7. **ID Poisoning**: `create /orders/..%2Fadmin..` or 1.5KB junk document ID -> `PERMISSION_DENIED` via `isValidId()`.
8. **Type / Value Poisoning on Order Update**: `update /orders/CC-1001` setting `stage: "hacked"` or `total: -9999` -> `PERMISSION_DENIED`.
9. **Terminal State Bypass**: `update /orders/CC-1001` reverting `status: 'active'` after `existing().status == 'delivered'` -> `PERMISSION_DENIED`.
10. **Immutable Field Tampering**: `update /orders/CC-1001` changing `createdAt` or `total` after order creation -> `PERMISSION_DENIED`.
11. **Orphaned Survey Submission**: `create /survey_responses/sr-1` referencing a nonexistent `orderId: 'CC-FAKE'` -> `PERMISSION_DENIED`.
12. **Unbounded Array / Payload DoS**: `create /orders/CC-7777` with 50 items or 10KB `customerName` string -> `PERMISSION_DENIED`.
