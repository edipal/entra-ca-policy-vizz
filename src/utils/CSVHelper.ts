import Papa from 'papaparse';

// Utility to parse a semicolon-delimited CSV string into an array of row objects using PapaParse
export function parseCSV(csvString: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });
  return result.data;
}
