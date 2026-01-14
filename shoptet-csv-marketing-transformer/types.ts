
export interface CSVRow {
  [key: string]: string;
}

export interface TransformationConfig {
  domain: string;
  customLabelMode: 'fixed' | 'column';
  fixedLabelValue: string;
  labelColumn: string;
}

export interface TransformationResult {
  fileName: string;
  rowCount: number;
  data: string;
  previewRows: Array<{ 'Page URL': string; 'Custom label': string }>;
}
