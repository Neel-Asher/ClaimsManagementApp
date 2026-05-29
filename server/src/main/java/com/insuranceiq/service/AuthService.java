package com.insuranceiq.service;

import com.insuranceiq.dto.*;
import com.insuranceiq.exception.BadRequestException;
import com.insuranceiq.exception.UnauthorizedException;
import com.insuranceiq.model.User;
import com.insuranceiq.model.enums.Role;
import com.insuranceiq.repository.UserRepository;
import com.insuranceiq.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        // If role is specified, verify it matches
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            Role requestedRole = Role.fromValue(request.getRole());
            if (user.getRole() != requestedRole) {
                throw new UnauthorizedException("Invalid credentials for the selected role");
            }
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().toValue());

        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().toValue())
                .status(user.getStatus())
                .build();

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.fromValue(request.getRole()))
                .status("active")
                .build();

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().toValue());

        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().toValue())
                .status(user.getStatus())
                .build();

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }
}
