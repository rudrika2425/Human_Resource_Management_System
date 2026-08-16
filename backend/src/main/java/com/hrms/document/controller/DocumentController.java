package com.hrms.document.controller;

import com.hrms.common.response.ApiResponse;
import com.hrms.common.security.UserPrincipal;
import com.hrms.document.dto.DocumentResponse;
import com.hrms.document.entity.DocumentCategory;
import com.hrms.document.service.DocumentService;
import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private final DocumentService documentService;

    
    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostConstruct
    public void testControllerLoaded() {
        System.out.println("======================================");
        System.out.println("DOCUMENT CONTROLLER LOADED");
        System.out.println("======================================");
    }

    @GetMapping("/test")
    public String testDocumentEndpoint() {
        return "DOCUMENT ENDPOINT WORKS";
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<DocumentResponse> upload(
            @RequestParam(required = false) Long employeeId,
            @RequestParam @NotNull DocumentCategory category,
            @RequestParam MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ApiResponse.success(
                "Document uploaded",
                documentService.upload(
                        employeeId,
                        principal,
                        category,
                        file
                )
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
    public ApiResponse<List<DocumentResponse>> list(
            @RequestParam(required = false) Long employeeId,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ApiResponse.success(
                "Documents fetched",
                documentService.list(
                        employeeId,
                        principal
                )
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ApiResponse<String> delete(@PathVariable Long id) {
        documentService.delete(id);
        return ApiResponse.success("Document deleted", "success");
    }
}