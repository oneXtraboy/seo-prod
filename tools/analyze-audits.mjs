import { pathToFileURL } from "node:url";

const artifactModule = process.argv[2];
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(artifactModule).href);
const files = process.argv.slice(3);

for (const file of files) {
  const input = await FileBlob.load(file);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const overview = await workbook.inspect({
    kind: "workbook,sheet,table,region",
    maxChars: 24000,
    tableMaxRows: 200,
    tableMaxCols: 16,
    tableMaxCellChars: 300,
  });
  process.stdout.write(`\n===== ${file} =====\n${overview.ndjson ?? overview}\n`);
}
