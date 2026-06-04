package com.sonify.backend.dto;

import com.sonify.backend.model.DimensionMapping;
import com.sonify.backend.model.MusicalScale;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCompositionRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Filename is required")
    private String filename;

    @Min(value = 40, message = "BPM must be at least 40")
    @Max(value = 240, message = "BPM cannot exceed 240")
    private int bpm;

    @NotNull(message = "Scale is required")
    private MusicalScale scale;

    @NotNull(message = "Mappings are required")
    private List<DimensionMapping> mappings;

    @NotNull(message = "Columns are required")
    private List<ColumnInfo> columns;

    @NotNull(message = "Data points are required")
    private List<Map<String, String>> dataPoints;
}
