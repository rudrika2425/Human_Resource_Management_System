package com.hrms.document.storage;

import java.io.IOException;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    StoredFile upload(MultipartFile file, String folder) throws IOException;
    void delete(String publicId, String resourceType) throws IOException;

    record StoredFile(String publicId, String secureUrl, String resourceType, long size) {}
}
