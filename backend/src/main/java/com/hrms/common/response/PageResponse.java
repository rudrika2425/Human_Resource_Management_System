package com.hrms.common.response;

import java.util.List;

public record PageResponse<T>(
        boolean success,
        String message,
        List<T> data,
        long page,
        long size,
        long totalElements,
        long totalPages,
        boolean last) {

    public static <T> PageResponse<T> of(String message, List<T> data, long page, long size, long totalElements, long totalPages, boolean last) {
        return new PageResponse<>(true, message, data, page, size, totalElements, totalPages, last);
    }
}
