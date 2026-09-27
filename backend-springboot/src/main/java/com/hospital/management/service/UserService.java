package com.hospital.management.service;

import com.hospital.management.dto.user.ChangePasswordRequest;
import com.hospital.management.dto.user.UserDTO;
import com.hospital.management.dto.user.UserProfileResponse;

import java.util.List;

public interface UserService {
    List<UserDTO> getAllUsers();
    UserDTO getUserById(Long id);
    UserProfileResponse getCurrentUserProfile(String username);
    void changePassword(String username, ChangePasswordRequest request);
    void setUserActiveStatus(Long id, boolean active);
}
