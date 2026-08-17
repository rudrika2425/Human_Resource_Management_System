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

                // Disable CSRF because this is a stateless REST API
                .csrf(csrf -> csrf.disable())

                // Enable CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // JWT authentication = stateless
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // Authentication endpoints
                        .requestMatchers(
                                "/api/v1/auth/**"
                        ).permitAll()

                        // Swagger
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Health check
                        .requestMatchers(
                                "/actuator/health"
                        ).permitAll()

                        // IMPORTANT:
                        // Allow browser CORS preflight requests
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // Everything else requires login
                        .anyRequest().authenticated()
                )

                // Authentication provider
                .authenticationProvider(authenticationProvider())

                // JWT filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                // Keep HTTP Basic if your application needs it
                .httpBasic(Customizer.withDefaults());


        return http.build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }


    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration.getAuthenticationManager();
    }


    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }


    @Bean
public CorsConfigurationSource corsConfigurationSource() {

    CorsConfiguration configuration = new CorsConfiguration();

    /*
     * FRONTEND_URL can contain one or multiple origins separated by commas.
     *
     * Example Railway:
     * https://meticulous-courage-production-58ee.up.railway.app
     *
     * Multiple environments:
     * https://meticulous-courage-production-58ee.up.railway.app,
     * http://localhost:5173,
     * http://localhost:3000
     */
    String frontendUrl = appProperties.getFrontendUrl();

    List<String> allowedOrigins;

    if (frontendUrl != null && !frontendUrl.trim().isEmpty()) {

        allowedOrigins = List.of(
                frontendUrl
                        .replace(",", "\n")
                        .lines()
                        .map(String::trim)
                        .filter(origin -> !origin.isEmpty())
                        .map(origin -> {
                            // Remove trailing slash because CORS origins
                            // must not contain a trailing slash.
                            while (origin.endsWith("/")) {
                                origin = origin.substring(0, origin.length() - 1);
                            }
                            return origin;
                        })
                        .toList()
        );

    } else {

        /*
         * Safe fallback for local development + current Railway frontend.
         *
         * IMPORTANT:
         * In production, FRONTEND_URL should still be configured
         * in Railway Variables.
         */
        allowedOrigins = List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "https://meticulous-courage-production-58ee.up.railway.app"
        );
    }

    configuration.setAllowedOrigins(allowedOrigins);

    /*
     * Allowed HTTP methods
     */
    configuration.setAllowedMethods(
            List.of(
                    "GET",
                    "POST",
                    "PUT",
                    "PATCH",
                    "DELETE",
                    "OPTIONS"
            )
    );

    /*
     * Allowed request headers
     */
    configuration.setAllowedHeaders(
            List.of(
                    "Authorization",
                    "Content-Type",
                    "X-Requested-With",
                    "Accept",
                    "Origin"
            )
    );

    /*
     * Headers browser is allowed to read
     */
    configuration.setExposedHeaders(
            List.of(
                    "Authorization"
            )
    );

    /*
     * Required when credentials/cookies are used.
     */
    configuration.setAllowCredentials(true);

    /*
     * Browser can cache successful preflight for 1 hour.
     */
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

    source.registerCorsConfiguration(
            "/**",
            configuration
    );

    return source;
}
}