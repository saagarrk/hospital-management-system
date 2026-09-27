package com.hospital.management.service.impl;

import com.hospital.management.dto.billing.*;
import com.hospital.management.dto.common.PagedResponse;
import com.hospital.management.entity.*;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ConflictException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.exception.UnauthorizedActionException;
import com.hospital.management.mapper.BillMapper;
import com.hospital.management.mapper.PaymentMapper;
import com.hospital.management.repository.*;
import com.hospital.management.service.BillingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingServiceImpl implements BillingService {

    private final BillRepository billRepository;
    private final PatientRepository patientRepository;
    private final PaymentRepository paymentRepository;
    private final BillMapper billMapper;
    private final PaymentMapper paymentMapper;
    private final com.hospital.management.service.AuditLogService auditLogService;

    private static final BigDecimal DEFAULT_TAX_RATE = new BigDecimal("5.00"); // 5% Healthcare Tax / GST

    // =========================================================================
    // GENERATE BILL (Server-Side Financial Calculation with BigDecimal)
    // =========================================================================

    @Override
    @Transactional
    public BillResponse createBill(BillCreateRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));

        // Financial Calculation Requirement: Never trust totals sent from frontend.
        BigDecimal subtotal = BigDecimal.ZERO;
        List<BillItem> billItems = new ArrayList<>();

        Bill bill = Bill.builder()
                .billNumber("INV-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .patient(patient)
                .admissionId(request.getAdmissionId())
                .appointmentId(request.getAppointmentId())
                .billType(request.getBillType() != null ? request.getBillType().toUpperCase() : "OUTPATIENT")
                .billDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(14))
                .paidAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .paymentStatus("UNPAID")
                .items(new ArrayList<>())
                .payments(new ArrayList<>())
                .build();

        for (BillItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new BusinessRuleException("Quantity must be greater than zero", HttpStatus.BAD_REQUEST);
            }
            if (itemReq.getUnitPrice() == null || itemReq.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessRuleException("Unit price must be non-negative", HttpStatus.BAD_REQUEST);
            }

            BigDecimal lineTotal = itemReq.getUnitPrice()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            subtotal = subtotal.add(lineTotal);

            BillItem item = BillItem.builder()
                    .bill(bill)
                    .itemDescription(itemReq.getItemDescription())
                    .itemType(itemReq.getItemType().toUpperCase())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice().setScale(2, RoundingMode.HALF_UP))
                    .totalPrice(lineTotal)
                    .build();

            billItems.add(item);
        }

        // Apply discount calculation
        BigDecimal discount = BigDecimal.ZERO;
        if (request.getDiscountAmount() != null && request.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            discount = request.getDiscountAmount().min(subtotal).setScale(2, RoundingMode.HALF_UP);
        }

        // Tax calculation on taxable portion
        BigDecimal taxRate = DEFAULT_TAX_RATE;
        BigDecimal taxableAmount = subtotal.subtract(discount).max(BigDecimal.ZERO);
        BigDecimal tax = (request.getTaxAmount() != null && request.getTaxAmount().compareTo(BigDecimal.ZERO) >= 0)
                ? request.getTaxAmount().setScale(2, RoundingMode.HALF_UP)
                : taxableAmount.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal netAmount = taxableAmount.add(tax).setScale(2, RoundingMode.HALF_UP);

        bill.setItems(billItems);
        bill.setTotalAmount(subtotal.setScale(2, RoundingMode.HALF_UP));
        bill.setDiscountAmount(discount);
        bill.setTaxRate(taxRate);
        bill.setTaxAmount(tax);
        bill.setNetAmount(netAmount);

        Bill saved = billRepository.save(bill);

        auditLogService.logCurrentActor(
                "BILL_CREATED",
                "BILL",
                saved.getId(),
                String.format("Generated invoice #%s for patient %s. Subtotal: $%s, Net: $%s",
                        saved.getBillNumber(), patient.getName(), saved.getTotalAmount(), saved.getNetAmount())
        );

        log.info("Generated Invoice #{} for Patient #{} (Subtotal: ${}, Net: ${})",
                saved.getBillNumber(), patient.getId(), saved.getTotalAmount(), saved.getNetAmount());
        return billMapper.toResponse(saved);
    }

    // =========================================================================
    // ADD BILL ITEMS (Incremental Inpatient / Outpatient Services)
    // =========================================================================

    @Override
    @Transactional
    public BillResponse addBillItems(Long billId, List<BillItemRequest> items) {
        // Pessimistic write lock ensures atomic recalculation
        Bill bill = billRepository.findByIdForUpdate(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        if ("PAID".equalsIgnoreCase(bill.getPaymentStatus())) {
            throw new ConflictException("Cannot add items to invoice " + bill.getBillNumber() + " because it is already fully PAID and settled.");
        }

        for (BillItemRequest itemReq : items) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new BusinessRuleException("Quantity must be at least 1", HttpStatus.BAD_REQUEST);
            }
            if (itemReq.getUnitPrice() == null || itemReq.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessRuleException("Unit price must be non-negative", HttpStatus.BAD_REQUEST);
            }

            BigDecimal lineTotal = itemReq.getUnitPrice()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            BillItem item = BillItem.builder()
                    .bill(bill)
                    .itemDescription(itemReq.getItemDescription())
                    .itemType(itemReq.getItemType().toUpperCase())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice().setScale(2, RoundingMode.HALF_UP))
                    .totalPrice(lineTotal)
                    .build();

            bill.getItems().add(item);
        }

        recalculateBillTotals(bill);
        Bill saved = billRepository.save(bill);
        log.info("Added {} item(s) to Bill #{}. New net amount: ${}", items.size(), saved.getBillNumber(), saved.getNetAmount());
        return billMapper.toResponse(saved);
    }

    // =========================================================================
    // APPLY AUTHORIZED DISCOUNT
    // =========================================================================

    @Override
    @Transactional
    public BillResponse applyDiscount(Long billId, DiscountRequest request) {
        Bill bill = billRepository.findByIdForUpdate(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        BigDecimal subtotal = bill.getTotalAmount() != null ? bill.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal newDiscount = BigDecimal.ZERO;

        if (request.getDiscountPercentage() != null && request.getDiscountPercentage().compareTo(BigDecimal.ZERO) > 0) {
            if (request.getDiscountPercentage().compareTo(new BigDecimal("100.00")) > 0) {
                throw new BusinessRuleException("Discount percentage cannot exceed 100%", HttpStatus.BAD_REQUEST);
            }
            newDiscount = subtotal.multiply(request.getDiscountPercentage())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            bill.setDiscountPercentage(request.getDiscountPercentage());
        } else if (request.getDiscountAmount() != null && request.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            newDiscount = request.getDiscountAmount().setScale(2, RoundingMode.HALF_UP);
            bill.setDiscountPercentage(newDiscount.multiply(BigDecimal.valueOf(100)).divide(subtotal, 2, RoundingMode.HALF_UP));
        }

        if (newDiscount.compareTo(subtotal) > 0) {
            throw new BusinessRuleException("Discount amount cannot exceed invoice subtotal ($" + subtotal + ")", HttpStatus.BAD_REQUEST);
        }

        bill.setDiscountAmount(newDiscount);
        bill.setDiscountReason(request.getDiscountReason());

        recalculateBillTotals(bill);

        // Verification: Net amount must not be less than already paid amount
        if (bill.getNetAmount().compareTo(bill.getPaidAmount()) < 0) {
            throw new BusinessRuleException(
                    "Discount would reduce invoice net amount ($" + bill.getNetAmount() + ") below already paid amount ($" + bill.getPaidAmount() + "). Issue a refund first.",
                    HttpStatus.CONFLICT
            );
        }

        Bill saved = billRepository.save(bill);
        log.info("Applied discount of ${} to Bill #{} (Reason: {})", newDiscount, saved.getBillNumber(), request.getDiscountReason());
        return billMapper.toResponse(saved);
    }

    // =========================================================================
    // RECORD PAYMENT (Pessimistic Lock & Idempotent Duplicate Guard)
    // =========================================================================

    @Override
    @Transactional
    public BillResponse recordPayment(Long billId, PaymentRequest request) {
        // Pessimistic write lock prevents concurrent duplicate payments or overpayments
        Bill bill = billRepository.findByIdForUpdate(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        if ("PAID".equalsIgnoreCase(bill.getPaymentStatus())) {
            throw new ConflictException("Invoice " + bill.getBillNumber() + " is already fully PAID and settled.");
        }

        BigDecimal payAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);
        if (payAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Payment amount must be greater than zero", HttpStatus.BAD_REQUEST);
        }

        // Idempotency: Prevent duplicate payment processing by transaction reference
        String ref = request.getTransactionReference();
        if (ref != null && !ref.trim().isEmpty()) {
            if (paymentRepository.existsByTransactionReference(ref.trim())) {
                throw new ConflictException("Duplicate payment detected: Transaction reference '" + ref + "' has already been processed.");
            }
        } else {
            ref = "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        }

        BigDecimal currentPaid = bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal netAmount = bill.getNetAmount();
        BigDecimal remaining = netAmount.subtract(currentPaid).setScale(2, RoundingMode.HALF_UP);

        if (payAmount.compareTo(remaining) > 0) {
            throw new BusinessRuleException(
                    "Payment amount ($" + payAmount + ") exceeds outstanding balance ($" + remaining + ")",
                    HttpStatus.BAD_REQUEST
            );
        }

        BigDecimal updatedPaid = currentPaid.add(payAmount).setScale(2, RoundingMode.HALF_UP);
        bill.setPaidAmount(updatedPaid);

        if (updatedPaid.compareTo(netAmount) >= 0) {
            bill.setPaymentStatus("PAID");
        } else {
            bill.setPaymentStatus("PARTIAL");
        }

        Payment payment = Payment.builder()
                .bill(bill)
                .amount(payAmount)
                .paymentMethod(request.getPaymentMethod().name())
                .transactionReference(ref)
                .paymentDate(LocalDateTime.now())
                .status("COMPLETED")
                .build();

        paymentRepository.save(payment);
        bill.getPayments().add(payment);

        Bill saved = billRepository.save(bill);

        auditLogService.logCurrentActor(
                "PAYMENT",
                "BILL",
                saved.getId(),
                String.format("Processed payment of $%s (%s) for bill #%s. Remaining balance: $%s",
                        payAmount, request.getPaymentMethod(), saved.getBillNumber(), netAmount.subtract(updatedPaid))
        );

        log.info("Processed payment of ${} ({}) for Bill #{}. New balance: ${}",
                payAmount, request.getPaymentMethod(), saved.getBillNumber(), netAmount.subtract(updatedPaid));

        return billMapper.toResponse(saved);
    }

    // =========================================================================
    // QUERY METHODS
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentHistory(Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        verifyPatientBillingAccess(bill.getPatient());

        return paymentRepository.findByBillIdOrderByPaymentDateDesc(bill.getId()).stream()
                .map(paymentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BillResponse getBillById(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));
        verifyPatientBillingAccess(bill.getPatient());
        return billMapper.toResponse(bill);
    }

    @Override
    @Transactional(readOnly = true)
    public BillResponse getBillByAdmissionId(Long admissionId) {
        List<Bill> bills = billRepository.findByAdmissionId(admissionId);
        if (bills.isEmpty()) {
            throw new ResourceNotFoundException("No bill found for admission id: " + admissionId);
        }
        Bill bill = bills.get(0);
        verifyPatientBillingAccess(bill.getPatient());
        return billMapper.toResponse(bill);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillResponse> getBillsByPatient(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
        verifyPatientBillingAccess(patient);

        return billRepository.findByPatientId(patientId).stream()
                .map(billMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PatientBillingSummaryResponse getPatientBillingSummary(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        verifyPatientBillingAccess(patient);

        List<Bill> bills = billRepository.findByPatientId(patientId);
        BigDecimal totalBilled = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        int unpaidCount = 0;

        List<BillResponse> billResponses = new ArrayList<>();
        for (Bill b : bills) {
            BigDecimal net = b.getNetAmount() != null ? b.getNetAmount() : BigDecimal.ZERO;
            BigDecimal paid = b.getPaidAmount() != null ? b.getPaidAmount() : BigDecimal.ZERO;
            totalBilled = totalBilled.add(net);
            totalPaid = totalPaid.add(paid);

            if (!"PAID".equalsIgnoreCase(b.getPaymentStatus())) {
                unpaidCount++;
            }
            billResponses.add(billMapper.toResponse(b));
        }

        BigDecimal outstanding = totalBilled.subtract(totalPaid).max(BigDecimal.ZERO);

        return PatientBillingSummaryResponse.builder()
                .patientId(patient.getId())
                .patientName(patient.getName())
                .patientCode(patient.getPatientCode())
                .totalBillsCount(bills.size())
                .unpaidBillsCount(unpaidCount)
                .totalBilled(totalBilled)
                .totalPaid(totalPaid)
                .totalOutstanding(outstanding)
                .hasOutstandingBalance(outstanding.compareTo(BigDecimal.ZERO) > 0)
                .bills(billResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<BillResponse> getAllBills(String paymentStatus, Pageable pageable) {
        Page<Bill> page = (paymentStatus != null && !paymentStatus.trim().isEmpty() && !"ALL".equalsIgnoreCase(paymentStatus))
                ? billRepository.findByPaymentStatus(paymentStatus.toUpperCase(), pageable)
                : billRepository.findAll(pageable);

        List<BillResponse> content = page.getContent().stream()
                .map(billMapper::toResponse)
                .collect(Collectors.toList());

        return PagedResponse.<BillResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    // =========================================================================
    // HELPER: Server-side recalculation of financial values
    // =========================================================================

    private void recalculateBillTotals(Bill bill) {
        BigDecimal subtotal = BigDecimal.ZERO;
        if (bill.getItems() != null) {
            for (BillItem item : bill.getItems()) {
                BigDecimal line = item.getUnitPrice()
                        .multiply(BigDecimal.valueOf(item.getQuantity()))
                        .setScale(2, RoundingMode.HALF_UP);
                item.setTotalPrice(line);
                subtotal = subtotal.add(line);
            }
        }

        bill.setTotalAmount(subtotal);

        BigDecimal discount = bill.getDiscountAmount() != null ? bill.getDiscountAmount() : BigDecimal.ZERO;
        discount = discount.min(subtotal);
        bill.setDiscountAmount(discount);

        BigDecimal taxableAmount = subtotal.subtract(discount).max(BigDecimal.ZERO);
        BigDecimal taxRate = bill.getTaxRate() != null ? bill.getTaxRate() : DEFAULT_TAX_RATE;
        BigDecimal tax = taxableAmount.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        bill.setTaxAmount(tax);

        BigDecimal netAmount = taxableAmount.add(tax).setScale(2, RoundingMode.HALF_UP);
        bill.setNetAmount(netAmount);

        BigDecimal paid = bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO;
        if (paid.compareTo(netAmount) >= 0) {
            bill.setPaymentStatus("PAID");
        } else if (paid.compareTo(BigDecimal.ZERO) > 0) {
            bill.setPaymentStatus("PARTIAL");
        } else {
            bill.setPaymentStatus("UNPAID");
        }
    }

    /**
     * Enforces SRS Rule 9 / HIPAA PHI isolation:
     * Patients are strictly restricted to querying their own invoices and financial ledgers.
     * Prevents IDOR (Insecure Direct Object Reference) vulnerabilities.
     */
    private void verifyPatientBillingAccess(Patient patient) {
        if (patient == null) return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return;
        }

        boolean isPatientRole = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_PATIENT") || a.equals("PATIENT"));

        if (isPatientRole) {
            String currentUsername = auth.getName();
            boolean isOwner = patient.getUser() != null &&
                    currentUsername.equalsIgnoreCase(patient.getUser().getUsername());

            if (!isOwner) {
                log.warn("IDOR Access Violation: User '{}' attempted to view billing records belonging to Patient ID: {}",
                        currentUsername, patient.getId());
                throw new UnauthorizedActionException("SRS Rule 9 Privacy Violation: Patients are strictly restricted to querying their own billing and payment records.");
            }
        }
    }
}
