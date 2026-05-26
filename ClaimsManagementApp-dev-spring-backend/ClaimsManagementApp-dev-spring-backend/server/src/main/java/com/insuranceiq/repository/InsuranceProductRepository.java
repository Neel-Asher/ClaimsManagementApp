package com.insuranceiq.repository;

import com.insuranceiq.model.InsuranceProduct;
import com.insuranceiq.model.enums.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InsuranceProductRepository extends JpaRepository<InsuranceProduct, Long> {
    List<InsuranceProduct> findByType(ProductType type);
}
