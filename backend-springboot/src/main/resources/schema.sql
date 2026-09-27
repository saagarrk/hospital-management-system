-- ====================================================================
-- HOSPITAL MANAGEMENT SYSTEM - ENTERPRISE MYSQL DATABASE SCHEMA (DDL)
-- Compliant with Software Requirements Specification (SRS) v1.0
-- Database Engine: MySQL 8.0+ / InnoDB / utf8mb4
-- Normalized (3NF) Architecture with Referential Integrity & Audit Trails
-- ====================================================================

DROP DATABASE IF EXISTS hospital_management_db;
CREATE DATABASE hospital_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_management_db;

-- --------------------------------------------------------------------
-- 1. ROLES TABLE (Normalized RBAC Roles)
-- --------------------------------------------------------------------
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_name UNIQUE (name)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 2. USERS TABLE (System Authentication & User Accounts)
-- --------------------------------------------------------------------
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- Cached role string for high-throughput JWT validation
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_username UNIQUE (username),
    CONSTRAINT uq_user_email UNIQUE (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_user_role_id (role_id),
    INDEX idx_user_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 3. DEPARTMENTS TABLE (Clinical & Administrative Divisions)
-- --------------------------------------------------------------------
CREATE TABLE departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    floor VARCHAR(50) NOT NULL,
    head_doctor_name VARCHAR(100),
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_dept_code UNIQUE (code),
    CONSTRAINT uq_dept_name UNIQUE (name),
    INDEX idx_dept_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 4. DOCTORS TABLE (Physicians & Specialists)
-- --------------------------------------------------------------------
CREATE TABLE doctors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    department_id BIGINT NOT NULL,
    doctor_code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    qualification VARCHAR(150) NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    available_days VARCHAR(100) NOT NULL DEFAULT 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY',
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '17:00:00',
    room_number VARCHAR(20) NOT NULL,
    status ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_doctor_code UNIQUE (doctor_code),
    CONSTRAINT uq_doctor_email UNIQUE (email),
    CONSTRAINT uq_doctor_user UNIQUE (user_id),
    CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_doctors_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    INDEX idx_doctor_department (department_id),
    INDEX idx_doctor_specialization (specialization),
    INDEX idx_doctor_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 5. PATIENTS TABLE (Demographics, Medical Background & Emergencies)
-- --------------------------------------------------------------------
CREATE TABLE patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    patient_code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    marital_status ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER') NOT NULL DEFAULT 'SINGLE',
    occupation VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    emergency_contact_name VARCHAR(100) NOT NULL,
    emergency_contact_phone VARCHAR(20) NOT NULL,
    emergency_contact_relation VARCHAR(50),
    medical_history TEXT,
    allergies TEXT,
    status ENUM('ACTIVE', 'INACTIVE', 'DECEASED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_patient_code UNIQUE (patient_code),
    CONSTRAINT uq_patient_user UNIQUE (user_id),
    CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patient_phone (phone),
    INDEX idx_patient_name (name),
    INDEX idx_patient_email (email),
    INDEX idx_patient_status (status),
    INDEX idx_patient_blood_group (blood_group)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 6. STAFF TABLE (Nursing, Reception, Administrative & Allied Staff)
-- --------------------------------------------------------------------
CREATE TABLE staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    department_id BIGINT,
    role_id BIGINT NOT NULL,
    employee_code VARCHAR(20) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'PATIENT', 'PHARMACIST', 'LAB_TECHNICIAN') NOT NULL,
    position VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    joining_date DATE NOT NULL,
    shift ENUM('MORNING', 'EVENING', 'NIGHT', 'ROTATIONAL') NOT NULL DEFAULT 'MORNING',
    salary DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_staff_employee_code UNIQUE (employee_code),
    CONSTRAINT uq_staff_email UNIQUE (email),
    CONSTRAINT uq_staff_user UNIQUE (user_id),
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_staff_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_staff_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_staff_dept (department_id),
    INDEX idx_staff_role (role)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 7. ROOMS TABLE (Wards, ICU, Operating Theaters & Deluxe Suites)
-- --------------------------------------------------------------------
CREATE TABLE rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id BIGINT,
    room_number VARCHAR(20) NOT NULL,
    room_type ENUM('ICU', 'GENERAL_WARD', 'DELUXE_PRIVATE', 'SEMI_PRIVATE', 'EMERGENCY') NOT NULL,
    floor VARCHAR(50) NOT NULL,
    daily_rate DECIMAL(10,2) NOT NULL,
    total_beds INT NOT NULL DEFAULT 1,
    status ENUM('ACTIVE', 'CLEANING', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_room_number UNIQUE (room_number),
    CONSTRAINT fk_rooms_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_room_type (room_type),
    INDEX idx_room_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 8. BEDS TABLE (Physical Bed Tracking & Patient Assignment)
-- Enforces Requirement 10: Occupied bed cannot be assigned to another patient
-- --------------------------------------------------------------------
CREATE TABLE beds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    bed_number VARCHAR(30) NOT NULL,
    status ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    current_patient_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_bed_number UNIQUE (bed_number),
    CONSTRAINT uq_bed_patient UNIQUE (current_patient_id), -- Ensures a patient occupies at most one bed at a time
    CONSTRAINT fk_beds_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_beds_patient FOREIGN KEY (current_patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    INDEX idx_bed_status (status),
    INDEX idx_bed_room_id (room_id)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 9. APPOINTMENTS TABLE (Consultation Bookings)
-- Enforces Requirement 9: Doctor-slot conflict prevention via unique index
-- --------------------------------------------------------------------
CREATE TABLE appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED') NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Enforces SRS Rule 1: No two appointments for same doctor at same date & time
    CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appointment_date, appointment_time),
    CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    INDEX idx_appt_doctor_date (doctor_id, appointment_date),
    INDEX idx_appt_patient_date (patient_id, appointment_date),
    INDEX idx_appt_status (status),
    INDEX idx_appt_date (appointment_date)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 10. ADMISSIONS TABLE (Inpatient Hospitalization Records)
-- Enforces SRS Rule 7 & 8: Active hospitalization tracking
-- --------------------------------------------------------------------
CREATE TABLE admissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admission_number VARCHAR(30) NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    bed_id BIGINT NOT NULL,
    admission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharge_date TIMESTAMP NULL,
    reason TEXT NOT NULL,
    status ENUM('ADMITTED', 'DISCHARGED', 'TRANSFERRED') NOT NULL DEFAULT 'ADMITTED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_admission_number UNIQUE (admission_number),
    CONSTRAINT fk_admissions_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_admissions_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    CONSTRAINT fk_admissions_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    CONSTRAINT fk_admissions_bed FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE RESTRICT,
    INDEX idx_admission_status (status),
    INDEX idx_admission_patient (patient_id),
    INDEX idx_admission_bed (bed_id),
    INDEX idx_admission_date (admission_date)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 11. MEDICAL RECORDS TABLE (Clinical Consultation Summaries)
-- Enforces SRS Rule 3 & 9: Attending physician notes and patient access
-- --------------------------------------------------------------------
CREATE TABLE medical_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    visit_date DATE NOT NULL,
    symptoms TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    physical_examination TEXT,
    treatment_plan TEXT NOT NULL,
    lab_tests_recommended TEXT,
    clinical_notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_medical_record_appointment UNIQUE (appointment_id),
    CONSTRAINT fk_med_records_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_med_records_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    CONSTRAINT fk_med_records_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX idx_med_record_patient (patient_id),
    INDEX idx_med_record_doctor (doctor_id),
    INDEX idx_med_record_visit (visit_date)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 12. MEDICINES TABLE (Pharmaceutical Formulary & Inventory)
-- Enforces SRS Rule 10: Tracking expiry date & stock safety threshold
-- --------------------------------------------------------------------
CREATE TABLE medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NOT NULL,
    category ENUM('ANTIBIOTIC', 'ANALGESIC', 'ANTIVIRAL', 'ANTIHYPERTENSIVE', 'ANTIDIABETIC', 'ANTIHISTAMINE', 'CARDIOVASCULAR', 'SEDATIVE', 'OTHER') NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 20,
    unit_price DECIMAL(10,2) NOT NULL,
    expiry_date DATE NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    status ENUM('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED') NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_medicine_code UNIQUE (medicine_code),
    CONSTRAINT uq_medicine_batch UNIQUE (batch_number),
    INDEX idx_medicine_expiry (expiry_date),
    INDEX idx_medicine_stock (stock_quantity),
    INDEX idx_medicine_status (status),
    INDEX idx_medicine_name (name)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 13. PRESCRIPTIONS TABLE (Prescription Header)
-- Enforces Requirement 12: Header + Details structure
-- --------------------------------------------------------------------
CREATE TABLE prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_number VARCHAR(30) NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    medical_record_id BIGINT,
    appointment_id BIGINT,
    prescription_date DATE NOT NULL,
    general_instructions TEXT,
    status ENUM('ISSUED', 'DISPENSED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ISSUED',
    dispensed_at TIMESTAMP NULL,
    dispensed_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_prescription_number UNIQUE (prescription_number),
    CONSTRAINT fk_prescriptions_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    CONSTRAINT fk_prescriptions_med_rec FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE SET NULL,
    CONSTRAINT fk_prescriptions_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    CONSTRAINT fk_prescriptions_dispenser FOREIGN KEY (dispensed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_prescription_patient (patient_id),
    INDEX idx_prescription_doctor (doctor_id),
    INDEX idx_prescription_date (prescription_date),
    INDEX idx_prescription_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 14. PRESCRIPTION ITEMS TABLE (Prescription Lines)
-- --------------------------------------------------------------------
CREATE TABLE prescription_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    instructions VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_prescription_medicine UNIQUE (prescription_id, medicine_id),
    CONSTRAINT fk_presc_items_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_presc_items_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
    INDEX idx_presc_items_medicine (medicine_id)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 15. LAB TESTS TABLE (Laboratory Order & Workflow Requisition)
-- Enforces Requirement 13: Laboratory workflow from test order
-- --------------------------------------------------------------------
CREATE TABLE lab_tests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_order_number VARCHAR(30) NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    admission_id BIGINT,
    technician_id BIGINT,
    test_name VARCHAR(150) NOT NULL,
    test_code VARCHAR(50) NOT NULL,
    category ENUM('BIOCHEMISTRY', 'HEMATOLOGY', 'MICROBIOLOGY', 'RADIOLOGY', 'PATHOLOGY', 'CARDIOLOGY', 'URINALYSIS') NOT NULL,
    priority ENUM('ROUTINE', 'URGENT', 'STAT') NOT NULL DEFAULT 'ROUTINE',
    status ENUM('ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ORDERED',
    clinical_notes TEXT,
    ordered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sample_collected_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_lab_test_order UNIQUE (test_order_number),
    CONSTRAINT fk_lab_tests_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lab_tests_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lab_tests_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    CONSTRAINT fk_lab_tests_admission FOREIGN KEY (admission_id) REFERENCES admissions(id) ON DELETE SET NULL,
    CONSTRAINT fk_lab_tests_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_lab_test_status (status),
    INDEX idx_lab_test_patient (patient_id),
    INDEX idx_lab_test_category (category),
    INDEX idx_lab_test_ordered_at (ordered_at)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 16. LAB REPORTS TABLE (Diagnostic Results & Pathologist Sign-off)
-- Enforces Requirement 13: Lab workflow completion to report
-- --------------------------------------------------------------------
CREATE TABLE lab_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_number VARCHAR(30) NOT NULL,
    lab_test_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    technician_id BIGINT NOT NULL,
    verified_by_doctor_id BIGINT,
    result_summary TEXT NOT NULL,
    findings JSON, -- Structured test parameters and qualitative values
    normal_range VARCHAR(100),
    units VARCHAR(50),
    interpretation ENUM('NORMAL', 'ABNORMAL', 'CRITICAL') NOT NULL DEFAULT 'NORMAL',
    status ENUM('DRAFT', 'PRELIMINARY', 'FINAL', 'AMENDED') NOT NULL DEFAULT 'FINAL',
    remarks TEXT,
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_lab_report_number UNIQUE (report_number),
    CONSTRAINT uq_lab_report_test UNIQUE (lab_test_id), -- Strict 1:1 relationship between order and final report
    CONSTRAINT fk_lab_reports_test FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lab_reports_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lab_reports_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lab_reports_verifier FOREIGN KEY (verified_by_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
    INDEX idx_lab_report_patient (patient_id),
    INDEX idx_lab_report_interpretation (interpretation),
    INDEX idx_lab_report_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 17. BILLS TABLE (Financial Invoices Header)
-- Enforces Requirement 11: One bill can contain multiple bill items
-- --------------------------------------------------------------------
CREATE TABLE bills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(50) NOT NULL,
    patient_id BIGINT NOT NULL,
    admission_id BIGINT,
    appointment_id BIGINT,
    bill_type ENUM('OPD', 'IPD', 'PHARMACY', 'LABORATORY', 'EMERGENCY') NOT NULL DEFAULT 'OPD',
    bill_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_bill_number UNIQUE (bill_number),
    CONSTRAINT fk_bills_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bills_admission FOREIGN KEY (admission_id) REFERENCES admissions(id) ON DELETE SET NULL,
    CONSTRAINT fk_bills_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX idx_bill_status (payment_status),
    INDEX idx_bill_patient (patient_id),
    INDEX idx_bill_admission (admission_id),
    INDEX idx_bill_date (bill_date)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 18. BILL ITEMS TABLE (Line Items for Hospital Services)
-- Enforces Requirement 11: Multi-item billing breakdown
-- --------------------------------------------------------------------
CREATE TABLE bill_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    item_type ENUM('CONSULTATION', 'ROOM_RENT', 'LAB_TEST', 'MEDICINE', 'PROCEDURE', 'NURSING', 'OTHER') NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bill_items_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    INDEX idx_bill_items_bill_id (bill_id),
    INDEX idx_bill_items_type (item_type)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 19. PAYMENTS TABLE (Financial Transactions & Settlement Records)
-- --------------------------------------------------------------------
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'ONLINE_BANKING', 'INSURANCE') NOT NULL,
    transaction_reference VARCHAR(100) NOT NULL,
    status ENUM('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED') NOT NULL DEFAULT 'SUCCESS',
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payment_reference UNIQUE (transaction_reference),
    CONSTRAINT fk_payments_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    INDEX idx_payment_bill (bill_id),
    INDEX idx_payment_patient (patient_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_payment_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 20. DISCHARGES TABLE (Patient Discharge Summaries & Clearance)
-- Enforces SRS Rule 12: Clearance of bills prior to patient release
-- --------------------------------------------------------------------
CREATE TABLE discharges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admission_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    discharge_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    diagnosis_summary TEXT NOT NULL,
    treatment_summary TEXT NOT NULL,
    discharge_advice TEXT,
    follow_up_instructions TEXT,
    final_bill_id BIGINT,
    is_bill_settled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_discharge_admission UNIQUE (admission_id), -- Strict 1:1 with inpatient admission
    CONSTRAINT fk_discharges_admission FOREIGN KEY (admission_id) REFERENCES admissions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_discharges_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_discharges_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    CONSTRAINT fk_discharges_bill FOREIGN KEY (final_bill_id) REFERENCES bills(id) ON DELETE SET NULL,
    INDEX idx_discharge_patient (patient_id),
    INDEX idx_discharge_doctor (doctor_id),
    INDEX idx_discharge_date (discharge_date)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 21. NOTIFICATIONS TABLE (User Alerts, Broadcasts & Reminders)
-- --------------------------------------------------------------------
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('APPOINTMENT', 'LAB_RESULT', 'PHARMACY_STOCK', 'BILLING_DUE', 'ADMISSION', 'SYSTEM_ALERT') NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_read (user_id, is_read),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB;
