package com.sliit.tg.service;

import com.sliit.tg.dto.IndicatorRequest;
import com.sliit.tg.dto.IndicatorResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class IndicatorService {

    private final String indicatorApiUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    public IndicatorService(
            @Value("${app.indicator.api-url:http://127.0.0.1:8002/predict}") String indicatorApiUrl
    ) {
        this.indicatorApiUrl = indicatorApiUrl;
    }

    public IndicatorResponse detectIndicator(String text) {
        try {
            IndicatorRequest requestBody = new IndicatorRequest(text);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<IndicatorRequest> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<IndicatorResponse> response = restTemplate.exchange(
                    indicatorApiUrl,
                    HttpMethod.POST,
                    request,
                    IndicatorResponse.class
            );

            return response.getBody();
        } catch (Exception e) {
            IndicatorResponse fallback = new IndicatorResponse();
            fallback.setLabel("unknown");
            fallback.setConfidence(0.0);
            return fallback;
        }
    }
}
