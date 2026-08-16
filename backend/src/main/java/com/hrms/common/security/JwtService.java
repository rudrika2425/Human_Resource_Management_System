package com.hrms.common.security;

import com.hrms.auth.entity.User;
import com.hrms.auth.entity.UserRole;
import com.hrms.common.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String DEFAULT_SECRET = "hrms-default-secret-change-me-hrms-default-secret-change-me";

    private final AppProperties appProperties;
    private final SecretKey signingKey;

    public JwtService(AppProperties appProperties) {
        this.appProperties = appProperties;
        this.signingKey = initializeSigningKey();
    }

    public String generateAccessToken(User user) {
        return buildToken(user, appProperties.getJwt().getAccessExpirationMs(), "access");
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, appProperties.getJwt().getRefreshExpirationMs(), "refresh");
    }

    public Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired: {}", e.getMessage());
            throw e;
        } catch (SignatureException e) {
            log.warn("Invalid JWT signature: {}", e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            log.warn("Malformed JWT token: {}", e.getMessage());
            throw e;
        } catch (UnsupportedJwtException e) {
            log.warn("Unsupported JWT token: {}", e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            log.warn("JWT claims string is empty: {}", e.getMessage());
            throw e;
        }
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception exception) {
            log.debug("Invalid JWT token: {}", exception.getMessage());
            return false;
        }
    }

    public boolean isRefreshToken(String token) {
        try {
            return "refresh".equalsIgnoreCase(parseClaims(token).get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isAccessToken(String token) {
        try {
            return "access".equalsIgnoreCase(parseClaims(token).get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public Long getUserId(String token) {
        try {
            return Long.parseLong(parseClaims(token).getSubject());
        } catch (Exception e) {
            log.error("Failed to extract user ID from token", e);
            return null;
        }
    }

    public String getEmail(String token) {
        try {
            return parseClaims(token).get("email", String.class);
        } catch (Exception e) {
            log.error("Failed to extract email from token", e);
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public List<String> getRoles(String token) {
        try {
            List<?> roles = parseClaims(token).get("roles", List.class);
            return roles == null ? List.of() : roles.stream().map(String::valueOf).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to extract roles from token", e);
            return List.of();
        }
    }

    public String getTokenType(String token) {
        try {
            return parseClaims(token).get("type", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            Claims claims = parseClaims(token);
            Date expiration = claims.getExpiration();
            return expiration != null && expiration.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (Exception e) {
            return true;
        }
    }

    private String buildToken(User user, long expirationMs, String type) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .claim("email", user.getEmail())
                .claim("type", type)
                .claim("roles", user.getRoles().stream()
                        .map(UserRole::name)
                        .collect(Collectors.toList()))
                .signWith(signingKey)
                .compact();
    }

    private SecretKey initializeSigningKey() {
        String secret = appProperties.getJwt().getSecret();

        if (secret == null || secret.isBlank()) {
            log.warn("JWT secret is not configured. Using default secret. This is not recommended for production!");
            return Keys.hmacShaKeyFor(DEFAULT_SECRET.getBytes(StandardCharsets.UTF_8));
        }

        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        
        // Ensure key is at least 32 bytes (256 bits) for HS256
        if (keyBytes.length < 32) {
            log.warn("JWT secret is too short ({} bytes). Minimum recommended is 32 bytes.", keyBytes.length);
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, padded.length));
            return Keys.hmacShaKeyFor(padded);
        }

        return Keys.hmacShaKeyFor(keyBytes);
    }

    private SecretKey signingKey() {
        return signingKey;
    }
}