package com.hrms.auth.repository;

import com.hrms.auth.entity.RefreshToken;
import com.hrms.auth.entity.User;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHashAndRevokedAtIsNull(String tokenHash);
    List<RefreshToken> findByUserAndRevokedAtIsNull(User user);
    long deleteByExpiresAtBefore(Instant before);
    Optional<RefreshToken> findByTokenHash(String tokenHash);
}
