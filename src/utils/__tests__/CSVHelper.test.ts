import { parseCSV } from "@/utils/CSVHelper";

describe('parseCSV', () => {
  it('parses a simple semicolon-delimited CSV string', () => {
    const csv = `A;B;C\n1;2;3\n4;5;6`;
    expect(parseCSV(csv)).toEqual([
      { A: '1', B: '2', C: '3' },
      { A: '4', B: '5', C: '6' },
    ]);
  });

  it('trims whitespace from headers and values', () => {
    const csv = ` A ; B ; C \n 1 ; 2 ; 3 `;
    expect(parseCSV(csv)).toEqual([
      { A: '1', B: '2', C: '3' },
    ]);
  });

  it('handles empty values', () => {
    const csv = `A;B;C\n1;;3`;
    expect(parseCSV(csv)).toEqual([
      { A: '1', B: '', C: '3' },
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseCSV('')).toEqual([]);
  });
});
