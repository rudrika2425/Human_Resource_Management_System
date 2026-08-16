package com.hrms.audit.controller;

import com.hrms.audit.dto.AuditLogResponse;
import com.hrms.audit.service.AuditService;
import com.hrms.common.response.ApiResponse;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditController {

    private final AuditService auditService;

    // Constructor injection
    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ApiResponse<List<AuditLogResponse>> list() {
        return ApiResponse.success("Audit logs fetched", auditService.list());
    }
}