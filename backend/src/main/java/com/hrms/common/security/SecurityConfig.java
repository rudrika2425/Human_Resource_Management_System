package com.hrms.common.security;

import java.util.List;

import com.hrms.common.config.AppProperties;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final AppProperties appProperties;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomUserDetailsService userDetailsService,
            AppProperties appProperties
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.appProperties = appProperties;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // -------------------------------------------------
                // CSRF
                // -------------------------------------------------
                .csrf(csrf -> csrf.disable())

                // -------------------------------------------------
                // CORS
                // -------------------------------------------------
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // -------------------------------------------------
                // Stateless JWT authentication
                // -------------------------------------------------
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // -------------------------------------------------
                // Authorization
                // -------------------------------------------------
                .authorizeHttpRequests(auth -> auth

                        // CORS preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // -------------------------------------------------
                        // PUBLIC AUTH ENDPOINTS
                        // -------------------------------------------------

                        // Login
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/auth/login"
                        ).permitAll()

                        // Register
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/auth/register"
                        ).permitAll()

                        // Refresh token
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/auth/refresh"
                        ).permitAll()

                        // Logout
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/auth/logout"
                        ).permitAll()

                        // Forgot password
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/auth/forgot-password"
                        ).permitAll()

                        // Reset password
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/auth/reset-password"
                        ).permitAll()

                        // -------------------------------------------------
                        // Swagger
                        // -------------------------------------------------
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // -------------------------------------------------
                        // Health
                        // -------------------------------------------------
                        .requestMatchers(
                                "/actuator/health"
                        ).permitAll()

                        // -------------------------------------------------
                        // EVERYTHING ELSE
                        // -------------------------------------------------
                        .anyRequest().authenticated()
                )

                // -------------------------------------------------
                // Authentication provider
                // -------------------------------------------------
                .authenticationProvider(authenticationProvider())

                // -------------------------------------------------
                // JWT filter
                // -------------------------------------------------
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                // -------------------------------------------------
                // HTTP Basic
                // -------------------------------------------------
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    // =============================================================
    // PASSWORD ENCODER
    // =============================================================

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // =============================================================
    // AUTHENTICATION MANAGER
    // =============================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }

    // =============================================================
    // DAO AUTHENTICATION PROVIDER
    // =============================================================

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    // =============================================================
    // CORS
    // =============================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        // ---------------------------------------------------------
        // FRONTEND ORIGINS
        // ---------------------------------------------------------

        configuration.setAllowedOrigins(List.of(
                "https://meticulous-courage-production-58ee.up.railway.app",
                "http://localhost:5173",
                "http://localhost:3000"
        ));

        // ---------------------------------------------------------
        // METHODS
        // ---------------------------------------------------------

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        // ---------------------------------------------------------
        // HEADERS
        // ---------------------------------------------------------

        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"
        ));

        // ---------------------------------------------------------
        // EXPOSED HEADERS
        // ---------------------------------------------------------

        configuration.setExposedHeaders(List.of(
                "Authorization"
        ));

        // ---------------------------------------------------------
        // CREDENTIALS
        // ---------------------------------------------------------

        configuration.setAllowCredentials(true);

        // ---------------------------------------------------------
        // PREFLIGHT CACHE
        // ---------------------------------------------------------

        configuration.setMaxAge(3600L);

        // ---------------------------------------------------------
        // REGISTER CORS CONFIG
        // ---------------------------------------------------------

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}