package com.sonify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ColumnInfo {
    private String name;
    private ColumnType type;
    private Double min;
    private Double max;
    private List<String> uniqueValues;
    private List<String> sampleValues;
}
