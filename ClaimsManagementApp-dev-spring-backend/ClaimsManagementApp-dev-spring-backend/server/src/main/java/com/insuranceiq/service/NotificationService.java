package com.insuranceiq.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class NotificationService {

    @Value("${app.notification-service.url}")
    private String notificationServiceUrl;

    @Value("${app.service-secret:InsuranceIQInternalServiceSecret2024}")
    private String serviceSecret;

    private static final RestTemplate restTemplate = new RestTemplate();

    /**
     * Sends a notification event via the Node.js Socket.IO notification service.
     * Uses the /api/notifications/emit endpoint with service authentication.
     * If the server is unavailable, logs the event and continues silently.
     *
     * @param userId The target user ID
     * @param title Notification title
     * @param message Notification message  
     * @param eventType Event type identifier
     */
    public void sendToUser(Integer userId, String title, String message, String eventType) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", userId);
            payload.put("title", title);
            payload.put("message", message);
            payload.put("eventType", eventType);

            sendNotification("/api/notifications/emit", payload);
            log.info("[NOTIFICATION] ✅ Sent to user {} — [{}] {}", userId, eventType, title);
        } catch (Exception e) {
            log.debug("[NOTIFICATION] ⚠️  Service unavailable, skipping event [{}]: {}", eventType, e.getMessage());
        }
    }

    /**
     * Broadcasts a notification to all users with a specific role.
     *
     * @param role Target role (ADMIN, AGENT, CUSTOMER, CLAIMS_MANAGER)
     * @param title Notification title
     * @param message Notification message
     * @param eventType Event type identifier
     */
    public void sendToRole(String role, String title, String message, String eventType) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("role", role);
            payload.put("title", title);
            payload.put("message", message);
            payload.put("eventType", eventType);

            sendNotification("/api/notifications/emit", payload);
            log.info("[NOTIFICATION] ✅ Broadcast to role {} — [{}] {}", role, eventType, title);
        } catch (Exception e) {
            log.debug("[NOTIFICATION] ⚠️  Service unavailable, skipping event [{}]: {}", eventType, e.getMessage());
        }
    }

    /**
     * Sends an internal event to the notification service.
     * Used for domain-specific events (claim-filed, fraud-alert, etc.)
     *
     * @param endpoint Event endpoint (e.g., /internal/events/claim-filed)
     * @param payload Event payload
     */
    public void sendInternalEvent(String endpoint, Map<String, Object> payload) {
        try {
            sendNotification(endpoint, payload);
            log.info("[NOTIFICATION] ✅ Internal event sent to {}", endpoint);
        } catch (Exception e) {
            log.debug("[NOTIFICATION] ⚠️  Service unavailable, skipping event: {}", e.getMessage());
        }
    }

    /**
     * Legacy method for backward compatibility
     * Use sendToUser() or sendToRole() instead
     */
    public void sendEvent(String eventType, String message) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", eventType);
            payload.put("message", message);
            payload.put("timestamp", System.currentTimeMillis());

            sendNotification("/api/notifications/emit", payload);
            log.info("[NOTIFICATION] 📨 Event: [{}] {}", eventType, message);
        } catch (Exception e) {
            log.debug("[NOTIFICATION] ⚠️  Service unavailable: {}", e.getMessage());
        }
    }

    /**
     * Internal helper to send HTTP request to notification service
     */
    private void sendNotification(String endpoint, Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("X-Service-Secret", serviceSecret);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        restTemplate.postForObject(notificationServiceUrl + endpoint, entity, String.class);
    }
}
