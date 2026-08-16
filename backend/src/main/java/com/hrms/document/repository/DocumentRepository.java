package com.hrms.document.repository;

import com.hrms.document.entity.DocumentMetadata;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<DocumentMetadata, Long> {
    List<DocumentMetadata> findByEmployee_IdOrderByCreatedAtDesc(Long employeeId);
    

    List<DocumentMetadata> findByEmployee_Manager_IdOrderByCreatedAtDesc(
            Long managerId
    );

    List<DocumentMetadata> findAllByOrderByCreatedAtDesc();
}
