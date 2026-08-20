package com.hrms.common.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.SendEmailRequest;
import com.resend.services.emails.model.SendEmailResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {

    private static final Logger logger =
            LoggerFactory.getLogger(EmailService.class);

    private final TemplateEngine templateEngine;
    private final Resend resend;

    @Value("${RESEND_FROM_EMAIL}")
private String fromEmail;

    @Value("${app.email.subject-prefix}")
    private String subjectPrefix;

    @Value("${app.reset-password.frontend-url}")
    private String resetPasswordUrl;

    public EmailService(
            TemplateEngine templateEngine,
            @Value("${RESEND_API_KEY}") String resendApiKey
    ) {
        this.templateEngine = templateEngine;
        this.resend = new Resend(resendApiKey);
    }

    public void sendPasswordResetEmail(
            String to,
            String token,
            String name
    ) {

        try {

            String resetLink =
                    resetPasswordUrl + "?token=" + token;

            Context context = new Context();

            context.setVariable("name", name);
            context.setVariable("resetLink", resetLink);
            context.setVariable("expiryMinutes", 15);

            String htmlContent =
                    templateEngine.process(
                            "password-reset-email",
                            context
                    );

            SendEmailRequest request =
                    SendEmailRequest.builder()
                            .from(fromEmail)
                            .to(to)
                            .subject(
                                    subjectPrefix +
                                    " - Password Reset Request"
                            )
                            .html(htmlContent)
                            .build();

            SendEmailResponse response =
                    resend.emails().send(request);

            logger.info(
                    "Password reset email sent successfully to {}. Email ID: {}",
                    to,
                    response.getId()
            );

        } catch (ResendException e) {

            logger.error(
                    "Failed to send password reset email to {}",
                    to,
                    e
            );

            throw new RuntimeException(
                    "Failed to send password reset email",
                    e
            );
        }
    }
}