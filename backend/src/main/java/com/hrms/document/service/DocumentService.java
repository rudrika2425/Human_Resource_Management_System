package com.hrms.document.service;

import com.hrms.auth.entity.UserRole;
import com.hrms.common.exception.ConflictException;
import com.hrms.common.exception.NotFoundException;
import com.hrms.common.security.UserPrincipal;
import com.hrms.document.dto.DocumentResponse;
import com.hrms.document.entity.DocumentCategory;
import com.hrms.document.entity.DocumentMetadata;
import com.hrms.document.repository.DocumentRepository;
import com.hrms.document.storage.FileStorageService;
import com.hrms.employee.entity.Employee;
import com.hrms.employee.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class DocumentService {

    private static final long MAX_SIZE_BYTES = 10L * 1024L * 1024L;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf",
            "png",
            "jpg",
            "jpeg",
            "doc",
            "docx"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final EmployeeRepository employeeRepository;

    public DocumentService(
            DocumentRepository documentRepository,
            FileStorageService fileStorageService,
            EmployeeRepository employeeRepository) {

        this.documentRepository = documentRepository;
        this.fileStorageService = fileStorageService;
        this.employeeRepository = employeeRepository;
    }

    
    
    

    public DocumentResponse upload(
            Long employeeId,
            UserPrincipal principal,
            DocumentCategory category,
            MultipartFile file) {

        validateFile(file);

        UserRole role = getRole(principal);

        Employee targetEmployee;

        
        
        
        if (role == UserRole.HR) {

            /*
             * HR can upload documents for any employee.
             *
             * employeeId is REQUIRED for HR.
             */
            if (employeeId == null) {
                throw new ConflictException("Employee is required");
            }

            targetEmployee = findEmployee(employeeId);
        }

        
        
        
        else if (role == UserRole.MANAGER) {

            /*
             * Manager can ONLY upload their own documents.
             *
             * Any employeeId coming from frontend is ignored.
             */
            targetEmployee = getEmployeeFromPrincipal(principal);
        }

        
        
        
        else if (role == UserRole.EMPLOYEE) {

            /*
             * Employee can ONLY upload their own documents.
             *
             * Any employeeId coming from frontend is ignored.
             */
            targetEmployee = getEmployeeFromPrincipal(principal);
        }

        
        
        
        else {
            throw new ConflictException(
                    "You are not authorized to upload documents"
            );
        }

        try {

            FileStorageService.StoredFile storedFile =
                    fileStorageService.upload(
                            file,
                            "hrms/" + category.name().toLowerCase()
                    );

            DocumentMetadata metadata = new DocumentMetadata();

            metadata.setEmployee(targetEmployee);
            metadata.setOriginalFilename(file.getOriginalFilename());
            metadata.setDocumentType(category.name());
            metadata.setCategory(category);
            metadata.setPublicId(storedFile.publicId());
            metadata.setSecureUrl(storedFile.secureUrl());
            metadata.setResourceType(storedFile.resourceType());
            metadata.setFileSize(storedFile.size());
            metadata.setUploadedByUserId(principal.getId());

            DocumentMetadata savedMetadata =
                    documentRepository.save(metadata);

            return toResponse(savedMetadata);

        } catch (IOException exception) {

            throw new ConflictException(
                    "Failed to upload file"
            );
        }
    }

    
    
    

    @Transactional(readOnly = true)
    public List<DocumentResponse> list(
            Long employeeId,
            UserPrincipal principal) {

        UserRole role = getRole(principal);

        List<DocumentMetadata> documents;

        
        
        
        if (role == UserRole.HR) {

            /*
             * HR behavior remains unchanged.
             *
             * GET /documents
             * -> all documents
             *
             * GET /documents?employeeId=5
             * -> documents for employee 5
             */

            if (employeeId == null) {

                documents =
                        documentRepository
                                .findAllByOrderByCreatedAtDesc();

            } else {

                findEmployee(employeeId);

                documents =
                        documentRepository
                                .findByEmployee_IdOrderByCreatedAtDesc(
                                        employeeId
                                );
            }
        }

        
        
        
        else if (role == UserRole.MANAGER) {

            /*
             * Manager can ONLY see their own documents.
             *
             * employeeId from frontend is completely ignored.
             *
             * This is important because the frontend may still send:
             *
             * /api/v1/documents?employeeId=5
             *
             * but the backend will NOT use employeeId=5.
             */
            Employee loggedInEmployee =
                    getEmployeeFromPrincipal(principal);

            documents =
                    documentRepository
                            .findByEmployee_IdOrderByCreatedAtDesc(
                                    loggedInEmployee.getId()
                            );
        }

        
        
        
        else if (role == UserRole.EMPLOYEE) {

            /*
             * Employee can ONLY see their own documents.
             *
             * employeeId from frontend is ignored.
             */
            Employee loggedInEmployee =
                    getEmployeeFromPrincipal(principal);

            documents =
                    documentRepository
                            .findByEmployee_IdOrderByCreatedAtDesc(
                                    loggedInEmployee.getId()
                            );
        }

        
        
        
        else {

            throw new ConflictException(
                    "You are not authorized to view documents"
            );
        }

        return documents
                .stream()
                .map(this::toResponse)
                .toList();
    }

    
    
    

    public void delete(Long documentId) {

        DocumentMetadata metadata =
                documentRepository
                        .findById(documentId)
                        .orElseThrow(
                                () -> new NotFoundException(
                                        "Document not found"
                                )
                        );

        try {

            /*
             * Delete file from storage first.
             */
            fileStorageService.delete(
                    metadata.getPublicId(),
                    metadata.getResourceType()
            );

            /*
             * Then delete DB record.
             */
            documentRepository.delete(metadata);

        } catch (IOException exception) {

            throw new ConflictException(
                    "Failed to delete file"
            );
        }
    }

    
    
    

    /**
     * Finds the Employee record associated with the
     * currently authenticated User.
     *
     * users.id -> employees.user_id
     *
     * This is used for MANAGER and EMPLOYEE.
     *
     * HR does not use this method because an HR user
     * may not have an Employee profile.
     */
    private Employee getEmployeeFromPrincipal(
            UserPrincipal principal) {

        if (principal == null) {

            throw new ConflictException(
                    "Authenticated user not found"
            );
        }

        if (principal.getId() == null) {

            throw new ConflictException(
                    "Authenticated user ID not found"
            );
        }

        return employeeRepository
                .findByUser_Id(principal.getId())
                .orElseThrow(
                        () -> new NotFoundException(
                                "Employee profile not found"
                        )
                );
    }

    
    
    

    /**
     * Gets the highest-priority HRMS role from the
     * authenticated user.
     *
     * Priority:
     *
     * HR
     * MANAGER
     * EMPLOYEE
     */
    private UserRole getRole(
            UserPrincipal principal) {

        if (principal == null) {

            throw new ConflictException(
                    "Authenticated user not found"
            );
        }

        if (principal.getUser() == null) {

            throw new ConflictException(
                    "Authenticated user details not found"
            );
        }

        if (principal.getUser()
                .getRoles()
                .contains(UserRole.HR)) {

            return UserRole.HR;
        }

        if (principal.getUser()
                .getRoles()
                .contains(UserRole.MANAGER)) {

            return UserRole.MANAGER;
        }

        if (principal.getUser()
                .getRoles()
                .contains(UserRole.EMPLOYEE)) {

            return UserRole.EMPLOYEE;
        }

        throw new ConflictException(
                "User does not have a valid HRMS role"
        );
    }

    
    
    

    /**
     * Finds an employee using employees.id.
     *
     * This is mainly used by HR because HR can
     * manage documents for any employee.
     */
    private Employee findEmployee(Long id) {

        if (id == null) {

            throw new ConflictException(
                    "Employee ID is required"
            );
        }

        return employeeRepository
                .findById(id)
                .orElseThrow(
                        () -> new NotFoundException(
                                "Employee not found"
                        )
                );
    }

    
    
    

    private void validateFile(
            MultipartFile file) {

        if (file == null || file.isEmpty()) {

            throw new ConflictException(
                    "File is required"
            );
        }

        if (file.getSize() > MAX_SIZE_BYTES) {

            throw new ConflictException(
                    "File size exceeds 10MB"
            );
        }

        String originalFilename =
                file.getOriginalFilename() == null
                        ? ""
                        : file.getOriginalFilename();

        String extension =
                originalFilename.contains(".")
                        ? originalFilename
                        .substring(
                                originalFilename
                                        .lastIndexOf('.') + 1
                        )
                        .toLowerCase()
                        : "";

        if (!ALLOWED_EXTENSIONS.contains(extension)) {

            throw new ConflictException(
                    "Unsupported file extension"
            );
        }

        String contentType =
                file.getContentType();

        if (contentType == null ||
                !ALLOWED_MIME_TYPES.contains(
                        contentType)) {

            throw new ConflictException(
                    "Unsupported file type"
            );
        }
    }

    
    
    

    private DocumentResponse toResponse(
            DocumentMetadata metadata) {

        return new DocumentResponse(
                metadata.getId(),

                metadata.getEmployee() == null
                        ? null
                        : metadata.getEmployee().getId(),

                metadata.getOriginalFilename(),

                metadata.getDocumentType(),

                metadata.getCategory(),

                metadata.getPublicId(),

                metadata.getSecureUrl(),

                metadata.getResourceType(),

                metadata.getFileSize(),

                metadata.getUploadedByUserId(),

                metadata.getCreatedAt(),

                metadata.getUpdatedAt()
        );
    }
}