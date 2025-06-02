// Filename: cleanupDataSourceObjects.js

const fs = require('fs');
const path = require('path');

// --- Configuration ---
const TARGET_FOLDER_NAME = 'dataSourceObjects';
const CRITERIA_STRING = '<objectType>Object</objectType>';
// Set to true to actually delete files. Defaults to false (dry-run mode).
const DELETE_FILES = true;
// Optional: List of directories to ignore during the recursive search for TARGET_FOLDER_NAME
const IGNORE_DIRS = ['node_modules', '.git', '.sf','.sfdx','.vscode','.svn'];
// ---------------------

/**
 * Recursively finds all directories with a specific name.
 * @param {string} currentPath The directory to start searching from.
 * @param {string} targetName The name of the directory to find.
 * @returns {string[]} An array of full paths to the found target directories.
 */
function findTargetFoldersRecursive(currentPath, targetName) {
    let foundFolders = [];
    try {
        const entries = fs.readdirSync(currentPath);

        for (const entry of entries) {
            const entryPath = path.join(currentPath, entry);
            try {
                const stat = fs.statSync(entryPath);
                if (stat.isDirectory()) {
                    if (entry === targetName) {
                        foundFolders.push(entryPath);
                    }
                    // Continue searching recursively, unless it's an ignored directory
                    if (!IGNORE_DIRS.includes(entry)) {
                        foundFolders = foundFolders.concat(findTargetFoldersRecursive(entryPath, targetName));
                    }
                }
            } catch (statError) {
                // console.warn(`Skipping (stat error): ${entryPath} - ${statError.message}`);
                // Could be a permissions issue or a broken symlink, skip it.
            }
        }
    } catch (readDirError) {
        // console.warn(`Skipping (readdir error): ${currentPath} - ${readDirError.message}`);
        // Could be a permissions issue, skip it.
    }
    return foundFolders;
}

/**
 * Processes files in a given folder: deletes files that do NOT contain the criteria string.
 * @param {string} folderPath The path to the folder containing files to process.
 * @param {string} criteria The string to check for (absence of which triggers deletion).
 */
function processFilesLookigForAbsence(folderPath, criteria) {
    try {
        const entries = fs.readdirSync(folderPath);
        let filesProcessed = 0;
        let filesMarkedForDeletion = 0;

        for (const entry of entries) {
            const filePath = path.join(folderPath, entry);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    filesProcessed++;
                    const content = fs.readFileSync(filePath, 'utf8');
                    if (!content.includes(criteria)) {
                        filesMarkedForDeletion++;
                        console.log(`  File does NOT contain '${criteria}'. ${DELETE_FILES ? 'Deleting' : 'Would delete'}: ${filePath}`);
                        if (DELETE_FILES) {
                            try {
                                fs.unlinkSync(filePath);
                                console.log(`    DELETED: ${filePath}`);
                            } catch (deleteError) {
                                console.error(`    ERROR DELETING: ${filePath} - ${deleteError.message}`);
                            }
                        }
                    }
                }
            } catch (statError) {
                // console.warn(`  Skipping file (stat error): ${filePath} - ${statError.message}`);
            }
        }
        if (filesProcessed === 0) {
            console.log("  No files found directly in this directory.");
        } else if (filesMarkedForDeletion === 0) {
            console.log("  All files checked contained the criteria string or no files met deletion criteria.");
        }

    } catch (readDirError) {
        console.error(`  Error reading directory ${folderPath}: ${readDirError.message}`);
    }
}

/**
 * Main function to orchestrate the script.
 */
function main() {
    console.log(`Node.js File Cleanup Utility`);
    console.log(`-----------------------------`);
    if (DELETE_FILES) {
        console.warn("WARNING: DELETE_FILES is set to true. Files will be permanently deleted.");
    } else {
        console.log("INFO: DELETE_FILES is false. Running in dry-run mode. No files will be deleted.");
    }
    console.log(`Criteria: Files NOT containing "${CRITERIA_STRING}" in folders named "${TARGET_FOLDER_NAME}" will be targeted.\n`);


    const startArg = process.argv[2]; // process.argv[0] is node, process.argv[1] is script path
    const searchStartPath = startArg ? path.resolve(startArg) : process.cwd();

    try {
        if (!fs.existsSync(searchStartPath) || !fs.statSync(searchStartPath).isDirectory()) {
            console.error(`Error: Starting directory '${searchStartPath}' not found or is not a directory.`);
            console.error("Usage: node cleanupDataSourceObjects.js [path_to_search_from]");
            process.exit(1);
        }
    } catch (e) {
        console.error(`Error accessing starting directory '${searchStartPath}': ${e.message}`);
        process.exit(1);
    }


    console.log(`Starting search for '${TARGET_FOLDER_NAME}' directories from: '${searchStartPath}'`);
    const targetFolders = findTargetFoldersRecursive(searchStartPath, TARGET_FOLDER_NAME);

    if (targetFolders.length === 0) {
        console.log(`\nNo '${TARGET_FOLDER_NAME}' directories found in the specified path.`);
        console.log("\nDone.");
        return;
    }

    console.log(`\nFound ${targetFolders.length} '${TARGET_FOLDER_NAME}' director(y/ies):`);
    targetFolders.forEach(folder => console.log(`  - ${folder}`));

    targetFolders.forEach(folderPath => {
        console.log(`\nProcessing directory: '${folderPath}'`);
        processFilesLookigForAbsence(folderPath, CRITERIA_STRING);
    });

    console.log("\n-----------------------------");
    console.log("Script finished.");
    if (!DELETE_FILES) {
        console.log("\nREMINDER: This was a dry run. To delete files, edit the script and set DELETE_FILES = true.");
    }
}

// Run the main function
main();