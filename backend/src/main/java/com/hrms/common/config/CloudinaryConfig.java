package com.hrms.common.config;
import java.util.Map;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryConfig.class);

    @Bean
    public Cloudinary cloudinary(AppProperties appProperties) {
        AppProperties.Cloudinary cloudinaryProps = appProperties.getCloudinary();
        
        // Validate configuration
        if (cloudinaryProps.getCloudName() == null || cloudinaryProps.getCloudName().isEmpty()) {
            log.warn("Cloudinary cloud name is not configured");
        }
        if (cloudinaryProps.getApiKey() == null || cloudinaryProps.getApiKey().isEmpty()) {
            log.warn("Cloudinary API key is not configured");
        }
        if (cloudinaryProps.getApiSecret() == null || cloudinaryProps.getApiSecret().isEmpty()) {
            log.warn("Cloudinary API secret is not configured");
        }

        // Using ObjectUtils.asMap for cleaner configuration
        Map<String, Object> config = ObjectUtils.asMap(
                "cloud_name", cloudinaryProps.getCloudName(),
                "api_key", cloudinaryProps.getApiKey(),
                "api_secret", cloudinaryProps.getApiSecret(),
                "secure", true
        );

        log.info("Cloudinary configured successfully for cloud: {}", cloudinaryProps.getCloudName());
        return new Cloudinary(config);
    }
}