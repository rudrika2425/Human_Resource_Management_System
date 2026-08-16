package com.hrms.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.hrms.auth.entity.User;
import com.hrms.auth.entity.UserRole;
import com.hrms.common.config.AppProperties;
import java.util.Set;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    @Test
    void generatesAndValidatesAccessToken() {
        AppProperties properties = new AppProperties();
        AppProperties.Jwt jwt = new AppProperties.Jwt();
        jwt.setSecret("01234567890123456789012345678901");
        jwt.setAccessExpirationMs(60000);
        jwt.setRefreshExpirationMs(120000);
        properties.getJwt().setSecret(jwt.getSecret());
        properties.getJwt().setAccessExpirationMs(jwt.getAccessExpirationMs());
        properties.getJwt().setRefreshExpirationMs(jwt.getRefreshExpirationMs());
        JwtService jwtService = new JwtService(properties);
        User user = User.builder().email("admin@hrms.local").password("x").firstName("Admin").lastName("User").active(true).roles(Set.of(UserRole.HR)).build();
        user.setId(1L);

        String token = jwtService.generateAccessToken(user);

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.isAccessToken(token)).isTrue();
        assertThat(jwtService.getEmail(token)).isEqualTo("hr@hrms.local");
    }
}
