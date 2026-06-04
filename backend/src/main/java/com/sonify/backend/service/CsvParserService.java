package com.sonify.backend.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import com.sonify.backend.dto.ColumnInfo;
import com.sonify.backend.dto.ColumnType;
import com.sonify.backend.dto.ParsedCsvResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class CsvParserService {

    private static final int MAX_UNIQUE_FOR_CATEGORICAL = 50;

    public ParsedCsvResponse parse(MultipartFile file) throws IOException, CsvException {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVReader csvReader = new CSVReader(reader)) {

            List<String[]> allRows = csvReader.readAll();

            if (allRows.isEmpty()) {
                throw new IllegalArgumentException("CSV file is empty");
            }

            String[] headers = allRows.get(0);
            List<String[]> dataRows = allRows.subList(1, allRows.size());

            List<ColumnInfo> columns = analyzeColumns(headers, dataRows);
            List<Map<String, String>> dataPoints = buildDataPoints(headers, dataRows);

            return ParsedCsvResponse.builder()
                    .filename(file.getOriginalFilename())
                    .totalRows(dataRows.size())
                    .columns(columns)
                    .dataPoints(dataPoints)
                    .build();
        }
    }

    private List<ColumnInfo> analyzeColumns(String[] headers, List<String[]> dataRows) {
        List<ColumnInfo> result = new ArrayList<>();

        for (int colIdx = 0; colIdx < headers.length; colIdx++) {
            String columnName = headers[colIdx];
            List<String> columnValues = new ArrayList<>();

            for (String[] row : dataRows) {
                if (colIdx < row.length) {
                    columnValues.add(row[colIdx]);
                }
            }

            result.add(analyzeColumn(columnName, columnValues));
        }
        return result;
    }

    private ColumnInfo analyzeColumn(String name, List<String> values) {
        boolean allNumeric = values.stream()
                .filter(v -> v != null && !v.isBlank())
                .allMatch(this::isNumeric);

        if (allNumeric && !values.isEmpty()) {
            DoubleSummaryStatistics stats = values.stream()
                    .filter(v -> v != null && !v.isBlank())
                    .mapToDouble(Double::parseDouble)
                    .summaryStatistics();

            return ColumnInfo.builder()
                    .name(name)
                    .type(ColumnType.NUMERIC)
                    .min(stats.getMin())
                    .max(stats.getMax())
                    .sampleValues(values.stream().limit(5).toList())
                    .build();
        } else {
            List<String> unique = values.stream()
                    .filter(v -> v != null && !v.isBlank())
                    .distinct()
                    .limit(MAX_UNIQUE_FOR_CATEGORICAL)
                    .toList();

            return ColumnInfo.builder()
                    .name(name)
                    .type(ColumnType.CATEGORICAL)
                    .uniqueValues(unique)
                    .sampleValues(values.stream().limit(5).toList())
                    .build();
        }
    }

    private boolean isNumeric(String value) {
        try {
            Double.parseDouble(value);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private List<Map<String, String>> buildDataPoints(String[] headers, List<String[]> dataRows) {
        List<Map<String, String>> result = new ArrayList<>();
        for (String[] row : dataRows) {
            Map<String, String> rowMap = new LinkedHashMap<>();
            for (int c = 0; c < headers.length; c++) {
                rowMap.put(headers[c], c < row.length ? row[c] : "");
            }
            result.add(rowMap);
        }
        return result;
    }
}
