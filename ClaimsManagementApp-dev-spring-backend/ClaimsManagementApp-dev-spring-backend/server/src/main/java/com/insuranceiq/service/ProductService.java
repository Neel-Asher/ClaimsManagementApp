package com.insuranceiq.service;

import com.insuranceiq.dto.ProductRequest;
import com.insuranceiq.dto.ProductResponse;
import com.insuranceiq.exception.ResourceNotFoundException;
import com.insuranceiq.model.InsuranceProduct;
import com.insuranceiq.model.enums.ProductType;
import com.insuranceiq.repository.InsuranceProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final InsuranceProductRepository productRepository;

    public List<ProductResponse> getAll() {
        return productRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProductResponse getById(Long id) {
        InsuranceProduct product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        return toResponse(product);
    }

    public ProductResponse create(ProductRequest request) {
        InsuranceProduct product = new InsuranceProduct();
        mapRequestToEntity(request, product);
        product = productRepository.save(product);
        return toResponse(product);
    }

    public ProductResponse update(Long id, ProductRequest request) {
        InsuranceProduct product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        mapRequestToEntity(request, product);
        product = productRepository.save(product);
        return toResponse(product);
    }

    private void mapRequestToEntity(ProductRequest request, InsuranceProduct product) {
        product.setName(request.getName());
        if (request.getType() != null) {
            product.setType(ProductType.fromValue(request.getType()));
        }
        product.setCoverageAmount(request.getCoverageAmount());
        product.setPremiumRate(request.getPremiumRate());
        product.setTermMonths(request.getTermMonths());
    }

    private ProductResponse toResponse(InsuranceProduct p) {
        return ProductResponse.builder()
                .productId(p.getProductId())
                .name(p.getName())
                .type(p.getType() != null ? p.getType().toValue() : null)
                .coverageAmount(p.getCoverageAmount())
                .premiumRate(p.getPremiumRate())
                .termMonths(p.getTermMonths())
                .build();
    }
}
