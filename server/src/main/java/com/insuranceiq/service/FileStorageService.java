package com.insuranceiq.service;

import com.insuranceiq.model.ClaimDocument;
import com.insuranceiq.model.Claim;
import com.insuranceiq.exception.ResourceNotFoundException;
import com.insuranceiq.repository.ClaimDocumentRepository;
import com.insuranceiq.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

    private final ClaimDocumentRepository documentRepository;
    private final ClaimRepository claimRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public ClaimDocument uploadClaimDocument(String claimId, MultipartFile file, String docType) throws IOException {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found: " + claimId));

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir, "claims", claimId);
        Files.createDirectories(uploadPath);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
        String storedFilename = UUID.randomUUID() + extension;

        // Save file
        Path filePath = uploadPath.resolve(storedFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // In production, this would be an S3 URL
        String fileUrl = "/uploads/claims/" + claimId + "/" + storedFilename;

        // Save document metadata
        ClaimDocument document = ClaimDocument.builder()
                .claim(claim)
                .docType(docType != null ? docType : "general")
                .s3Url(fileUrl)
                .uploadedAt(LocalDateTime.now())
                .build();

        return documentRepository.save(document);
    }
}
