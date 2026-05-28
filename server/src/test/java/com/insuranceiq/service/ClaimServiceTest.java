package com.insuranceiq.service;

import com.insuranceiq.dto.ClaimRequest;
import com.insuranceiq.dto.ClaimResponse;
import com.insuranceiq.exception.ResourceNotFoundException;
import com.insuranceiq.model.Claim;
import com.insuranceiq.model.Customer;
import com.insuranceiq.model.Policy;
import com.insuranceiq.model.enums.ClaimStatus;
import com.insuranceiq.repository.ClaimRepository;
import com.insuranceiq.repository.CustomerRepository;
import com.insuranceiq.repository.PolicyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ClaimServiceTest {

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private PolicyRepository policyRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ClaimService claimService;

    private Claim claim;
    private ClaimRequest claimRequest;
    private Customer customer;
    private Policy policy;

    @BeforeEach
    void setUp() {
        customer = new Customer();
        customer.setCustomerId(1L);
        customer.setName("John Doe");

        policy = new Policy();
        policy.setPolicyId("POL-123");

        claim = new Claim();
        claim.setClaimId("CLM-2026-001");
        claim.setCustomer(customer);
        claim.setPolicy(policy);
        claim.setClaimType("Auto");
        claim.setIncidentDate(LocalDate.of(2026, 1, 1));
        claim.setClaimAmount(5000.0);
        claim.setStatus(ClaimStatus.PENDING);
        claim.setCreatedAt(LocalDate.now());

        claimRequest = new ClaimRequest();
        claimRequest.setCustomerId(1L);
        claimRequest.setPolicyId("POL-123");
        claimRequest.setClaimType("Auto");
        claimRequest.setIncidentDate("2026-01-01");
        claimRequest.setClaimAmount(5000.0);
        claimRequest.setDescription("Car accident");
    }

    @Test
    void testGetAll() {
        when(claimRepository.findAll()).thenReturn(Arrays.asList(claim));

        List<ClaimResponse> responses = claimService.getAll();

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("CLM-2026-001", responses.get(0).getClaimId());
        verify(claimRepository, times(1)).findAll();
    }

    @Test
    void testGetById_Success() {
        when(claimRepository.findById("CLM-2026-001")).thenReturn(Optional.of(claim));

        ClaimResponse response = claimService.getById("CLM-2026-001");

        assertNotNull(response);
        assertEquals("CLM-2026-001", response.getClaimId());
        verify(claimRepository, times(1)).findById("CLM-2026-001");
    }

    @Test
    void testGetById_NotFound() {
        when(claimRepository.findById("CLM-999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            claimService.getById("CLM-999");
        });
        verify(claimRepository, times(1)).findById("CLM-999");
    }

    @Test
    void testCreate_Success() {
        when(policyRepository.findById("POL-123")).thenReturn(Optional.of(policy));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(claimRepository.count()).thenReturn(0L);
        when(claimRepository.save(any(Claim.class))).thenAnswer(i -> i.getArguments()[0]);

        ClaimResponse response = claimService.create(claimRequest);

        assertNotNull(response);
        assertEquals(5000.0, response.getClaimAmount());
        assertEquals(ClaimStatus.PENDING.toValue(), response.getStatus());
        verify(claimRepository, times(1)).save(any(Claim.class));
        verify(notificationService, times(1)).sendEvent(eq("claimFiled"), anyString());
    }

    @Test
    void testUpdate_Success() {
        when(claimRepository.findById("CLM-2026-001")).thenReturn(Optional.of(claim));
        when(policyRepository.findById("POL-123")).thenReturn(Optional.of(policy));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(claimRepository.save(any(Claim.class))).thenReturn(claim);

        claimRequest.setStatus("Approved");
        ClaimResponse response = claimService.update("CLM-2026-001", claimRequest);

        assertNotNull(response);
        assertEquals("Approved", response.getStatus());
        verify(claimRepository, times(1)).save(claim);
        verify(notificationService, times(1)).sendEvent(eq("claimStatusUpdated"), anyString());
    }

    @Test
    void testDelete_Success() {
        when(claimRepository.existsById("CLM-2026-001")).thenReturn(true);
        doNothing().when(claimRepository).deleteById("CLM-2026-001");

        assertDoesNotThrow(() -> claimService.delete("CLM-2026-001"));
        verify(claimRepository, times(1)).deleteById("CLM-2026-001");
    }

    @Test
    void testDelete_NotFound() {
        when(claimRepository.existsById("CLM-999")).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> {
            claimService.delete("CLM-999");
        });
        verify(claimRepository, never()).deleteById(anyString());
    }
}
