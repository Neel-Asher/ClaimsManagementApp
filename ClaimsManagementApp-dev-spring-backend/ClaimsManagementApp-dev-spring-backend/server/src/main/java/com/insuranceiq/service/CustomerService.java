package com.insuranceiq.service;

import com.insuranceiq.dto.CustomerRequest;
import com.insuranceiq.dto.CustomerResponse;
import com.insuranceiq.exception.ResourceNotFoundException;
import com.insuranceiq.model.Agent;
import com.insuranceiq.model.Customer;
import com.insuranceiq.model.User;
import com.insuranceiq.model.enums.KycStatus;
import com.insuranceiq.repository.AgentRepository;
import com.insuranceiq.repository.CustomerRepository;
import com.insuranceiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final AgentRepository agentRepository;

    public List<CustomerResponse> getAll() {
        return customerRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CustomerResponse getById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
        return toResponse(customer);
    }

    public CustomerResponse create(CustomerRequest request) {
        Customer customer = new Customer();
        mapRequestToEntity(request, customer);
        customer.setCreatedAt(LocalDate.now());
        customer = customerRepository.save(customer);
        return toResponse(customer);
    }

    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
        mapRequestToEntity(request, customer);
        customer = customerRepository.save(customer);
        return toResponse(customer);
    }

    public void delete(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Customer not found: " + id);
        }
        customerRepository.deleteById(id);
    }

    public List<CustomerResponse> search(String name) {
        return customerRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private void mapRequestToEntity(CustomerRequest request, Customer customer) {
        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        if (request.getDob() != null) {
            customer.setDob(LocalDate.parse(request.getDob()));
        }
        customer.setAddress(request.getAddress());
        if (request.getKycStatus() != null) {
            customer.setKycStatus(KycStatus.fromValue(request.getKycStatus()));
        }
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUserId()));
            customer.setUser(user);
        }
        if (request.getAgentId() != null) {
            Agent agent = agentRepository.findById(request.getAgentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Agent not found: " + request.getAgentId()));
            customer.setAgent(agent);
        }
    }

    private CustomerResponse toResponse(Customer c) {
        return CustomerResponse.builder()
                .customerId(c.getCustomerId())
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .name(c.getName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .dob(c.getDob())
                .address(c.getAddress())
                .kycStatus(c.getKycStatus() != null ? c.getKycStatus().toValue() : null)
                .agentId(c.getAgent() != null ? c.getAgent().getAgentId() : null)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
