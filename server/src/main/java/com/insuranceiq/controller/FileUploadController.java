package com.insuranceiq.controller;

import com.insuranceiq.model.ClaimDocument;
import com.insuranceiq.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File Upload", description = "Document upload endpoints")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload/claim/{claimId}")
    @Operation(summary = "Upload a document for a claim")
    public ResponseEntity<Map<String, Object>> uploadClaimDocument(
            @PathVariable String claimId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "doc_type", required = false, defaultValue = "general") String docType
    ) throws IOException {
        ClaimDocument doc = fileStorageService.uploadClaimDocument(claimId, file, docType);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("doc_id", doc.getDocId());
        response.put("claim_id", claimId);
        response.put("doc_type", doc.getDocType());
        response.put("s3_url", doc.getS3Url());
        response.put("uploaded_at", doc.getUploadedAt().toString());
        response.put("message", "Document uploaded successfully");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
