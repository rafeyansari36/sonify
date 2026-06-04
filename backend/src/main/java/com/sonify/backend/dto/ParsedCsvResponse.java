package com.sonify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedCsvResponse {
    private String filename;
    private int totalRows;
    private List<ColumnInfo> columns;
    private List<Map<String, String>> dataPoints;
}
