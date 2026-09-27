-- ====================================================================
-- SEED DATA FOR HOSPITAL MANAGEMENT SYSTEM
-- Default Passwords for all demo accounts: 'Password@123'
-- BCrypt Hash: $2a$10$eACCYoNOHEqgkDwBv5xBwOHWy7ybUzadSE7PxVI3.qKQfuAAxUXWi
-- ====================================================================

-- 1. ROLES
INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'ADMIN', 'Hospital System Administrator with full access'),
(2, 'DOCTOR', 'Licensed Medical Practitioner / Consultant'),
(3, 'RECEPTIONIST', 'Front Desk & Patient Registration Staff'),
(4, 'NURSE', 'Inpatient Ward & Clinical Care Staff'),
(5, 'PATIENT', 'Registered Hospital Patient / Client'),
(6, 'PHARMACIST', 'Dispensary and Inventory Chemist'),
(7, 'LAB_TECHNICIAN', 'Diagnostic Laboratory Medical Technologist');

-- 2. DEPARTMENTS
INSERT IGNORE INTO departments (id, name, code, description, floor) VALUES
(1, 'Cardiology', 'CARD', 'Heart, cardiovascular health, and coronary intensive care', 'Floor 3, Wing A'),
(2, 'Neurology', 'NEUR', 'Brain, spinal cord, and nervous system disorders', 'Floor 4, Wing B'),
(3, 'Orthopedics', 'ORTH', 'Musculoskeletal system, bone fractures, and joint replacement', 'Floor 2, Wing C'),
(4, 'Pediatrics', 'PEDI', 'Infant, child, and adolescent medical care', 'Floor 1, Wing A'),
(5, 'General Medicine', 'GENM', 'Primary comprehensive medical examinations and internal healthcare', 'Ground Floor, Wing B'),
(6, 'Emergency Medicine', 'EMER', '24/7 Level 1 Trauma, triage, and critical emergency response', 'Ground Floor, Wing A');

-- 3. DEMO USERS
INSERT IGNORE INTO users (id, role_id, username, password_hash, email, full_name, role, status) VALUES
(1, 1, 'admin', '$2a$10$eACCYoNOHEqgkDwBv5xBwOHWy7ybUzadSE7PxVI3.qKQfuAAxUXWi', 'admin@hospital.com', 'Dr. Arthur Vance (Chief Admin)', 'ADMIN', 'ACTIVE'),
(2, 2, 'doctor_cardio', '$2a$10$eACCYoNOHEqgkDwBv5xBwOHWy7ybUzadSE7PxVI3.qKQfuAAxUXWi', 'cardio@hospital.com', 'Dr. Eleanor Sterling', 'DOCTOR', 'ACTIVE'),
(3, 2, 'doctor_neuro', '$2a$10$eACCYoNOHEqgkDwBv5xBwOHWy7ybUzadSE7PxVI3.qKQfuAAxUXWi', 'neuro@hospital.com', 'Dr. Marcus Holloway', 'DOCTOR', 'ACTIVE'),
(4, 3, 'receptionist', '$2a$10$eACCYoNOHEqgkDwBv5xBwOHWy7ybUzadSE7PxVI3.qKQfuAAxUXWi', 'reception@hospital.com', 'Sarah Jenkins', 'RECEPTIONIST', 'ACTIVE'),
(5, 4, 'nurse', '$2a$10$eACCYoNOHEqgkDwBv5xBwOHWy7ybUzadSE7PxVI3.qKQfuAAxUXWi', 'nurse@hospital.com', 'Nurse Clara Oswald', 'NURSE', 'ACTIVE'),
(6, 6, 'pharmacist', '$2a$10$eACCYoNOHEqgkDwBv5xBwOHWy7ybUzadSE7PxVI3.qKQfuAAxUXWi', 'pharma@hospital.com', 'David Miller, RPh', 'PHARMACIST', 'ACTIVE'),
(7, 7, 'labtech', '$2a$10$eACCYoNOHEqgkDwBv5xBwOHWy7ybUzadSE7PxVI3.qKQfuAAxUXWi', 'lab@hospital.com', 'Rachel Zane, MLS', 'LAB_TECHNICIAN', 'ACTIVE'),
(8, 5, 'patient_john', '$2a$10$eACCYoNOHEqgkDwBv5xBwOHWy7ybUzadSE7PxVI3.qKQfuAAxUXWi', 'john.doe@gmail.com', 'Johnathan Doe', 'PATIENT', 'ACTIVE');

-- 4. DOCTORS
INSERT IGNORE INTO doctors (id, user_id, department_id, doctor_code, name, email, phone, specialization, qualification, experience_years, consultation_fee, available_days, start_time, end_time, room_number, status) VALUES
(1, 2, 1, 'DOC-CARD-01', 'Dr. Eleanor Sterling', 'cardio@hospital.com', '+1-555-0101', 'Interventional Cardiology', 'MD, FACC, Harvard Medical', 14, 150.00, 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY', '09:00:00', '16:00:00', 'OPD-302', 'ACTIVE'),
(2, 3, 2, 'DOC-NEUR-01', 'Dr. Marcus Holloway', 'neuro@hospital.com', '+1-555-0102', 'Neurology & Stroke Care', 'MD, PhD, Johns Hopkins', 11, 175.00, 'MONDAY,WEDNESDAY,FRIDAY', '10:00:00', '17:00:00', 'OPD-405', 'ACTIVE');

-- 5. PATIENTS
INSERT IGNORE INTO patients (id, user_id, patient_code, name, dob, gender, blood_group, phone, email, address, emergency_contact_name, emergency_contact_phone, medical_history, allergies) VALUES
(1, 8, 'PT-0001', 'Johnathan Doe', '1985-06-14', 'MALE', 'O+', '+1-555-0201', 'john.doe@gmail.com', '742 Evergreen Terrace, Springfield', 'Mary Doe (Spouse)', '+1-555-0202', 'Mild hypertension diagnosed 2021', 'Penicillin, Sulfa drugs'),
(2, NULL, 'PT-0002', 'Elena Rostova', '1992-11-03', 'FEMALE', 'A+', '+1-555-0203', 'elena.rostova@gmail.com', '128 Pinecrest Blvd, Metro City', 'Sergei Rostov (Father)', '+1-555-0204', 'Seasonal asthma', 'Dust, Latex');

-- 6. STAFF
INSERT IGNORE INTO staff (id, user_id, department_id, role_id, employee_code, full_name, role, position, contact_number, email, joining_date, shift, status) VALUES
(1, 4, 5, 3, 'STF-REC-01', 'Sarah Jenkins', 'RECEPTIONIST', 'Chief Receptionist', '+1-555-0301', 'reception@hospital.com', '2023-01-15', 'MORNING', 'ACTIVE'),
(2, 5, 1, 4, 'STF-NUR-01', 'Nurse Clara Oswald', 'NURSE', 'Head ICU Nurse', '+1-555-0302', 'nurse@hospital.com', '2022-05-10', 'ROTATIONAL', 'ACTIVE'),
(3, 6, 5, 6, 'STF-PHR-01', 'David Miller, RPh', 'PHARMACIST', 'Senior Dispensary Pharmacist', '+1-555-0303', 'pharma@hospital.com', '2021-09-01', 'MORNING', 'ACTIVE'),
(4, 7, 5, 7, 'STF-LAB-01', 'Rachel Zane, MLS', 'LAB_TECHNICIAN', 'Chief Medical Laboratory Scientist', '+1-555-0304', 'lab@hospital.com', '2022-03-20', 'MORNING', 'ACTIVE');

-- 7. ROOMS & BEDS
INSERT IGNORE INTO rooms (id, department_id, room_number, room_type, floor, daily_rate, total_beds, status) VALUES
(1, 1, 'ICU-101', 'ICU', 'Floor 3', 850.00, 2, 'ACTIVE'),
(2, 5, 'WARD-201', 'GENERAL_WARD', 'Ground Floor', 120.00, 2, 'ACTIVE'),
(3, 1, 'PRIV-301', 'DELUXE_PRIVATE', 'Floor 3', 350.00, 1, 'ACTIVE');

INSERT IGNORE INTO beds (id, room_id, bed_number, status, current_patient_id) VALUES
(1, 1, 'ICU-101-A', 'AVAILABLE', NULL),
(2, 1, 'ICU-101-B', 'AVAILABLE', NULL),
(3, 2, 'WARD-201-1', 'AVAILABLE', NULL),
(4, 2, 'WARD-201-2', 'AVAILABLE', NULL),
(5, 3, 'PRIV-301-A', 'AVAILABLE', NULL);

-- 8. MEDICINES
INSERT IGNORE INTO medicines (id, medicine_code, name, generic_name, category, batch_number, stock_quantity, min_stock_alert, unit_price, expiry_date, manufacturer, status) VALUES
(1, 'MED-AMX-500', 'Amoxicillin 500mg', 'Amoxicillin Trihydrate', 'ANTIBIOTIC', 'AMX-2024-88', 140, 30, 12.50, '2027-12-31', 'Pfizer Healthcare', 'AVAILABLE'),
(2, 'MED-ATV-20', 'Atorvastatin 20mg', 'Atorvastatin Calcium', 'CARDIOVASCULAR', 'ATV-2024-12', 85, 20, 24.00, '2028-05-15', 'Novartis Pharma', 'AVAILABLE'),
(3, 'MED-MET-850', 'Metformin 850mg', 'Metformin HCl', 'ANTIDIABETIC', 'MET-2023-99', 8, 15, 9.20, '2027-08-30', 'Sun Pharma', 'LOW_STOCK'),
(4, 'MED-CFT-1G', 'Ceftriaxone 1g Inj', 'Ceftriaxone Sodium', 'ANTIBIOTIC', 'CFT-2022-04', 45, 10, 35.00, '2024-01-10', 'Roche Labs', 'EXPIRED');

-- 9. APPOINTMENTS
INSERT IGNORE INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, reason, status, notes) VALUES
(1, 1, 1, '2026-10-01', '09:30:00', 'Routine cardiology consultation and blood pressure follow-up', 'CONFIRMED', 'Patient reported mild palpitations last week'),
(2, 2, 2, '2026-10-01', '10:30:00', 'Persistent migraine headaches and visual aura', 'CONFIRMED', 'First time visit to Neurology clinic');
