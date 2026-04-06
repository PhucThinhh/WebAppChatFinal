package com.chatapp.config;

import com.chatapp.entity.Role;
import com.chatapp.entity.User;
import com.chatapp.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner init(UserRepository userRepository, PasswordEncoder encoder) {
        return args -> {
            if (userRepository.findByPhone("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPhone("admin");
                admin.setPassword(encoder.encode("admin123"));
                admin.setEmail("admin@admin.com");
                admin.setRole(Role.ADMIN);

                userRepository.save(admin);
            }
        };
    }
}