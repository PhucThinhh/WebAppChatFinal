package com.chatapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(parseAllowedOrigins())
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(
                            org.springframework.http.server.ServerHttpRequest request,
                            org.springframework.web.socket.WebSocketHandler wsHandler,
                            java.util.Map<String, Object> attributes) {

                        String query = request.getURI().getQuery();
                        String userId = "anonymous";

                        if (query != null) {
                            for (String param : query.split("&")) {
                                String[] kv = param.split("=");
                                if (kv.length == 2 && kv[0].equals("userId")) {
                                    userId = kv[1].trim();
                                }
                            }
                        }

                        String finalUserId = userId;

                        return () -> finalUserId;
                    }
                })
                .withSockJS();
    }

    private String[] parseAllowedOrigins() {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);

        if (origins.length == 0) {
            return new String[] {
                    "http://localhost:5173",
                    "http://binchat.me",
                    "http://www.binchat.me",
                    "https://web-app-chat-final.vercel.app",
                    "https://*.vercel.app"
            };
        }

        return origins;
    }
}
