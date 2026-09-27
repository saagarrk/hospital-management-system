# MedPulse - Enterprise Hospital Management System (HMS)

> A production-oriented, resume-grade Java Full Stack project built with **Spring Boot 3.x, Hibernate, Spring Data JPA, Spring Security (JWT), MySQL 8.0**, and a **React (JavaScript & JSX) + Bootstrap 5** single-page frontend.

---

## 🌟 Architecture & Technology Stack

```
React (JS / JSX) Frontend (Bootstrap 5, Axios, React Router, SweetAlert2)
          │
          │ REST API / Bearer JWT
          ▼
Spring Boot 3.x REST API (Java 17+, Spring Web, Security, JPA)
          │
          ├── Controller Layer  (@RestController, @Valid, @PreAuthorize - No Business Logic)
          ├── DTO Layer         (Prevents Entity Leakage, Enforces API Contract)
          ├── Service Layer     (Interfaces & Impl, @Transactional, 14 SRS Business Rules)
          ├── Repository Layer  (Spring Data JPA, Derived Queries, Pagination)
          ├── Entity Layer      (JPA Entities, Hibernate 6, Auditing @CreatedDate)
          ├── Security Layer    (Custom UserDetailsService, JwtAuthenticationFilter, BCrypt)
          └── Exception Layer   (@RestControllerAdvice, RFC 7807, HTTP 409 Conflict)
          │
          ▼
MySQL 8.0 Database (InnoDB, UTF8mb4, 20 Normalized Tables, DDL & Seed Data)
```

---

## 🛡️ Role-Based Access Control (RBAC)

The application supports all 7 core hospital personas with distinct operational permissions:
1. **ADMIN** (`admin`): Full system-wide management, staff onboarding, room allocations, hospital analytics.
2. **DOCTOR** (`doctor_cardio`, `doctor_neuro`): OPD schedules, exclusive clinical diagnosis record creation (**Rule 3**), prescription issuing (**Rule 4**).
3. **RECEPTIONIST** (`receptionist`): Patient registration (auto-generated `PT-xxxx` codes), appointment scheduling, inpatient bed admissions.
4. **NURSE** (`nurse`): Vitals recording, telemetry monitoring, bed transfers.
5. **PHARMACIST** (`pharmacist`): Exclusive pharmacy inventory modification (**Rule 5**), expired drug dispensing lockout (**Rule 12**).
6. **LAB_TECHNICIAN** (`labtech`): Pathology and radiology laboratory test processing and report generation.
7. **PATIENT** (`patient_john`): Self-service appointment booking, isolated medical records privacy view (**Rule 9**).

*All demo accounts have default password: `Password@123`*

---

## 📋 SRS Business Rules Compliance Matrix

| Rule # | Business Requirement | Spring Boot Backend Enforcement | HTTP Status | Frontend Experience |
|---|---|---|---|---|
| **Rule 1** | Prevent conflicting doctor appointments | `appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTime` | **409 Conflict** | SweetAlert2 conflict alert with slot recommendation |
| **Rule 2** | Appointment only when doctor available | Checked against doctor `availableDays` roster in `AppointmentServiceImpl` | **400 Bad Request** | Duty day validation warning |
| **Rule 3** | Only authorized doctors create medical records | `@PreAuthorize("hasRole('DOCTOR')")` | **403 Forbidden** | Role lock badge + restriction notification |
| **Rule 4** | Only doctors create prescriptions | `@PreAuthorize("hasRole('DOCTOR')")` | **403 Forbidden** | Locked prescription modal for non-doctors |
| **Rule 5** | Only pharmacists update pharmacy stock | `@PreAuthorize("hasRole('PHARMACIST')")` | **403 Forbidden** | Read-only mode for non-pharmacist roles |
| **Rule 7** | Occupied beds cannot be assigned | Bed status check (`AVAILABLE` required) in `InpatientServiceImpl` | **409 Conflict** | Bed map lock indicator & 409 alert |
| **Rule 8** | Discharged patients release beds | Atomic bed status change to `AVAILABLE` on discharge in `@Transactional` | **200 OK** | Real-time ward map bed color update |
| **Rule 9** | Patients access only own protected records | Security principal username check in `MedicalRecordServiceImpl` | **403 Forbidden** | Automatic EMR filter to active patient ID |
| **Rule 10** | Billing clearance before discharge | Unsettled invoice check (`PAID` required) prior to discharge commit | **400 Bad Request** | Clearance blocker redirecting to invoice settlement |
| **Rule 11** | Cancelled appointments cannot be completed | State transition lock in `AppointmentServiceImpl` | **400 Bad Request** | Validation block |
| **Rule 12** | Expired medicines cannot be dispensed | `medicine.isExpired()` verification in `PharmacyServiceImpl` | **400 Bad Request** | Critical red safety interception alert |

---

## 🚀 Quick Start & Run Commands

### 1. Run Everything via Docker Compose (Recommended)

```bash
# Starts MySQL 8.0 container (with auto-migrated schema.sql & data.sql) + Spring Boot Backend
docker compose up -d --build

# Verify container health
docker compose ps
```

- **Backend API:** `http://localhost:8080/api`
- **MySQL Database:** `localhost:3306` (Database: `hospital_management_db`, User: `hms_user`, Pass: `hms_secure_pass`)

### 2. Run Backend Locally with Maven & Java 17

```bash
cd backend-springboot

# Package application into executable JAR
mvn clean package -DskipTests

# Run Spring Boot
mvn spring-boot:run
```

### 3. Run Frontend Locally

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev
```

---

## 🧪 Postman API Testing Suite

The collection is located at: `backend-springboot/postman_collection.json`

Import into Postman to run automated tests for:
1. `POST /api/auth/login` - Authenticate persona and obtain JWT Bearer token
2. `POST /api/appointments` - Book appointment (Tests valid slot vs **Rule 1 HTTP 409 Conflict**)
3. `POST /api/pharmacy/medicines/4/dispense` - Attempt dispensing expired drug (Tests **Rule 12 HTTP 400**)
4. `POST /api/inpatient/admissions` - Admit to occupied bed (Tests **Rule 7 HTTP 409 Conflict**)
5. `POST /api/inpatient/admissions/1/discharge` - Test discharge billing clearance (**Rule 10**)

---

## 📁 Repository Structure

```
├── backend-springboot/
│   ├── src/main/java/com/hospital/management/
│   │   ├── config/          # SecurityConfig, JpaAuditingConfig
│   │   ├── controller/      # REST Controllers (Auth, Appointment, Patient, etc.)
│   │   ├── dto/             # Request & Response Data Transfer Objects
│   │   ├── entity/          # JPA Entities (User, Patient, Doctor, Appointment, Bed, etc.)
│   │   ├── exception/       # ConflictException, BusinessRuleException, GlobalExceptionHandler
│   │   ├── repository/      # Spring Data JPA Repositories
│   │   ├── security/        # JwtTokenProvider, JwtAuthenticationFilter, UserDetailsService
│   │   └── service/         # Interfaces and Implementation Layer (@Transactional)
│   ├── src/main/resources/
│   │   ├── application.properties # Environment-driven properties
│   │   ├── schema.sql       # MySQL 8.0 DDL Schema (20 tables)
│   │   └── data.sql         # Seed data & BCrypt demo passwords
│   ├── Dockerfile           # Multi-stage Maven + Alpine JRE Docker build
│   ├── pom.xml              # Spring Boot 3.2.3, Lombok, JWT, Validation
│   └── postman_collection.json
├── docker-compose.yml       # Production-ready Compose orchestration
├── src/                     # React Frontend (JavaScript & JSX only)
│   ├── api/                 # Axios client with interceptors
│   ├── context/             # AuthContext (Role Switching & JWT state)
│   ├── components/
│   │   ├── common/          # RuleBadge, StatCard
│   │   ├── layout/          # Navbar (RBAC persona switcher), Sidebar
│   │   └── modules/         # Dashboard, Appointments, Patients, Pharmacy, Inpatient, Billing, Hub
│   ├── services/            # mockDataService (In-browser reactive rule engine)
│   ├── App.jsx              # React Router structure
│   ├── main.jsx             # React entry point
│   └── index.css            # Bootstrap 5 & styling
└── package.json
```
