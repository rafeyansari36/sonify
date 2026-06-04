package com.sonify.backend.repository;

import com.sonify.backend.model.Composition;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CompositionRepository extends MongoRepository<Composition, String> {

    List<Composition> findAllByOrderByCreatedAtDesc();
}
