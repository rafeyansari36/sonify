package com.sonify.backend.model;

import com.sonify.backend.dto.ColumnInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "compositions")
public class Composition {

    @Id
    private String id;

    private String name;
    private String filename;
    private Instant createdAt;
    private int bpm;
    private MusicalScale scale;
    private List<DimensionMapping> mappings;
    private List<ColumnInfo> columns;
    private List<Map<String, String>> dataPoints;
}
