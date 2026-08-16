package com.hrms.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String frontendUrl;
    private final Jwt jwt = new Jwt();
    private final Cloudinary cloudinary = new Cloudinary();

    // Default constructor
    public AppProperties() {
    }

    // Getters and Setters for frontendUrl
    public String getFrontendUrl() {
        return frontendUrl;
    }

    public void setFrontendUrl(String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    // Getter for jwt
    public Jwt getJwt() {
        return jwt;
    }

    // Getter for cloudinary
    public Cloudinary getCloudinary() {
        return cloudinary;
    }

    // Jwt inner class
    public static class Jwt {
        private String secret;
        private long accessExpirationMs;
        private long refreshExpirationMs;

        // Default constructor
        public Jwt() {
        }

        // Getters and Setters
        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public long getAccessExpirationMs() {
            return accessExpirationMs;
        }

        public void setAccessExpirationMs(long accessExpirationMs) {
            this.accessExpirationMs = accessExpirationMs;
        }

        public long getRefreshExpirationMs() {
            return refreshExpirationMs;
        }

        public void setRefreshExpirationMs(long refreshExpirationMs) {
            this.refreshExpirationMs = refreshExpirationMs;
        }
    }

    // Cloudinary inner class
    public static class Cloudinary {
        private String cloudName;
        private String apiKey;
        private String apiSecret;

        // Default constructor
        public Cloudinary() {
        }

        // Getters and Setters
        public String getCloudName() {
            return cloudName;
        }

        public void setCloudName(String cloudName) {
            this.cloudName = cloudName;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getApiSecret() {
            return apiSecret;
        }

        public void setApiSecret(String apiSecret) {
            this.apiSecret = apiSecret;
        }
    }
}