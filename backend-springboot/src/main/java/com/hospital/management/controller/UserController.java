package com.hospital.management.controller;

import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.dto.user.ChangePasswordRequest;
import com.hospital.management.dto.user.UserDTO;
import com.hospital.management.dto.user.UserProfileResponse;
import com.hospital.management.service.UserService;
import com.hospital.management.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Users & Staff", description = "User directory, role assignment, account status management, and credential updates")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "List all hospital users", description = "Retrieves complete user directory with role assignments (Admin only).")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @Operation(summary = "Get user account by ID", description = "Retrieves user account credentials metadata and role (Admin only).")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @Operation(summary = "Get current authenticated profile", description = "Returns user profile, roles, and profile attributes for active JWT subject.")
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser() {
        String username = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
        UserProfileResponse profile = userService.getCurrentUserProfile(username);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @Operation(summary = "Change account password", description = "Validates existing password and applies new BCrypt hashed credentials.")
    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String username = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
        userService.changePassword(username, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
    }

    @Operation(summary = "Activate or suspend user account", description = "Modifies user active flag and records security audit trail.")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> setStatus(@PathVariable Long id, @RequestParam boolean active) {
        userService.setUserActiveStatus(id, active);
        return ResponseEntity.ok(ApiResponse.success(null, "User status updated successfully"));
    }
}
