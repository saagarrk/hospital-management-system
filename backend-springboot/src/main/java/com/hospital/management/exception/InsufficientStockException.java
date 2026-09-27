package com.hospital.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a medication order, dispensing action, or inventory requisition
 * cannot be completed because current inventory quantity is below the required dose/units.
 * Enforces SRS Rule 11 & Rule 12.
 * Maps to HTTP 400 Bad Request.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InsufficientStockException extends BusinessRuleException {

    private final String medicineName;
    private final Integer requestedQuantity;
    private final Integer availableStock;

    public InsufficientStockException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
        this.medicineName = null;
        this.requestedQuantity = null;
        this.availableStock = null;
    }

    public InsufficientStockException(String medicineName, int requestedQuantity, int availableStock) {
        super(String.format("Insufficient stock for medication '%s': Requested %d units, but only %d units available in inventory.",
                medicineName, requestedQuantity, availableStock), HttpStatus.BAD_REQUEST);
        this.medicineName = medicineName;
        this.requestedQuantity = requestedQuantity;
        this.availableStock = availableStock;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }

    public Integer getAvailableStock() {
        return availableStock;
    }
}
