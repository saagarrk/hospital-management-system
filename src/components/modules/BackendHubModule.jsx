import React, { useState } from 'react';
import { Server, Database, Shield, Terminal, FileCode, CheckCircle2, Copy, Table, Key, Link2, Search, AlertCircle, ArrowRight, Lock, Users, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import { SecurityHubTab } from './SecurityHubTab';
import { PatientHubTab } from './PatientHubTab';
import { AppointmentHubTab } from './AppointmentHubTab';

export const BackendHubModule = () => {
  const [activeTab, setActiveTab] = useState('schema');
  const [schemaSubTab, setSchemaSubTab] = useState('tables');
  const [tableSearch, setTableSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState('appointments');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Copied ${label} to clipboard!`,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const schemaTables = [
    {
      name: 'roles',
      category: 'Auth & RBAC',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'RoleEntity.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'name', type: 'VARCHAR(50)', key: 'UQ', nullable: 'NO', desc: 'Role name (ADMIN, DOCTOR, NURSE, etc.)' },
        { name: 'description', type: 'VARCHAR(255)', key: '', nullable: 'YES', desc: 'Role scope and permissions' },
        { name: 'created_at', type: 'TIMESTAMP', key: '', nullable: 'NO', desc: 'Audit creation timestamp' },
        { name: 'updated_at', type: 'TIMESTAMP', key: '', nullable: 'NO', desc: 'Audit update timestamp' },
      ],
      relations: [
        { type: '1:N', target: 'users', note: 'One role belongs to many system users' },
        { type: '1:N', target: 'staff', note: 'One role assigned to multiple staff records' },
      ],
      indexes: ['uq_role_name (name)'],
      rules: 'Normalized role definitions preventing hardcoded privileges.',
    },
    {
      name: 'users',
      category: 'Auth & RBAC',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'User.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'role_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References roles(id)' },
        { name: 'username', type: 'VARCHAR(50)', key: 'UQ', nullable: 'NO', desc: 'Unique login handle' },
        { name: 'password_hash', type: 'VARCHAR(255)', key: '', nullable: 'NO', desc: 'BCrypt salted hash' },
        { name: 'email', type: 'VARCHAR(100)', key: 'UQ', nullable: 'NO', desc: 'Unique contact email' },
        { name: 'full_name', type: 'VARCHAR(100)', key: '', nullable: 'NO', desc: 'Legal full name' },
        { name: 'phone', type: 'VARCHAR(20)', key: '', nullable: 'YES', desc: 'Contact telephone' },
        { name: 'role', type: 'VARCHAR(50)', key: '', nullable: 'NO', desc: 'Fast JWT authority cache' },
        { name: 'status', type: 'ENUM(ACTIVE, INACTIVE, SUSPENDED)', key: 'IDX', nullable: 'NO', desc: 'Account lifecycle state' },
        { name: 'created_at', type: 'TIMESTAMP', key: '', nullable: 'NO', desc: 'Account registration date' },
        { name: 'updated_at', type: 'TIMESTAMP', key: '', nullable: 'NO', desc: 'Last modified date' },
      ],
      relations: [
        { type: 'N:1', target: 'roles', note: 'Users belong to one primary role' },
        { type: '1:1', target: 'doctors', note: 'Optional 1:1 physician profile linkage' },
        { type: '1:1', target: 'patients', note: 'Optional 1:1 patient portal linkage' },
        { type: '1:1', target: 'staff', note: 'Optional 1:1 staff profile linkage' },
        { type: '1:N', target: 'notifications', note: 'Users receive alerts & broadcasts' },
      ],
      indexes: ['uq_user_username (username)', 'uq_user_email (email)', 'idx_user_role_id (role_id)', 'idx_user_status (status)'],
      rules: 'Stateless JWT authentication foundation. Passwords hashed with BCrypt (strength 10).',
    },
    {
      name: 'departments',
      category: 'Clinical Core',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Department.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'name', type: 'VARCHAR(100)', key: 'UQ', nullable: 'NO', desc: 'Department title (e.g. Cardiology)' },
        { name: 'code', type: 'VARCHAR(20)', key: 'UQ', nullable: 'NO', desc: 'Short alphanumeric code (e.g. CARD)' },
        { name: 'description', type: 'TEXT', key: '', nullable: 'YES', desc: 'Clinical scope' },
        { name: 'floor', type: 'VARCHAR(50)', key: '', nullable: 'NO', desc: 'Hospital location/wing' },
        { name: 'head_doctor_name', type: 'VARCHAR(100)', key: '', nullable: 'YES', desc: 'Department Head' },
        { name: 'status', type: 'ENUM(ACTIVE, INACTIVE)', key: 'IDX', nullable: 'NO', desc: 'Operational state' },
      ],
      relations: [
        { type: '1:N', target: 'doctors', note: 'Clinical specialists belong to department' },
        { type: '1:N', target: 'rooms', note: 'Wards and ICU units allocated per department' },
        { type: '1:N', target: 'staff', note: 'Nurses and support staff assigned to department' },
      ],
      indexes: ['uq_dept_code (code)', 'uq_dept_name (name)', 'idx_dept_status (status)'],
      rules: 'Hospital clinical zoning and operational routing.',
    },
    {
      name: 'doctors',
      category: 'Clinical Core',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Doctor.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'user_id', type: 'BIGINT', key: 'UQ/FK', nullable: 'YES', desc: 'References users(id)' },
        { name: 'department_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References departments(id)' },
        { name: 'doctor_code', type: 'VARCHAR(20)', key: 'UQ', nullable: 'NO', desc: 'Unique doctor badge ID' },
        { name: 'name', type: 'VARCHAR(100)', key: '', nullable: 'NO', desc: 'Physician legal name' },
        { name: 'email', type: 'VARCHAR(100)', key: 'UQ', nullable: 'NO', desc: 'Professional email' },
        { name: 'phone', type: 'VARCHAR(20)', key: '', nullable: 'NO', desc: 'Direct contact number' },
        { name: 'specialization', type: 'VARCHAR(150)', key: 'IDX', nullable: 'NO', desc: 'Clinical specialty' },
        { name: 'qualification', type: 'VARCHAR(150)', key: '', nullable: 'NO', desc: 'Degrees & board certifications' },
        { name: 'experience_years', type: 'INT', key: '', nullable: 'NO', desc: 'Years in active practice' },
        { name: 'consultation_fee', type: 'DECIMAL(10,2)', key: '', nullable: 'NO', desc: 'Standard OPD consultation fee' },
        { name: 'available_days', type: 'VARCHAR(100)', key: '', nullable: 'NO', desc: 'Weekly schedule string' },
        { name: 'start_time', type: 'TIME', key: '', nullable: 'NO', desc: 'Daily clinic opening' },
        { name: 'end_time', type: 'TIME', key: '', nullable: 'NO', desc: 'Daily clinic closing' },
        { name: 'room_number', type: 'VARCHAR(20)', key: '', nullable: 'NO', desc: 'OPD consulting room' },
        { name: 'status', type: 'ENUM(ACTIVE, ON_LEAVE, INACTIVE)', key: 'IDX', nullable: 'NO', desc: 'Clinical availability' },
      ],
      relations: [
        { type: '1:1', target: 'users', note: 'Maps to user account for login' },
        { type: 'N:1', target: 'departments', note: 'Specialist is stationed in department' },
        { type: '1:N', target: 'appointments', note: 'Scheduled consultations' },
        { type: '1:N', target: 'admissions', note: 'Primary attending physician for inpatients' },
        { type: '1:N', target: 'prescriptions', note: 'Prescriptive authority' },
      ],
      indexes: ['uq_doctor_code (doctor_code)', 'uq_doctor_email (email)', 'uq_doctor_user (user_id)', 'idx_doctor_department (department_id)', 'idx_doctor_specialization (specialization)'],
      rules: 'SRS Rule 2: Appointments are strictly booked within doctor active working days & hours.',
    },
    {
      name: 'patients',
      category: 'Clinical Core',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Patient.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'user_id', type: 'BIGINT', key: 'UQ/FK', nullable: 'YES', desc: 'References users(id)' },
        { name: 'patient_code', type: 'VARCHAR(30)', key: 'UQ', nullable: 'NO', desc: 'Unique Medical Record Number (MRN)' },
        { name: 'name', type: 'VARCHAR(100)', key: 'IDX', nullable: 'NO', desc: 'Patient full name' },
        { name: 'dob', type: 'DATE', key: '', nullable: 'NO', desc: 'Date of birth' },
        { name: 'gender', type: 'ENUM(MALE, FEMALE, OTHER)', key: '', nullable: 'NO', desc: 'Biological gender' },
        { name: 'blood_group', type: 'ENUM(A+, A-, B+, B-, AB+, AB-, O+, O-)', key: 'IDX', nullable: 'NO', desc: 'Blood group' },
        { name: 'phone', type: 'VARCHAR(20)', key: 'IDX', nullable: 'NO', desc: 'Primary contact phone' },
        { name: 'emergency_contact_name', type: 'VARCHAR(100)', key: '', nullable: 'NO', desc: 'Next of kin' },
        { name: 'emergency_contact_phone', type: 'VARCHAR(20)', key: '', nullable: 'NO', desc: 'Next of kin phone' },
        { name: 'medical_history', type: 'TEXT', key: '', nullable: 'YES', desc: 'Chronic conditions' },
        { name: 'allergies', type: 'TEXT', key: '', nullable: 'YES', desc: 'Drug & environmental allergies' },
        { name: 'registered_date', type: 'DATE', key: '', nullable: 'NO', desc: 'First hospital admission/OPD date' },
      ],
      relations: [
        { type: '1:1', target: 'users', note: 'Linked to portal login' },
        { type: '1:N', target: 'appointments', note: 'Patient consultation bookings' },
        { type: '1:N', target: 'medical_records', note: 'Complete longitudinal electronic health record' },
        { type: '1:N', target: 'prescriptions', note: 'Medication regimens' },
        { type: '1:N', target: 'bills', note: 'Inpatient and OPD invoices' },
      ],
      indexes: ['uq_patient_code (patient_code)', 'uq_patient_user (user_id)', 'idx_patient_phone (phone)', 'idx_patient_name (name)', 'idx_patient_blood_group (blood_group)'],
      rules: 'SRS Rule 3: Patient privacy maintained; records accessible only by attending doctors.',
    },
    {
      name: 'staff',
      category: 'Hospital Admin',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Staff.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'user_id', type: 'BIGINT', key: 'UQ/FK', nullable: 'YES', desc: 'References users(id)' },
        { name: 'department_id', type: 'BIGINT', key: 'FK', nullable: 'YES', desc: 'References departments(id)' },
        { name: 'role_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References roles(id)' },
        { name: 'employee_code', type: 'VARCHAR(20)', key: 'UQ', nullable: 'NO', desc: 'Employee payroll badge' },
        { name: 'full_name', type: 'VARCHAR(100)', key: '', nullable: 'NO', desc: 'Staff full name' },
        { name: 'position', type: 'VARCHAR(100)', key: '', nullable: 'NO', desc: 'Job designation' },
        { name: 'shift', type: 'ENUM(MORNING, EVENING, NIGHT, ROTATIONAL)', key: '', nullable: 'NO', desc: 'Assigned duty roster' },
        { name: 'status', type: 'ENUM(ACTIVE, ON_LEAVE, INACTIVE)', key: '', nullable: 'NO', desc: 'Employment status' },
      ],
      relations: [
        { type: '1:1', target: 'users', note: 'Staff user authentication account' },
        { type: 'N:1', target: 'departments', note: 'Department assignment' },
        { type: 'N:1', target: 'roles', note: 'Role permission mapping' },
      ],
      indexes: ['uq_staff_employee_code (employee_code)', 'uq_staff_email (email)', 'uq_staff_user (user_id)', 'idx_staff_dept (department_id)'],
      rules: 'Roster and duty assignment for hospital operations.',
    },
    {
      name: 'appointments',
      category: 'Clinical Core',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Appointment.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'patient_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References patients(id)' },
        { name: 'doctor_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References doctors(id)' },
        { name: 'appointment_date', type: 'DATE', key: 'IDX', nullable: 'NO', desc: 'Scheduled calendar date' },
        { name: 'appointment_time', type: 'TIME', key: '', nullable: 'NO', desc: 'Scheduled start time' },
        { name: 'reason', type: 'TEXT', key: '', nullable: 'NO', desc: 'Chief complaint' },
        { name: 'status', type: 'ENUM(PENDING, CONFIRMED, COMPLETED, CANCELLED, RESCHEDULED)', key: 'IDX', nullable: 'NO', desc: 'Appointment state' },
        { name: 'notes', type: 'TEXT', key: '', nullable: 'YES', desc: 'Receptionist/Triage notes' },
      ],
      relations: [
        { type: 'N:1', target: 'patients', note: 'Patient booking consultation' },
        { type: 'N:1', target: 'doctors', note: 'Doctor attending consultation' },
        { type: '1:1', target: 'medical_records', note: 'Results in clinical medical record upon completion' },
      ],
      indexes: [
        'uq_doctor_slot (doctor_id, appointment_date, appointment_time) [CRITICAL CONFLICT PREVENTION]',
        'idx_appt_doctor_date (doctor_id, appointment_date)',
        'idx_appt_patient_date (patient_id, appointment_date)',
        'idx_appt_status (status)',
      ],
      rules: 'Requirement 9 & SRS Rule 1: No two appointments can be booked for the same doctor at the same date and time. Enforced via DB unique composite constraint.',
    },
    {
      name: 'rooms',
      category: 'Inpatient & Wards',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Room.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'department_id', type: 'BIGINT', key: 'FK', nullable: 'YES', desc: 'References departments(id)' },
        { name: 'room_number', type: 'VARCHAR(20)', key: 'UQ', nullable: 'NO', desc: 'Physical room label (e.g. ICU-101)' },
        { name: 'room_type', type: 'ENUM(ICU, GENERAL_WARD, DELUXE_PRIVATE, SEMI_PRIVATE, EMERGENCY)', key: 'IDX', nullable: 'NO', desc: 'Acuity tier' },
        { name: 'floor', type: 'VARCHAR(50)', key: '', nullable: 'NO', desc: 'Building floor' },
        { name: 'daily_rate', type: 'DECIMAL(10,2)', key: '', nullable: 'NO', desc: 'Per-day bed charge' },
        { name: 'total_beds', type: 'INT', key: '', nullable: 'NO', desc: 'Room bed capacity' },
        { name: 'status', type: 'ENUM(ACTIVE, CLEANING, MAINTENANCE, INACTIVE)', key: 'IDX', nullable: 'NO', desc: 'Room readiness' },
      ],
      relations: [
        { type: 'N:1', target: 'departments', note: 'Rooms physically located in department' },
        { type: '1:N', target: 'beds', note: 'One room houses multiple individual beds' },
      ],
      indexes: ['uq_room_number (room_number)', 'idx_room_type (room_type)', 'idx_room_status (status)'],
      rules: 'Inpatient ward hierarchy and daily rate calculation.',
    },
    {
      name: 'beds',
      category: 'Inpatient & Wards',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Bed.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'room_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References rooms(id)' },
        { name: 'bed_number', type: 'VARCHAR(30)', key: 'UQ', nullable: 'NO', desc: 'Unique bed code (e.g. ICU-101-A)' },
        { name: 'status', type: 'ENUM(AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE)', key: 'IDX', nullable: 'NO', desc: 'Occupancy state' },
        { name: 'current_patient_id', type: 'BIGINT', key: 'UQ/FK', nullable: 'YES', desc: 'References patients(id)' },
      ],
      relations: [
        { type: 'N:1', target: 'rooms', note: 'Beds physically contained in a room' },
        { type: '1:1', target: 'patients', note: 'Active inpatient occupying this bed' },
        { type: '1:N', target: 'admissions', note: 'Historical bed allocation log' },
      ],
      indexes: [
        'uq_bed_number (bed_number)',
        'uq_bed_patient (current_patient_id) [ENSURES PATIENT OCCUPIES ONLY ONE BED]',
        'idx_bed_status (status)',
        'idx_bed_room_id (room_id)',
      ],
      rules: 'Requirement 10 & SRS Rule 7: An occupied bed cannot be assigned to another patient. Patient can occupy at most 1 bed.',
    },
    {
      name: 'admissions',
      category: 'Inpatient & Wards',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Admission.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'admission_number', type: 'VARCHAR(30)', key: 'UQ', nullable: 'NO', desc: 'Inpatient admission token (ADM-XXXX)' },
        { name: 'patient_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References patients(id)' },
        { name: 'doctor_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References doctors(id)' },
        { name: 'room_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References rooms(id)' },
        { name: 'bed_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References beds(id)' },
        { name: 'admission_date', type: 'TIMESTAMP', key: 'IDX', nullable: 'NO', desc: 'Admission check-in time' },
        { name: 'discharge_date', type: 'TIMESTAMP', key: '', nullable: 'YES', desc: 'Discharge check-out time' },
        { name: 'reason', type: 'TEXT', key: '', nullable: 'NO', desc: 'Admission diagnosis/indication' },
        { name: 'status', type: 'ENUM(ADMITTED, DISCHARGED, TRANSFERRED)', key: 'IDX', nullable: 'NO', desc: 'Hospitalization state' },
      ],
      relations: [
        { type: 'N:1', target: 'patients', note: 'Admitted patient' },
        { type: 'N:1', target: 'doctors', note: 'Attending physician' },
        { type: 'N:1', target: 'beds', note: 'Occupied bed' },
        { type: '1:1', target: 'discharges', note: 'Discharge clinical clearance summary' },
      ],
      indexes: ['uq_admission_number (admission_number)', 'idx_admission_status (status)', 'idx_admission_patient (patient_id)', 'idx_admission_bed (bed_id)'],
      rules: 'SRS Rule 8: Bed status updates to OCCUPIED on admission and releases to AVAILABLE on discharge.',
    },
    {
      name: 'discharges',
      category: 'Inpatient & Wards',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'DischargeRecord.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'admission_id', type: 'BIGINT', key: 'UQ/FK', nullable: 'NO', desc: 'References admissions(id)' },
        { name: 'patient_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References patients(id)' },
        { name: 'doctor_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References doctors(id)' },
        { name: 'discharge_date', type: 'TIMESTAMP', key: 'IDX', nullable: 'NO', desc: 'Physician release timestamp' },
        { name: 'diagnosis_summary', type: 'TEXT', key: '', nullable: 'NO', desc: 'Final clinical diagnosis' },
        { name: 'treatment_summary', type: 'TEXT', key: '', nullable: 'NO', desc: 'Hospital treatment rendered' },
        { name: 'discharge_advice', type: 'TEXT', key: '', nullable: 'YES', desc: 'At-home care instructions' },
        { name: 'is_bill_settled', type: 'BOOLEAN', key: '', nullable: 'NO', desc: 'Financial clearance flag' },
        { name: 'final_bill_id', type: 'BIGINT', key: 'FK', nullable: 'YES', desc: 'References bills(id)' },
      ],
      relations: [
        { type: '1:1', target: 'admissions', note: 'Each admission has exactly one discharge summary' },
        { type: 'N:1', target: 'patients', note: 'Patient being discharged' },
        { type: 'N:1', target: 'doctors', note: 'Attending physician signing off' },
        { type: 'N:1', target: 'bills', note: 'Final settled invoice' },
      ],
      indexes: ['uq_discharge_admission (admission_id)', 'idx_discharge_patient (patient_id)', 'idx_discharge_doctor (doctor_id)'],
      rules: 'SRS Rule 10: Discharge requires full bill settlement or authorized payment exemption.',
    },
    {
      name: 'bed_transfer_histories',
      category: 'Inpatient & Wards',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'BedTransferHistory.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Transfer event ID' },
        { name: 'admission_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References admissions(id)' },
        { name: 'patient_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References patients(id)' },
        { name: 'from_bed_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'Released bed' },
        { name: 'to_bed_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'Newly occupied bed' },
        { name: 'transfer_reason', type: 'TEXT', key: '', nullable: 'YES', desc: 'Clinical indication for transfer' },
        { name: 'transferred_by', type: 'VARCHAR(100)', key: '', nullable: 'YES', desc: 'Authorizing staff name' },
        { name: 'transfer_date', type: 'TIMESTAMP', key: 'IDX', nullable: 'NO', desc: 'Audit timestamp' },
      ],
      relations: [
        { type: 'N:1', target: 'admissions', note: 'Inpatient admission undergoing transfer' },
        { type: 'N:1', target: 'patients', note: 'Transferred patient' },
        { type: 'N:1', target: 'beds', note: 'Source and target beds' },
      ],
      indexes: ['idx_transfer_admission (admission_id)', 'idx_transfer_patient (patient_id)', 'idx_transfer_date (transfer_date)'],
      rules: 'Rule 5 & 6: Transfer must release the old bed and occupy the new bed atomically under @Transactional.',
    },
    {
      name: 'medical_records',
      category: 'Clinical Core',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'MedicalRecord.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'patient_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References patients(id)' },
        { name: 'doctor_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References doctors(id)' },
        { name: 'appointment_id', type: 'BIGINT', key: 'UQ/FK', nullable: 'YES', desc: 'References appointments(id)' },
        { name: 'visit_date', type: 'DATE', key: 'IDX', nullable: 'NO', desc: 'Consultation date' },
        { name: 'symptoms', type: 'TEXT', key: '', nullable: 'NO', desc: 'Subjective complaints' },
        { name: 'diagnosis', type: 'TEXT', key: '', nullable: 'NO', desc: 'ICD clinical diagnosis' },
        { name: 'treatment_plan', type: 'TEXT', key: '', nullable: 'NO', desc: 'Therapeutic plan' },
        { name: 'clinical_notes', type: 'TEXT', key: '', nullable: 'YES', desc: 'Confidential clinical notes' },
        { name: 'follow_up_date', type: 'DATE', key: '', nullable: 'YES', desc: 'Recommended return date' },
      ],
      relations: [
        { type: 'N:1', target: 'patients', note: 'Patient electronic health chart' },
        { type: 'N:1', target: 'doctors', note: 'Consulting doctor' },
        { type: '1:1', target: 'appointments', note: 'Optional link to booked appointment' },
        { type: '1:N', target: 'prescriptions', note: 'Prescriptions issued during encounter' },
      ],
      indexes: ['uq_medical_record_appointment (appointment_id)', 'idx_med_record_patient (patient_id)', 'idx_med_record_doctor (doctor_id)', 'idx_med_record_visit (visit_date)'],
      rules: 'Longitudinal clinical record. Unalterable historical health timeline.',
    },
    {
      name: 'medicines',
      category: 'Pharmacy',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Medicine.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'medicine_code', type: 'VARCHAR(30)', key: 'UQ', nullable: 'NO', desc: 'Formulary barcode ID' },
        { name: 'name', type: 'VARCHAR(150)', key: 'IDX', nullable: 'NO', desc: 'Brand name' },
        { name: 'generic_name', type: 'VARCHAR(150)', key: '', nullable: 'NO', desc: 'Active pharmaceutical ingredient' },
        { name: 'category', type: 'ENUM(ANTIBIOTIC, ANALGESIC, etc.)', key: '', nullable: 'NO', desc: 'Drug classification' },
        { name: 'batch_number', type: 'VARCHAR(50)', key: 'UQ', nullable: 'NO', desc: 'Manufacturing batch' },
        { name: 'stock_quantity', type: 'INT', key: 'IDX', nullable: 'NO', desc: 'Available shelf stock' },
        { name: 'min_stock_alert', type: 'INT', key: '', nullable: 'NO', desc: 'Reorder threshold' },
        { name: 'unit_price', type: 'DECIMAL(10,2)', key: '', nullable: 'NO', desc: 'Unit sales price' },
        { name: 'expiry_date', type: 'DATE', key: 'IDX', nullable: 'NO', desc: 'Safety expiry date' },
        { name: 'manufacturer', type: 'VARCHAR(100)', key: '', nullable: 'NO', desc: 'Pharma company' },
        { name: 'status', type: 'ENUM(AVAILABLE, LOW_STOCK, OUT_OF_STOCK, EXPIRED)', key: 'IDX', nullable: 'NO', desc: 'Inventory state' },
      ],
      relations: [
        { type: '1:N', target: 'prescription_items', note: 'Referenced in prescription items' },
      ],
      indexes: ['uq_medicine_code (medicine_code)', 'uq_medicine_batch (batch_number)', 'idx_medicine_expiry (expiry_date)', 'idx_medicine_stock (stock_quantity)', 'idx_medicine_status (status)'],
      rules: 'SRS Rule 11 & 12: Expired medicines cannot be dispensed. Stock deducted atomically.',
    },
    {
      name: 'prescriptions',
      category: 'Pharmacy',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Prescription.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'prescription_number', type: 'VARCHAR(30)', key: 'UQ', nullable: 'NO', desc: 'Rx script number' },
        { name: 'patient_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References patients(id)' },
        { name: 'doctor_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References doctors(id)' },
        { name: 'medical_record_id', type: 'BIGINT', key: 'FK', nullable: 'YES', desc: 'References medical_records(id)' },
        { name: 'prescription_date', type: 'DATE', key: 'IDX', nullable: 'NO', desc: 'Order date' },
        { name: 'general_instructions', type: 'TEXT', key: '', nullable: 'YES', desc: 'Dietary & lifestyle notes' },
        { name: 'status', type: 'ENUM(ISSUED, DISPENSED, EXPIRED, CANCELLED)', key: 'IDX', nullable: 'NO', desc: 'Dispensing state' },
        { name: 'dispensed_at', type: 'TIMESTAMP', key: '', nullable: 'YES', desc: 'Pharmacy fulfillment time' },
        { name: 'dispensed_by', type: 'BIGINT', key: 'FK', nullable: 'YES', desc: 'References users(id) [Pharmacist]' },
      ],
      relations: [
        { type: 'N:1', target: 'patients', note: 'Patient receiving prescription' },
        { type: 'N:1', target: 'doctors', note: 'Authorizing physician' },
        { type: '1:N', target: 'prescription_items', note: 'Requirement 12: Header + Item breakdown' },
      ],
      indexes: ['uq_prescription_number (prescription_number)', 'idx_prescription_patient (patient_id)', 'idx_prescription_doctor (doctor_id)', 'idx_prescription_status (status)'],
      rules: 'Requirement 12: Prescription header + prescription_items structure.',
    },
    {
      name: 'prescription_items',
      category: 'Pharmacy',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'PrescriptionItem.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'prescription_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References prescriptions(id)' },
        { name: 'medicine_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References medicines(id)' },
        { name: 'dosage', type: 'VARCHAR(50)', key: '', nullable: 'NO', desc: 'Strength (e.g. 500mg)' },
        { name: 'frequency', type: 'VARCHAR(50)', key: '', nullable: 'NO', desc: 'Dosing regimen (e.g. 1-0-1)' },
        { name: 'duration', type: 'VARCHAR(50)', key: '', nullable: 'NO', desc: 'Length of course (e.g. 5 Days)' },
        { name: 'quantity', type: 'INT', key: '', nullable: 'NO', desc: 'Pills/vials count' },
        { name: 'instructions', type: 'VARCHAR(255)', key: '', nullable: 'YES', desc: 'Before/after meal advice' },
      ],
      relations: [
        { type: 'N:1', target: 'prescriptions', note: 'Cascaded child of prescription header' },
        { type: 'N:1', target: 'medicines', note: 'Formulary medicine link' },
      ],
      indexes: ['uq_prescription_medicine (prescription_id, medicine_id)', 'idx_presc_items_medicine (medicine_id)'],
      rules: 'Composite uniqueness prevents prescribing duplicate medicines in same prescription.',
    },
    {
      name: 'inventory_transactions',
      category: 'Pharmacy',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'InventoryTransaction.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'medicine_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References medicines(id)' },
        { name: 'medicine_name', type: 'VARCHAR(100)', key: '', nullable: 'NO', desc: 'Denormalized formulation name' },
        { name: 'batch_number', type: 'VARCHAR(50)', key: 'IDX', nullable: 'NO', desc: 'Manufacturer batch lot' },
        { name: 'transaction_type', type: 'VARCHAR(30)', key: 'IDX', nullable: 'NO', desc: 'STOCK_IN, DISPENSED, ADJUSTMENT, WRITE_OFF, INITIAL' },
        { name: 'quantity_change', type: 'INT', key: '', nullable: 'NO', desc: 'Signed delta amount (+/- units)' },
        { name: 'previous_stock', type: 'INT', key: '', nullable: 'NO', desc: 'Pre-transaction warehouse balance' },
        { name: 'new_stock', type: 'INT', key: '', nullable: 'NO', desc: 'Post-transaction warehouse balance' },
        { name: 'reference_type', type: 'VARCHAR(50)', key: '', nullable: 'YES', desc: 'PRESCRIPTION, PURCHASE_ORDER, MANUAL' },
        { name: 'reference_id', type: 'BIGINT', key: '', nullable: 'YES', desc: 'Foreign key to prescription or order' },
        { name: 'reason', type: 'VARCHAR(255)', key: '', nullable: 'YES', desc: 'Audit justification note' },
        { name: 'performed_by', type: 'VARCHAR(100)', key: '', nullable: 'NO', desc: 'Pharmacist operator' },
        { name: 'created_at', type: 'TIMESTAMP', key: 'IDX', nullable: 'NO', desc: 'Audit timestamp' },
      ],
      relations: [
        { type: 'N:1', target: 'medicines', note: 'Medicine movement ledger' },
      ],
      indexes: ['idx_inv_tx_medicine (medicine_id)', 'idx_inv_tx_type (transaction_type)', 'idx_inv_tx_created (created_at)'],
      rules: 'SRS Rule 5 & Audit Trail: Immutable historical record of every stock movement with pessimistic lock guarantee.',
    },
    {
      name: 'lab_tests',
      category: 'Diagnostics & Lab',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'LabTest.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'test_order_number', type: 'VARCHAR(30)', key: 'UQ', nullable: 'NO', desc: 'Diagnostic order requisition' },
        { name: 'patient_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References patients(id)' },
        { name: 'doctor_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References doctors(id)' },
        { name: 'test_name', type: 'VARCHAR(150)', key: '', nullable: 'NO', desc: 'Test name (e.g. Complete Blood Count)' },
        { name: 'test_code', type: 'VARCHAR(50)', key: '', nullable: 'NO', desc: 'LOINC or lab test code' },
        { name: 'category', type: 'ENUM(BIOCHEMISTRY, HEMATOLOGY, etc.)', key: 'IDX', nullable: 'NO', desc: 'Diagnostic section' },
        { name: 'priority', type: 'ENUM(ROUTINE, URGENT, STAT)', key: '', nullable: 'NO', desc: 'Triage urgency' },
        { name: 'status', type: 'ENUM(ORDERED, SAMPLE_COLLECTED, IN_PROGRESS, COMPLETED, CANCELLED)', key: 'IDX', nullable: 'NO', desc: 'Order status' },
        { name: 'technician_id', type: 'BIGINT', key: 'FK', nullable: 'YES', desc: 'References users(id)' },
        { name: 'ordered_at', type: 'TIMESTAMP', key: 'IDX', nullable: 'NO', desc: 'Requisition timestamp' },
        { name: 'sample_collected_at', type: 'TIMESTAMP', key: '', nullable: 'YES', desc: 'Specimen barcode scan time' },
      ],
      relations: [
        { type: 'N:1', target: 'patients', note: 'Patient undergoing diagnostic test' },
        { type: 'N:1', target: 'doctors', note: 'Physician ordering test' },
        { type: '1:1', target: 'lab_reports', note: 'Requirement 13: Directly generates final diagnostic report' },
      ],
      indexes: ['uq_lab_test_order (test_order_number)', 'idx_lab_test_status (status)', 'idx_lab_test_patient (patient_id)', 'idx_lab_test_category (category)'],
      rules: 'Requirement 13: Laboratory workflow engine from requisition to sample collection and analysis.',
    },
    {
      name: 'lab_reports',
      category: 'Diagnostics & Lab',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'LabReport.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'report_number', type: 'VARCHAR(30)', key: 'UQ', nullable: 'NO', desc: 'Official signed report number' },
        { name: 'lab_test_id', type: 'BIGINT', key: 'UQ/FK', nullable: 'NO', desc: 'References lab_tests(id) [1:1]' },
        { name: 'patient_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References patients(id)' },
        { name: 'technician_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References users(id) [Lab Scientist]' },
        { name: 'verified_by_doctor_id', type: 'BIGINT', key: 'FK', nullable: 'YES', desc: 'References doctors(id) [Pathologist]' },
        { name: 'result_summary', type: 'TEXT', key: '', nullable: 'NO', desc: 'Clinical evaluation' },
        { name: 'findings', type: 'JSON', key: '', nullable: 'YES', desc: 'Structured analyte values and flags' },
        { name: 'normal_range', type: 'VARCHAR(100)', key: '', nullable: 'YES', desc: 'Reference range' },
        { name: 'units', type: 'VARCHAR(50)', key: '', nullable: 'YES', desc: 'SI units (e.g. mg/dL)' },
        { name: 'interpretation', type: 'ENUM(NORMAL, ABNORMAL, CRITICAL)', key: 'IDX', nullable: 'NO', desc: 'Flag' },
        { name: 'status', type: 'ENUM(DRAFT, PRELIMINARY, FINAL, AMENDED)', key: 'IDX', nullable: 'NO', desc: 'Report sign-off state' },
        { name: 'reported_at', type: 'TIMESTAMP', key: '', nullable: 'NO', desc: 'Sign-off timestamp' },
      ],
      relations: [
        { type: '1:1', target: 'lab_tests', note: 'Strict 1:1 relationship with parent test order' },
        { type: 'N:1', target: 'patients', note: 'Patient result chart' },
        { type: 'N:1', target: 'users', note: 'Reporting technologist' },
        { type: 'N:1', target: 'doctors', note: 'Signing pathologist' },
      ],
      indexes: ['uq_lab_report_number (report_number)', 'uq_lab_report_test (lab_test_id)', 'idx_lab_report_patient (patient_id)', 'idx_lab_report_interpretation (interpretation)'],
      rules: 'Requirement 13: Laboratory workflow terminal artifact with structured JSON telemetry and doctor sign-off.',
    },
    {
      name: 'bills',
      category: 'Billing & Finance',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Bill.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'bill_number', type: 'VARCHAR(50)', key: 'UQ', nullable: 'NO', desc: 'Official tax invoice number' },
        { name: 'patient_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References patients(id)' },
        { name: 'admission_id', type: 'BIGINT', key: 'FK', nullable: 'YES', desc: 'References admissions(id)' },
        { name: 'bill_type', type: 'ENUM(OPD, IPD, PHARMACY, LABORATORY, EMERGENCY)', key: '', nullable: 'NO', desc: 'Invoice classification' },
        { name: 'bill_date', type: 'DATE', key: 'IDX', nullable: 'NO', desc: 'Billing date' },
        { name: 'total_amount', type: 'DECIMAL(10,2)', key: '', nullable: 'NO', desc: 'Gross subtotal' },
        { name: 'discount_amount', type: 'DECIMAL(10,2)', key: '', nullable: 'NO', desc: 'Concession / Insurance discount' },
        { name: 'tax_amount', type: 'DECIMAL(10,2)', key: '', nullable: 'NO', desc: 'Applicable GST/tax' },
        { name: 'net_amount', type: 'DECIMAL(10,2)', key: '', nullable: 'NO', desc: 'Net payable amount' },
        { name: 'paid_amount', type: 'DECIMAL(10,2)', key: '', nullable: 'NO', desc: 'Cumulative settlements' },
        { name: 'payment_status', type: 'ENUM(UNPAID, PARTIAL, PAID, REFUNDED)', key: 'IDX', nullable: 'NO', desc: 'Payment balance state' },
        { name: 'due_date', type: 'DATE', key: '', nullable: 'NO', desc: 'Settlement deadline' },
      ],
      relations: [
        { type: 'N:1', target: 'patients', note: 'Billed patient' },
        { type: '1:N', target: 'bill_items', note: 'Requirement 11: One bill contains multiple line items' },
        { type: '1:N', target: 'payments', note: 'One bill can be settled across multiple installments' },
      ],
      indexes: ['uq_bill_number (bill_number)', 'idx_bill_status (payment_status)', 'idx_bill_patient (patient_id)', 'idx_bill_admission (admission_id)', 'idx_bill_date (bill_date)'],
      rules: 'Requirement 11: Header + Line Items financial model. Atomic settlement updates.',
    },
    {
      name: 'bill_items',
      category: 'Billing & Finance',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'BillItem.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'bill_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References bills(id)' },
        { name: 'item_type', type: 'ENUM(CONSULTATION, ROOM_RENT, LAB_TEST, MEDICINE, PROCEDURE, NURSING, OTHER)', key: 'IDX', nullable: 'NO', desc: 'Hospital fee type' },
        { name: 'description', type: 'VARCHAR(255)', key: '', nullable: 'NO', desc: 'Item description' },
        { name: 'unit_price', type: 'DECIMAL(10,2)', key: '', nullable: 'NO', desc: 'Unit price' },
        { name: 'quantity', type: 'INT', key: '', nullable: 'NO', desc: 'Units or days consumed' },
        { name: 'total_price', type: 'DECIMAL(10,2)', key: '', nullable: 'NO', desc: 'unit_price * quantity' },
      ],
      relations: [
        { type: 'N:1', target: 'bills', note: 'Cascades delete with parent bill' },
      ],
      indexes: ['idx_bill_items_bill_id (bill_id)', 'idx_bill_items_type (item_type)'],
      rules: 'Requirement 11: Multi-item billing granularity with ON DELETE CASCADE.',
    },
    {
      name: 'payments',
      category: 'Billing & Finance',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Payment.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'bill_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References bills(id)' },
        { name: 'patient_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References patients(id)' },
        { name: 'payment_date', type: 'TIMESTAMP', key: 'IDX', nullable: 'NO', desc: 'Payment timestamp' },
        { name: 'amount', type: 'DECIMAL(10,2)', key: '', nullable: 'NO', desc: 'Paid amount' },
        { name: 'payment_method', type: 'ENUM(CASH, CREDIT_CARD, DEBIT_CARD, UPI, ONLINE_BANKING, INSURANCE)', key: '', nullable: 'NO', desc: 'Settlement channel' },
        { name: 'transaction_reference', type: 'VARCHAR(100)', key: 'UQ', nullable: 'NO', desc: 'Bank or gateway reference code' },
        { name: 'status', type: 'ENUM(SUCCESS, FAILED, PENDING, REFUNDED)', key: 'IDX', nullable: 'NO', desc: 'Transaction status' },
      ],
      relations: [
        { type: 'N:1', target: 'bills', note: 'Applies payment towards invoice' },
        { type: 'N:1', target: 'patients', note: 'Paying party' },
      ],
      indexes: ['uq_payment_reference (transaction_reference)', 'idx_payment_bill (bill_id)', 'idx_payment_patient (patient_id)', 'idx_payment_date (payment_date)', 'idx_payment_status (status)'],
      rules: 'Idempotent payments prevented by unique transaction_reference constraint.',
    },
    {
      name: 'notifications',
      category: 'Hospital Admin',
      pk: 'id (BIGINT AUTO_INCREMENT)',
      entity: 'Notification.java',
      columns: [
        { name: 'id', type: 'BIGINT AUTO_INCREMENT', key: 'PK', nullable: 'NO', desc: 'Surrogate primary key' },
        { name: 'user_id', type: 'BIGINT', key: 'FK', nullable: 'NO', desc: 'References users(id)' },
        { name: 'title', type: 'VARCHAR(150)', key: '', nullable: 'NO', desc: 'Notification headline' },
        { name: 'message', type: 'TEXT', key: '', nullable: 'NO', desc: 'Message body' },
        { name: 'type', type: 'ENUM(APPOINTMENT, LAB_RESULT, PHARMACY_STOCK, BILLING_DUE, ADMISSION, SYSTEM_ALERT)', key: 'IDX', nullable: 'NO', desc: 'Event category' },
        { name: 'is_read', type: 'BOOLEAN', key: '', nullable: 'NO', desc: 'Read acknowledgment' },
        { name: 'read_at', type: 'TIMESTAMP', key: '', nullable: 'YES', desc: 'Timestamp of read' },
        { name: 'created_at', type: 'TIMESTAMP', key: 'IDX', nullable: 'NO', desc: 'Notification dispatch timestamp' },
      ],
      relations: [
        { type: 'N:1', target: 'users', note: 'Recipient user account' },
      ],
      indexes: ['idx_notifications_user_read (user_id, is_read)', 'idx_notifications_type (type)', 'idx_notifications_created (created_at)'],
      rules: 'Real-time alert delivery and unread count query optimization.',
    },
  ];

  const filteredTables = schemaTables.filter(t =>
    t.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const activeTableData = schemaTables.find(t => t.name === selectedTable) || schemaTables[0];

  const fullSqlSchema = `-- ====================================================================
-- HOSPITAL MANAGEMENT SYSTEM - ENTERPRISE MYSQL DATABASE SCHEMA (DDL)
-- Compliant with Software Requirements Specification (SRS) v1.0
-- Database Engine: MySQL 8.0+ / InnoDB / utf8mb4
-- Normalized (3NF) Architecture with Referential Integrity & Audit Trails
-- ====================================================================

DROP DATABASE IF EXISTS hospital_management_db;
CREATE DATABASE hospital_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_management_db;

-- 1. ROLES TABLE
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_name UNIQUE (name)
) ENGINE=InnoDB;

-- 2. USERS TABLE
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_username UNIQUE (username),
    CONSTRAINT uq_user_email UNIQUE (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_user_role_id (role_id),
    INDEX idx_user_status (status)
) ENGINE=InnoDB;

-- 3. DEPARTMENTS TABLE
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

-- 4. DOCTORS TABLE
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

-- 5. PATIENTS TABLE
CREATE TABLE patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    patient_code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    emergency_contact_name VARCHAR(100) NOT NULL,
    emergency_contact_phone VARCHAR(20) NOT NULL,
    medical_history TEXT,
    allergies TEXT,
    registered_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_patient_code UNIQUE (patient_code),
    CONSTRAINT uq_patient_user UNIQUE (user_id),
    CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patient_phone (phone),
    INDEX idx_patient_name (name),
    INDEX idx_patient_blood_group (blood_group)
) ENGINE=InnoDB;

-- 6. STAFF TABLE
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

-- 7. ROOMS TABLE
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

-- 8. BEDS TABLE (Enforces Requirement 10: Occupied bed cannot be assigned twice)
CREATE TABLE beds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    bed_number VARCHAR(30) NOT NULL,
    status ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    current_patient_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_bed_number UNIQUE (bed_number),
    CONSTRAINT uq_bed_patient UNIQUE (current_patient_id),
    CONSTRAINT fk_beds_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_beds_patient FOREIGN KEY (current_patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    INDEX idx_bed_status (status),
    INDEX idx_bed_room_id (room_id)
) ENGINE=InnoDB;

-- 9. APPOINTMENTS TABLE (Enforces Requirement 9: Conflict Prevention via uq_doctor_slot)
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
    CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appointment_date, appointment_time),
    CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    INDEX idx_appt_doctor_date (doctor_id, appointment_date),
    INDEX idx_appt_patient_date (patient_id, appointment_date),
    INDEX idx_appt_status (status),
    INDEX idx_appt_date (appointment_date)
) ENGINE=InnoDB;

-- 10. ADMISSIONS TABLE
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

-- 11. MEDICAL RECORDS TABLE
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

-- 12. MEDICINES TABLE
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

-- 13. PRESCRIPTIONS TABLE (Requirement 12: Header)
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

-- 14. PRESCRIPTION ITEMS TABLE (Requirement 12: Line Items)
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

-- 15. LAB TESTS TABLE (Requirement 13: Lab Requisition)
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

-- 16. LAB REPORTS TABLE (Requirement 13: Report Completion 1:1)
CREATE TABLE lab_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_number VARCHAR(30) NOT NULL,
    lab_test_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    technician_id BIGINT NOT NULL,
    verified_by_doctor_id BIGINT,
    result_summary TEXT NOT NULL,
    findings JSON,
    normal_range VARCHAR(100),
    units VARCHAR(50),
    interpretation ENUM('NORMAL', 'ABNORMAL', 'CRITICAL') NOT NULL DEFAULT 'NORMAL',
    status ENUM('DRAFT', 'PRELIMINARY', 'FINAL', 'AMENDED') NOT NULL DEFAULT 'FINAL',
    remarks TEXT,
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_lab_report_number UNIQUE (report_number),
    CONSTRAINT uq_lab_report_test UNIQUE (lab_test_id),
    CONSTRAINT fk_lab_reports_test FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lab_reports_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lab_reports_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lab_reports_verifier FOREIGN KEY (verified_by_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
    INDEX idx_lab_report_patient (patient_id),
    INDEX idx_lab_report_interpretation (interpretation),
    INDEX idx_lab_report_status (status)
) ENGINE=InnoDB;

-- 17. BILLS TABLE (Requirement 11: Bill Header)
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

-- 18. BILL ITEMS TABLE (Requirement 11: Multi-Item Breakdown)
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

-- 19. PAYMENTS TABLE
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

-- 20. DISCHARGES TABLE (1:1 with Inpatient Admission)
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
    CONSTRAINT uq_discharge_admission UNIQUE (admission_id),
    CONSTRAINT fk_discharges_admission FOREIGN KEY (admission_id) REFERENCES admissions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_discharges_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_discharges_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    CONSTRAINT fk_discharges_bill FOREIGN KEY (final_bill_id) REFERENCES bills(id) ON DELETE SET NULL,
    INDEX idx_discharge_patient (patient_id),
    INDEX idx_discharge_doctor (doctor_id),
    INDEX idx_discharge_date (discharge_date)
) ENGINE=InnoDB;

-- 21. NOTIFICATIONS TABLE
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
) ENGINE=InnoDB;`;

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fw-bold text-dark mb-0">Hospital Management Database & Architecture</h2>
            <span className="badge bg-primary">MySQL 8.0 • InnoDB • Spring Boot 3.2.3</span>
          </div>
          <p className="text-muted small mb-0">
            Professional 3NF normalized schema with referential integrity, composite conflict detection indexes, and Spring Data JPA entity mappings.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={() => copyToClipboard(fullSqlSchema, 'Complete MySQL DDL')}
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
          >
            <Copy size={14} /> Copy Full SQL Schema
          </button>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div className="d-flex border-bottom mb-4 gap-2">
        <button
          onClick={() => setActiveTab('schema')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'schema' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Database size={16} /> Relational Schema & ER (21 Tables)
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'architecture' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Server size={16} /> Spring Boot Layered Architecture
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'rules' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Shield size={16} /> Conflict & Integrity Rules Engine
        </button>
        <button
          onClick={() => setActiveTab('docker')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'docker' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Terminal size={16} /> Deployment & CLI
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'security' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Lock size={16} /> Spring Security 6 & JWT Auth
        </button>
        <button
          onClick={() => setActiveTab('patient-arch')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'patient-arch' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Users size={16} /> Patient Module Architecture & API
        </button>
        <button
          onClick={() => setActiveTab('appointment-arch')}
          className={`btn btn-sm pb-2 pt-2 px-3 border-0 border-bottom border-3 rounded-0 fw-semibold d-flex align-items-center gap-2 ${
            activeTab === 'appointment-arch' ? 'border-primary text-primary' : 'border-transparent text-secondary'
          }`}
        >
          <Calendar size={16} /> Appointment Architecture & Rules
        </button>
      </div>

      {/* TAB 1: RELATIONAL SCHEMA & ER (21 TABLES) */}
      {activeTab === 'schema' && (
        <div>
          {/* Sub Navigation */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="btn-group btn-group-sm">
              <button
                onClick={() => setSchemaSubTab('tables')}
                className={`btn ${schemaSubTab === 'tables' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                <Table size={13} className="me-1" /> Table Explorer
              </button>
              <button
                onClick={() => setSchemaSubTab('er')}
                className={`btn ${schemaSubTab === 'er' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                <Link2 size={13} className="me-1" /> ER Relationships & Mapping
              </button>
              <button
                onClick={() => setSchemaSubTab('sql')}
                className={`btn ${schemaSubTab === 'sql' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                <FileCode size={13} className="me-1" /> Raw DDL (schema.sql)
              </button>
            </div>
            <div className="text-muted small">
              Path: <code>backend-springboot/src/main/resources/schema.sql</code>
            </div>
          </div>

          {schemaSubTab === 'tables' && (
            <div className="row g-3">
              {/* Left Column: Table List */}
              <div className="col-12 col-md-4 col-xl-3">
                <div className="card border-0 shadow-sm rounded-3 bg-white p-3 h-100">
                  <div className="input-group input-group-sm mb-3">
                    <span className="input-group-text bg-light border-end-0">
                      <Search size={14} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0 ps-1"
                      placeholder="Filter tables..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                    />
                  </div>

                  <div className="d-flex flex-column gap-1 overflow-auto" style={{ maxHeight: '600px' }}>
                    {filteredTables.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => setSelectedTable(t.name)}
                        className={`btn btn-sm text-start p-2 rounded-2 d-flex justify-content-between align-items-center ${
                          selectedTable === t.name ? 'btn-primary text-white' : 'btn-light text-dark'
                        }`}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <Table size={13} className={selectedTable === t.name ? 'text-white' : 'text-primary'} />
                          <span className="font-monospace fw-bold" style={{ fontSize: '0.8rem' }}>{t.name}</span>
                        </div>
                        <span className={`badge ${selectedTable === t.name ? 'bg-light text-dark' : 'bg-secondary bg-opacity-25 text-secondary'}`} style={{ fontSize: '0.65rem' }}>
                          {t.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Table Details */}
              <div className="col-12 col-md-8 col-xl-9">
                <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3 pb-3 border-bottom">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h4 className="fw-bold font-monospace text-primary mb-0">{activeTableData.name}</h4>
                        <span className="badge bg-info text-dark">{activeTableData.category}</span>
                      </div>
                      <div className="text-muted small mt-1">
                        JPA Entity: <code className="text-success fw-bold">{activeTableData.entity}</code>
                      </div>
                    </div>
                    <div className="text-end small">
                      <div className="fw-bold text-secondary">Primary Key</div>
                      <code className="text-danger">{activeTableData.pk}</code>
                    </div>
                  </div>

                  {/* Business Rule / Constraint Banner */}
                  <div className="alert alert-light border border-primary border-start-4 p-3 mb-3 small d-flex align-items-start gap-2">
                    <CheckCircle2 size={16} className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <span className="fw-bold text-dark">Data Integrity & System Rule: </span>
                      <span className="text-secondary">{activeTableData.rules}</span>
                    </div>
                  </div>

                  {/* Columns Definition */}
                  <h6 className="fw-bold text-dark mb-2">Column Definitions & Data Types</h6>
                  <div className="table-responsive mb-4">
                    <table className="table table-sm table-hover align-middle border small">
                      <thead className="table-light">
                        <tr>
                          <th>Column</th>
                          <th>Data Type</th>
                          <th>Key</th>
                          <th>Nullable</th>
                          <th>Clinical / Operational Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTableData.columns.map((col) => (
                          <tr key={col.name}>
                            <td className="font-monospace fw-bold text-primary">{col.name}</td>
                            <td><span className="badge bg-light text-dark font-monospace border">{col.type}</span></td>
                            <td>
                              {col.key === 'PK' && <span className="badge bg-danger">PK</span>}
                              {col.key === 'FK' && <span className="badge bg-warning text-dark">FK</span>}
                              {col.key === 'UQ' && <span className="badge bg-info text-dark">UQ</span>}
                              {col.key?.includes('UQ') && col.key?.includes('FK') && <span className="badge bg-success">1:1 UQ/FK</span>}
                              {col.key === 'IDX' && <span className="badge bg-secondary">IDX</span>}
                            </td>
                            <td><span className={`badge ${col.nullable === 'NO' ? 'bg-danger-subtle text-danger' : 'bg-light text-muted'}`}>{col.nullable}</span></td>
                            <td className="text-secondary">{col.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Relationships & Foreign Keys */}
                  <div className="row g-3">
                    <div className="col-12 col-lg-6">
                      <div className="p-3 border rounded bg-light h-100">
                        <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-1">
                          <Link2 size={14} className="text-primary" /> Relational Links & Cardinality
                        </h6>
                        <div className="d-flex flex-column gap-2 small">
                          {activeTableData.relations.map((rel, idx) => (
                            <div key={idx} className="d-flex align-items-start gap-2 bg-white p-2 rounded border">
                              <span className="badge bg-primary text-white">{rel.type}</span>
                              <div className="text-dark">
                                <span className="font-monospace fw-bold me-1">→ {rel.target}:</span>
                                <span className="text-muted">{rel.note}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-lg-6">
                      <div className="p-3 border rounded bg-light h-100">
                        <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-1">
                          <Key size={14} className="text-primary" /> Recommended Indexes & Unique Constraints
                        </h6>
                        <div className="d-flex flex-column gap-1 small">
                          {activeTableData.indexes.map((idx, i) => (
                            <div key={i} className="font-monospace bg-white p-2 rounded border text-secondary" style={{ fontSize: '0.75rem' }}>
                              {idx}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 2: ER Relationships */}
          {schemaSubTab === 'er' && (
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
              <h5 className="fw-bold mb-1">Entity-Relationship (ER) Architecture & Cardinality Matrix</h5>
              <p className="text-muted small mb-4">
                Strict 3NF normalized relationships with foreign key integrity, cascade triggers, and composite collision checks.
              </p>

              <div className="row g-3">
                <div className="col-12 col-md-6 col-xl-4">
                  <div className="card border p-3 h-100 bg-light">
                    <div className="fw-bold text-primary mb-2">1. Identity & RBAC (1:1 & N:1)</div>
                    <ul className="small text-secondary list-unstyled mb-0 d-flex flex-column gap-2">
                      <li>• <b>roles (1) ↔ (N) users:</b> Normalized RBAC roles assignable across multiple user logins.</li>
                      <li>• <b>users (1) ↔ (1) doctors:</b> Optional 1-to-1 account link. Physician profile references user credential.</li>
                      <li>• <b>users (1) ↔ (1) patients:</b> Optional 1-to-1 self-service patient portal access.</li>
                      <li>• <b>users (1) ↔ (1) staff:</b> Operational hospital personnel record.</li>
                    </ul>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-xl-4">
                  <div className="card border p-3 h-100 bg-light">
                    <div className="fw-bold text-success mb-2">2. Consultations & History (1:N & 1:1)</div>
                    <ul className="small text-secondary list-unstyled mb-0 d-flex flex-column gap-2">
                      <li>• <b>doctors (1) ↔ (N) appointments:</b> Multiple scheduled slots with double-booking prevention constraint.</li>
                      <li>• <b>patients (1) ↔ (N) appointments:</b> Patient booking history.</li>
                      <li>• <b>appointments (1) ↔ (1) medical_records:</b> Each completed consultation generates clinical notes & diagnosis.</li>
                      <li>• <b>patients (1) ↔ (N) medical_records:</b> Longitudinal EHR patient medical chart.</li>
                    </ul>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-xl-4">
                  <div className="card border p-3 h-100 bg-light">
                    <div className="fw-bold text-info mb-2">3. Inpatient & Bed Allocation (1:N & 1:1)</div>
                    <ul className="small text-secondary list-unstyled mb-0 d-flex flex-column gap-2">
                      <li>• <b>rooms (1) ↔ (N) beds:</b> Rooms house multiple physical beds.</li>
                      <li>• <b>beds (1) ↔ (1) patients:</b> Unique constraint on <code>current_patient_id</code> prevents double bed occupancy.</li>
                      <li>• <b>admissions (1) ↔ (1) discharges:</b> Every inpatient stay concludes with an authoritative discharge record.</li>
                      <li>• <b>discharges (1) ↔ (1) bills:</b> Clearance checks require settled bill prior to release.</li>
                    </ul>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-xl-4">
                  <div className="card border p-3 h-100 bg-light">
                    <div className="fw-bold text-warning-emphasis mb-2">4. Pharmacy & Prescriptions (Header-Item 1:N)</div>
                    <ul className="small text-secondary list-unstyled mb-0 d-flex flex-column gap-2">
                      <li>• <b>prescriptions (1) ↔ (N) prescription_items:</b> Prescription header with cascading line items.</li>
                      <li>• <b>medicines (1) ↔ (N) prescription_items:</b> Formulary catalog lookup for dosage and instructions.</li>
                      <li>• <b>prescriptions (N) ↔ (1) patients / doctors:</b> Authority and recipient linkage.</li>
                    </ul>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-xl-4">
                  <div className="card border p-3 h-100 bg-light">
                    <div className="fw-bold text-danger mb-2">5. Laboratory Workflow (1:1 Test to Report)</div>
                    <ul className="small text-secondary list-unstyled mb-0 d-flex flex-column gap-2">
                      <li>• <b>lab_tests (1) ↔ (1) lab_reports:</b> Requisition order transitions from ORDERED to final signed report.</li>
                      <li>• <b>lab_reports (N) ↔ (1) doctors:</b> Attending pathologist verification sign-off.</li>
                      <li>• <b>lab_reports (N) ↔ (1) users:</b> Reporting lab technician badge tracking.</li>
                    </ul>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-xl-4">
                  <div className="card border p-3 h-100 bg-light">
                    <div className="fw-bold text-dark mb-2">6. Billing & Payments (1:N & 1:N)</div>
                    <ul className="small text-secondary list-unstyled mb-0 d-flex flex-column gap-2">
                      <li>• <b>bills (1) ↔ (N) bill_items:</b> Multi-item itemized invoice with <code>ON DELETE CASCADE</code>.</li>
                      <li>• <b>bills (1) ↔ (N) payments:</b> Supports partial payments, split tenders, and installments.</li>
                      <li>• <b>bills (N) ↔ (1) patients:</b> Comprehensive financial ledger per patient.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 3: Raw SQL */}
          {schemaSubTab === 'sql' && (
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0">Complete MySQL 8.0 DDL (schema.sql)</h6>
                  <span className="text-muted small">All 21 normalized tables, constraints, foreign keys, and indexes</span>
                </div>
                <button
                  onClick={() => copyToClipboard(fullSqlSchema, 'schema.sql')}
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                >
                  <Copy size={13} /> Copy DDL Script
                </button>
              </div>
              <pre className="bg-dark text-light p-3 rounded font-monospace small mb-0" style={{ maxHeight: '600px', overflowY: 'auto', fontSize: '0.75rem' }}>
                {fullSqlSchema}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SPRING BOOT ARCHITECTURE & ENTITY MAPPINGS */}
      {activeTab === 'architecture' && (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold text-dark mb-3">Spring Boot JPA Entity Relationship Mapping</h5>
              <p className="text-muted small">
                Every table in the MySQL schema has a corresponding JPA entity with strict lazy fetching, audit listeners, and relationship mappings.
              </p>

              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle border small">
                  <thead className="table-light">
                    <tr>
                      <th>Table</th>
                      <th>JPA Entity</th>
                      <th>Key JPA Annotations</th>
                      <th>Relationships Mapped</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-monospace text-primary fw-bold">roles</td>
                      <td className="font-monospace text-success">RoleEntity.java</td>
                      <td><code>@Entity, @Table(name = "roles")</code></td>
                      <td><span className="badge bg-light text-dark">Root Master</span></td>
                    </tr>
                    <tr>
                      <td className="font-monospace text-primary fw-bold">users</td>
                      <td className="font-monospace text-success">User.java</td>
                      <td><code>@EntityListeners(AuditingEntityListener.class)</code></td>
                      <td><code>@Enumerated, @Column(unique=true)</code></td>
                    </tr>
                    <tr>
                      <td className="font-monospace text-primary fw-bold">appointments</td>
                      <td className="font-monospace text-success">Appointment.java</td>
                      <td><code>@Table(uniqueConstraints = @UniqueConstraint(name = "uq_doctor_slot"))</code></td>
                      <td><code>@ManyToOne Patient, @ManyToOne Doctor</code></td>
                    </tr>
                    <tr>
                      <td className="font-monospace text-primary fw-bold">beds</td>
                      <td className="font-monospace text-success">Bed.java</td>
                      <td><code>@ManyToOne Room, @OneToOne Patient</code></td>
                      <td><code>@OneToOne(name = "current_patient_id")</code></td>
                    </tr>
                    <tr>
                      <td className="font-monospace text-primary fw-bold">prescriptions</td>
                      <td className="font-monospace text-success">Prescription.java</td>
                      <td><code>@OneToMany(mappedBy="prescription", cascade=ALL)</code></td>
                      <td><code>List&lt;PrescriptionItem&gt; items</code></td>
                    </tr>
                    <tr>
                      <td className="font-monospace text-primary fw-bold">lab_reports</td>
                      <td className="font-monospace text-success">LabReport.java</td>
                      <td><code>@OneToOne(fetch=LAZY), @Column(columnDefinition="JSON")</code></td>
                      <td><code>@OneToOne LabTest, @ManyToOne Patient</code></td>
                    </tr>
                    <tr>
                      <td className="font-monospace text-primary fw-bold">bills</td>
                      <td className="font-monospace text-success">Bill.java</td>
                      <td><code>@OneToMany(mappedBy="bill", cascade=ALL, orphanRemoval=true)</code></td>
                      <td><code>List&lt;BillItem&gt; billItems</code></td>
                    </tr>
                    <tr>
                      <td className="font-monospace text-primary fw-bold">discharges</td>
                      <td className="font-monospace text-success">DischargeRecord.java</td>
                      <td><code>@OneToOne(fetch=LAZY, optional=false)</code></td>
                      <td><code>@OneToOne Admission</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 mb-4">
              <h6 className="fw-bold text-dark mb-3">Enterprise Architecture Rules</h6>
              <div className="d-flex flex-column gap-3 small">
                <div className="p-3 bg-light rounded border-start border-primary border-4">
                  <div className="fw-bold text-primary mb-1">DTO Isolation</div>
                  <div className="text-muted">No JPA entities leak through the REST Controller layer. DTOs wrap all inputs and outputs.</div>
                </div>
                <div className="p-3 bg-light rounded border-start border-success border-4">
                  <div className="fw-bold text-success mb-1">JPA Auditing</div>
                  <div className="text-muted"><code>@CreatedDate</code> and <code>@LastModifiedDate</code> capture all lifecycle changes automatically.</div>
                </div>
                <div className="p-3 bg-light rounded border-start border-warning border-4">
                  <div className="fw-bold text-warning-emphasis mb-1">Transactional Atomicity</div>
                  <div className="text-muted">All multi-step operations (e.g., bed check-in, medicine dispense, bill settlement) run inside <code>@Transactional</code>.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFLICT & INTEGRITY RULES ENGINE */}
      {activeTab === 'rules' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
          <h5 className="fw-bold mb-2">SRS Conflict Detection & Database Enforcement</h5>
          <p className="text-muted small mb-4">
            How the schema guarantees that business conflicts are intercepted at the database and application layers.
          </p>

          <div className="row g-4">
            <div className="col-12 col-md-6">
              <div className="p-3 border rounded bg-light h-100">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-danger">Requirement 9</span>
                  <h6 className="fw-bold mb-0 text-dark">Doctor Double-Booking Interception</h6>
                </div>
                <p className="text-secondary small">
                  Prevents two appointments from being scheduled for the same doctor at the same date and time.
                </p>
                <div className="p-2 bg-dark text-light rounded font-monospace small mb-2" style={{ fontSize: '0.75rem' }}>
                  CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appointment_date, appointment_time)
                </div>
                <div className="text-muted small">
                  When a collision occurs, MySQL raises error <code>1062 (23000) Duplicate entry</code>, which Spring Boot maps to <code>ConflictException</code> returning <b>HTTP 409 Conflict</b>.
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 border rounded bg-light h-100">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-danger">Requirement 10</span>
                  <h6 className="fw-bold mb-0 text-dark">Occupied Bed Double-Assignment Interception</h6>
                </div>
                <p className="text-secondary small">
                  Ensures a patient can occupy at most one bed, and an occupied bed cannot be reassigned to another patient.
                </p>
                <div className="p-2 bg-dark text-light rounded font-monospace small mb-2" style={{ fontSize: '0.75rem' }}>
                  CONSTRAINT uq_bed_patient UNIQUE (current_patient_id)
                </div>
                <div className="text-muted small">
                  Application service verifies <code>bed.getStatus() == BedStatus.AVAILABLE</code> before admission. The unique constraint prevents race conditions.
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 border rounded bg-light h-100">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-primary">Requirement 11</span>
                  <h6 className="fw-bold mb-0 text-dark">Multi-Item Billing Hierarchy</h6>
                </div>
                <p className="text-secondary small">
                  Enforces clean parent-child relationship between invoice header and bill line items.
                </p>
                <div className="p-2 bg-dark text-light rounded font-monospace small mb-2" style={{ fontSize: '0.75rem' }}>
                  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
                </div>
                <div className="text-muted small">
                  Consolidates room rent, consultation fee, lab tests, and dispensed medicines into an itemized financial record.
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 border rounded bg-light h-100">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-info text-dark">Requirement 13</span>
                  <h6 className="fw-bold mb-0 text-dark">Laboratory Order-to-Report Lifecycle</h6>
                </div>
                <p className="text-secondary small">
                  Guarantees 1-to-1 workflow integrity from doctor requisition order to verified pathologist report.
                </p>
                <div className="p-2 bg-dark text-light rounded font-monospace small mb-2" style={{ fontSize: '0.75rem' }}>
                  CONSTRAINT uq_lab_report_test UNIQUE (lab_test_id)
                </div>
                <div className="text-muted small">
                  Stores analyte results in native MySQL JSON format, enabling flexible lab test parameters with high querying performance.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEPLOYMENT & CLI */}
      {activeTab === 'docker' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
          <h5 className="fw-bold mb-3">Commands to Run and Test</h5>
          <div className="d-flex flex-column gap-3">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold small">1. Deploy Full Stack via Docker Compose:</span>
                <button onClick={() => copyToClipboard('docker compose up -d --build', 'Docker command')} className="btn btn-link btn-sm p-0">
                  <Copy size={13} />
                </button>
              </div>
              <pre className="bg-dark text-light p-3 rounded font-monospace small mb-0">docker compose up -d --build</pre>
            </div>

            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold small">2. Run Spring Boot Directly with Maven:</span>
                <button onClick={() => copyToClipboard('cd backend-springboot\nmvn clean spring-boot:run', 'Maven command')} className="btn btn-link btn-sm p-0">
                  <Copy size={13} />
                </button>
              </div>
              <pre className="bg-dark text-light p-3 rounded font-monospace small mb-0">cd backend-springboot&#10;mvn clean spring-boot:run</pre>
            </div>

            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold small">3. Test JWT Login API via cURL:</span>
                <button onClick={() => copyToClipboard('curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d \'{"usernameOrEmail":"admin","password":"Password@123"}\'', 'cURL command')} className="btn btn-link btn-sm p-0">
                  <Copy size={13} />
                </button>
              </div>
              <pre className="bg-dark text-light p-3 rounded font-monospace small mb-0">
{`curl -X POST http://localhost:8080/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"usernameOrEmail":"admin","password":"Password@123"}'`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SPRING SECURITY 6 & JWT AUTH ARCHITECTURE */}
      {activeTab === 'security' && (
        <SecurityHubTab />
      )}

      {/* TAB 6: PATIENT MANAGEMENT ARCHITECTURE & REST API */}
      {activeTab === 'patient-arch' && (
        <PatientHubTab />
      )}

      {/* TAB 7: APPOINTMENT MANAGEMENT ARCHITECTURE & REST API */}
      {activeTab === 'appointment-arch' && (
        <AppointmentHubTab />
      )}
    </div>
  );
};
