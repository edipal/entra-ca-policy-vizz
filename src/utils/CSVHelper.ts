import Papa from 'papaparse';

export const DEFAULT_CSV_DELIMITER = ';'

export interface CSVParseOptions {
  delimiter?: string
}

// Utility to parse a delimited CSV string into an array of row objects using PapaParse
export function parseCSV(csvString: string, options?: CSVParseOptions): Record<string, string>[] {
  const delimiter = options?.delimiter ?? DEFAULT_CSV_DELIMITER
  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });
  return result.data;
}
