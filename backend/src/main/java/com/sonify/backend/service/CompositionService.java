package com.sonify.backend.service;

import com.sonify.backend.dto.CreateCompositionRequest;
import com.sonify.backend.model.Composition;
import com.sonify.backend.repository.CompositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompositionService {

    private final CompositionRepository repository;

    public Composition create(CreateCompositionRequest request) {
        Composition composition = Composition.builder()
                .name(request.getName())
                .filename(request.getFilename())
                .bpm(request.getBpm())
                .scale(request.getScale())
                .mappings(request.getMappings())
                .columns(request.getColumns())
                .dataPoints(request.getDataPoints())
                .createdAt(Instant.now())
                .build();

        return repository.save(composition);
    }

    public List<Composition> listAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public Composition getById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Composition not found: " + id));
    }

    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Composition not found: " + id);
        }
        repository.deleteById(id);
    }
}
