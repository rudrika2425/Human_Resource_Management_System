package com.hrms.common.exception;

import org.springframework.http.HttpStatus;

public class UnprocessableEntityException extends ApiException {
    public UnprocessableEntityException(String message) {
        super(message, "UNPROCESSABLE_ENTITY", HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
