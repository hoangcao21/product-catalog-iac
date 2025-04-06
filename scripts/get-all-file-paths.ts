import * as fs from "node:fs";
import * as path from "node:path";
import { DEFAULT_FRONTEND_PATHS_TEXT_FILE } from "../shared/frontend";

const fullEntryPath = process.argv[2]?.replace("--fullEntryPath=", "");
const outputFileName =
  process.argv[3]?.replace("--outputTextFileName=", "") ||
  DEFAULT_FRONTEND_PATHS_TEXT_FILE;

if (!fullEntryPath) {
  throw new Error('Missing "fullEntryPath" options');
}

// Function to get all file paths recursively
function getAllFilePaths(
  dir: string,
  fileList: string[] = [],
  extension = null
) {
  const filePaths: string[] = fs.readdirSync(dir);

  filePaths.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      getAllFilePaths(filePath, fileList, extension);
    } else {
      // If extension is specified, only add files with that extension
      if (!extension || path.extname(file) === extension) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// Get all files
const allFiles = getAllFilePaths(fullEntryPath);

const textFileName = `${outputFileName}.txt`;

// Save all file paths to a text file
fs.writeFileSync(textFileName, allFiles.join("\n"), "utf8");

console.log(
  `Saved ${allFiles.length} file paths to ${path.join(textFileName)}`
);
