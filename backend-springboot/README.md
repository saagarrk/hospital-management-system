# MedPulse Hospital Management System (HMS) - Production Backend

An enterprise-grade, production-quality **Spring Boot 3.2** REST API backend implementing **Spring Security 6**, **stateless JWT Bearer authentication**, fine-grained **Role-Based Access Control (RBAC)**, **Jakarta Bean Validation**, declarative **Spring Data JPA / Hibernate ORM** with **MySQL 8.0**, and **OpenAPI 3 / Swagger** documentation.

---

## 1. Enterprise Architecture & Package Structure

The backend strictly observes the **Separation of Concerns (SoC)** principle across 10 clean layers:

```
backend-springboot/src/main/java/com/hospital/management/
├── config/           # SecurityConfig, OpenApiConfig, JpaAuditingConfig
├── controller/       # REST API Controllers (HTTP request/response handling only)
├── dto/              # Request & Response DTOs categorized by domain
│   ├── admission/    # Inpatient & Bed management DTOs
│   ├── appointment/  # OPD Consultation & Reschedule DTOs
│   ├── audit/        # Regulatory Audit Trail DTOs
│   ├── auth/         # JWT Login, Register, Password Reset DTOs
│   ├── billing/      # Invoice, Bill Items, Payments DTOs
│   ├── common/       # ApiResponse, PagedResponse, ErrorResponse
│   ├── dashboard/    # Role-tailored aggregation DTOs
│   ├── doctor/       # Doctor directory & schedule DTOs
│   ├── laboratory/   # Pathology test orders & diagnostics DTOs
│   ├── medicalrecord/# EMR consultation notes & vitals DTOs
│   ├── patient/      # Demographics & Clinical History DTOs
│   ├── pharmacy/     # Inventory, Batch & Dispensation DTOs
│   ├── prescription/ # Medication orders & dosage regimen DTOs
│   └── user/         # User profile & credential DTOs
├── entity/           # JPA Domain Entities (@Table, @Index, @EntityListeners)
├── enums/            # Standardized domain enums (Role, AppointmentStatus, etc.)
├── exception/        # Custom domain exceptions & GlobalExceptionHandler (@RestControllerAdvice)
├── mapper/           # Bidirectional Entity <-> DTO mappers
├── repository/       # Spring Data JPA repositories with custom JPQL queries & locks
├── security/         # CustomUserDetailsService, JwtService, JwtAuthenticationFilter, Blacklist
├── service/          # Service interfaces declaring core business capabilities
│   └── impl/         # Transactional service implementations with business rule validation
└── util/             # SecurityUtils, PaginationUtils, AppConstants
```

### Architectural Guarantees
1. **Controllers** only bind HTTP requests, apply `@Valid`, extract authenticated context, and return standard `ApiResponse<T>` or `PagedResponse<T>`.
2. **Services** contain 100% of business logic, state machines, conflict detection, and transactional integrity (`@Transactional`).
3. **Repositories** encapsulate database queries, native filters, and pessimistic/optimistic locking.
4. **Entities** are NEVER exposed directly in controller signatures, eliminating JSON recursion and mass-assignment vulnerabilities.

---

## 2. DTOs & Jakarta Bean Validation

Input parameters and request bodies are strictly validated using Jakarta Bean Validation:

| Annotation | Example Usage | Business Purpose |
|------------|---------------|------------------|
| `@NotBlank` | Patient name, Doctor code, Username | Rejects null or whitespace-only inputs |
| `@NotNull` | Date of birth, Appointment date, Bed ID | Ensures non-nullable mandatory identifiers |
| `@Email` | User email, Patient contact email | Enforces RFC-compliant email formatting |
| `@Size(min, max)`| Password (min 8), Reason (min 3) | Prevents buffer truncation and weak credentials |
| `@Pattern` | Phone: `^\+?[0-9. ()-]{7,25}$` | Validates international/local telephone formats |
| `@Positive` | Bill item quantity, Payment amount, Unit price | Prevents negative or zero currency/quantity entries |
| `@Past` | Date of birth (`LocalDate`) | Guarantees patient age is logically valid |
| `@Future` / `@FutureOrPresent` | Medicine batch expiry date, Appointment date | Ensures medical supplies and consultations are valid |

Validation failures trigger `MethodArgumentNotValidException` or `ConstraintViolationException`, transformed into meaningful field-level error maps with HTTP 400.

---

## 3. Centralized Global Exception Handling

Implemented via `@RestControllerAdvice` in `GlobalExceptionHandler.java`. It guarantees zero internal stack traces or database schema details are leaked to clients.

### Standardized Error Format
```json
{
  "timestamp": "2026-09-30T11:45:00.123456",
  "status": 409,
  "error": "CONFLICT",
  "message": "Appointment conflict: Dr. Eleanor Sterling already has an active appointment at 2026-10-15 10:00:00",
  "path": "/api/appointments",
  "validationErrors": null
}
```

### Exception to HTTP Status Mapping
- `ResourceNotFoundException` → **HTTP 404 NOT_FOUND**
- `BadRequestException` / `InvalidStatusTransitionException` / `InsufficientStockException` → **HTTP 400 BAD_REQUEST**
- `UnauthorizedException` / `BadCredentialsException` / `InsufficientAuthenticationException` → **HTTP 401 UNAUTHORIZED**
- `UnauthorizedAccessException` / `AccessDeniedException` → **HTTP 403 FORBIDDEN**
- `DuplicateResourceException` / `AppointmentConflictException` / `BedUnavailableException` / `ConflictException` → **HTTP 409 CONFLICT**
- `DataIntegrityViolationException` → **HTTP 409 CONFLICT** (Sanitized constraint message)
- `Exception` (catch-all) → **HTTP 500 INTERNAL_SERVER_ERROR** (Sanitized fallback)

---

## 4. JWT Security & Authentication Lifecycle

```
[Client] 
   │
   ▼ POST /api/auth/login { username, password }
[SecurityFilterChain] -> [AuthenticationManager] -> [CustomUserDetailsService]
   │
   ▼ (BCryptPasswordEncoder verifies password hash)
[JwtService] (Generates HS256 JWT with subject, roles, issuedAt, expiration)
   │
   ▼ Returns { accessToken, tokenType: "Bearer", expiresInMs, role, ... }
[Client sends Authorization: Bearer <token>]
   │
   ▼
[JwtAuthenticationFilter]
   ├── 1. Extracts Bearer token from header
   ├── 2. Checks TokenBlacklistService (verifies token hasn't been logged out)
   ├── 3. Validates signature and expiration via JJWT parser
   ├── 4. Extracts claims & authorities (ROLE_ADMIN, ROLE_DOCTOR, etc.)
   └── 5. Sets UsernamePasswordAuthenticationToken in SecurityContextHolder
```

- **Password Hashing**: BCrypt with strength factor 10. Raw passwords are never persisted.
- **Stateless Sessions**: `SessionCreationPolicy.STATELESS` disables HTTP session cookies.
- **Server-Side Token Revocation**: `/api/auth/logout` places active JWT onto `TokenBlacklistService` until expiration.
- **No Client Trust**: The frontend-provided role is NEVER trusted; authorities are extracted directly from the verified cryptographic JWT claims.

---

## 5. Role-Based Access Control (RBAC) Matrix

| Domain Module | Endpoint Path | Allowed Roles |
|---------------|---------------|---------------|
| **Authentication** | `/api/auth/**` | Public (`permitAll`) |
| **System Admin** | `/api/admin/**`, `/api/users/**` | `ADMIN` |
| **Doctor Profiles** | `/api/doctors/**` | `ADMIN` (write), `ADMIN`, `DOCTOR`, `RECEPTIONIST` (read) |
| **Appointments** | `/api/appointments/**` | `ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT` (isolated) |
| **Medical Records** | `/api/medical-records/**` | `DOCTOR` (create/update), `ADMIN`, `NURSE`, `PATIENT` (read own) |
| **Prescriptions** | `/api/prescriptions/**` | `DOCTOR` (create), `PHARMACIST` (dispense), `ADMIN`, `NURSE`, `PATIENT` (read own) |
| **Pharmacy** | `/api/pharmacy/**` | `ADMIN`, `PHARMACIST` |
| **Laboratory** | `/api/lab/**`, `/api/laboratory/**`| `ADMIN`, `DOCTOR`, `LAB_TECHNICIAN`, `NURSE`, `PATIENT` (read own) |
| **Inpatient (IPD)**| `/api/inpatient/**` | `ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST` |
| **Billing & Invoices**| `/api/billing/**` | `ADMIN`, `RECEPTIONIST` (write), `PATIENT` (read own) |
| **Dashboards** | `/api/dashboard/**` | Authenticated (filtered by role) |
| **Audit Logs** | `/api/admin/audit-logs/**` | `ADMIN` |

---

## 6. Critical Healthcare Business Rules Enforced

1. **Doctor Double-Booking Prevention**:
   - `AppointmentServiceImpl` checks `existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn` for `PENDING` and `CONFIRMED` statuses.
   - Throws `AppointmentConflictException` (HTTP 409 Conflict) upon collision.

2. **Immutable State Lifecycle for Appointments**:
   - Cancelled appointments cannot transition to `COMPLETED` or be rescheduled. Throws `InvalidStatusTransitionException` (HTTP 400).
   - Only `CONFIRMED` appointments can be completed by clinical staff.

3. **Physician Prescriptive Authority**:
   - Only registered, active doctors can author clinical medical records and e-prescriptions.
   - Prescriptions must contain at least 1 medication with non-zero dosage and duration.

4. **Quarantine of Expired Medications**:
   - Cannot issue or dispense expired medicines.
   - Validated both at prescription creation and counter/pharmacy dispensation. Throws `BusinessRuleException` (HTTP 400).

5. **Pessimistic Bed Allocation Locking**:
   - `InpatientServiceImpl` invokes `bedRepository.findByIdForUpdate(bedId)` (pessimistic write lock) to eliminate race conditions between receptionists.
   - Rejects allocation if bed status is not `AVAILABLE` (`BedUnavailableException` → HTTP 409).

6. **Single Active Admission Invariant**:
   - Prevents admitting a patient who already has an active hospital admission (`existsByPatientIdAndStatus(patientId, "ADMITTED")`).

7. **Patient Record Isolation (HIPAA/NABH Compliance)**:
   - Authenticated patients can only access their own appointments, medical records, prescriptions, and billing summaries.
   - Enforced in `SecurityUtils.getCurrentUsername()` vs `patient.getUser().getUsername()`.

8. **Financial Ledger & Payment Integrity**:
   - Invoices cannot accept payments once status is `PAID`.
   - Payment amounts must be strictly positive and cannot exceed outstanding balance.
   - Idempotency enforced via transaction references to prevent double-charging.

---

## 7. Database Architecture & Schema (MySQL 8.0)

- **3rd Normal Form (3NF)** with explicit foreign-key constraints on delete (`RESTRICT` / `SET NULL`).
- **Surrogate Keys**: `BIGINT AUTO_INCREMENT` on all primary tables.
- **Indexes**: Composite and single-column indexes on high-throughput query criteria:
  - `idx_appointment_conflict` on `(doctor_id, appointment_date, appointment_time, status)`
  - `idx_patient_code` on `(patient_code)`
  - `idx_medicine_expiry` on `(expiry_date, status)`
  - `idx_audit_timestamp` on `(timestamp)`
- **JPA Auditing**: `@EntityListeners(AuditingEntityListener.class)` automatically injects `@CreatedDate` and `@LastModifiedDate`.
- **Fetch Strategy**: `FetchType.LAZY` on `@ManyToOne` and `@OneToMany` relationships to eliminate N+1 query bottlenecks.

---

## 8. Pagination, Dynamic Search & Sorting

All list endpoints support backend pagination using Spring Data `Pageable`:
```http
GET /api/patients?page=0&size=10&sortBy=name&direction=asc&search=rahul&status=ACTIVE&gender=MALE
```

Returns standard `PagedResponse<T>` metadata:
```json
{
  "content": [ ... ],
  "page": 0,
  "size": 10,
  "totalElements": 48,
  "totalPages": 5,
  "last": false
}
```

---

## 9. Comprehensive Regulatory Audit Logging

Every state-altering event is recorded in the `audit_logs` table via `AuditLogService` with `Propagation.REQUIRES_NEW`:

- **Captured Fields**:
  - `username`: Authenticated actor handle
  - `role`: Actor authority
  - `action`: `LOGIN`, `LOGOUT`, `PATIENT_CREATED`, `APPOINTMENT_CREATED`, `APPOINTMENT_CANCELLED`, `MEDICAL_RECORD_CREATED`, `PRESCRIPTION_CREATED`, `PAYMENT`, `USER_ACTIVATED`, `USER_DEACTIVATED`
  - `entity_type`: `USER`, `PATIENT`, `APPOINTMENT`, `MEDICAL_RECORD`, `BILL`, etc.
  - `entity_id`: Primary key of affected record
  - `timestamp`: UTC audit timestamp
  - `ip_address`: Client remote IP
  - `status`: `SUCCESS` or `FAILURE`
  - `metadata`: Sanitized contextual details

---

## 10. OpenAPI 3.0 / Swagger Documentation

Interactive API exploration is enabled via Springdoc OpenAPI:
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON Spec**: `http://localhost:8080/v3/api-docs`

Each controller is tagged and documented with `@Tag`, `@Operation`, summary, description, and bearer token security requirements.

---

## 11. Environment-Driven Configuration

No production credentials, passwords, or secrets are hardcoded:

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/hospital_management_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}
app.jwt.secret=${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}
app.jwt.expiration-milliseconds=${JWT_EXPIRATION_MS:86400000}
app.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173}
```

---

## 12. Interview Talking Points & Deep Dives

When discussing this backend during a Java / Spring Boot technical interview:

1. **Architecture & Separation of Concerns**:
   *"I structured the backend into 10 explicit packages where controllers only handle HTTP serializations, services manage business transactions and lifecycle state machines, and repositories handle persistence with pessimistic locking where concurrency collisions could occur."*

2. **Concurrency Control in Bed Allocation & Medicine Dispensing**:
   *"To prevent race conditions when two receptionists attempt to allocate the last ICU bed simultaneously, I used JPA pessimistic write locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) with a `findByIdForUpdate` repository method. This serializes concurrent transactions at the database row level."*

3. **Security Context & Zero Frontend Trust**:
   *"Role-Based Access Control is enforced on every endpoint using `@PreAuthorize`. The backend never trusts client-supplied roles; claims are extracted directly from the signed JWT parsed by `JwtAuthenticationFilter` and verified against the `SecurityContext`."*

4. **Clean Error Handling & PHI Protection**:
   *"Using `@RestControllerAdvice`, all domain conflicts and constraint violations are intercepted and translated into standardized HTTP responses (such as 409 Conflict for double-booking and 400 for validation errors), while ensuring zero internal database queries or stack traces are leaked to clients."*
