// Filename: cleanupDataSourceObjects.js

const fs = require('fs');
const path = require('path');

// --- Configuration ---
const TARGET_FOLDER_NAME = 'dataSourceObjects';
const CRITERIA_STRING = '<objectType>Object</objectType>';

// Default settings (can be overridden by command-line arguments)
const DEFAULT_DELETE_FILES = false;
const DEFAULT_UPDATE_FORCEIGNORE = false;

const FORCEIGNORE_FILENAME = '.forceignore';
const SCRIPT_IGNORE_COMMENT = '# Entries added by cleanupDataSourceObjects.js';

// Optional: List of directories to ignore during the recursive search for TARGET_FOLDER_NAME
const IGNORE_DIRS = ['node_modules', '.git', '.sf', '.sfdx', '.vscode', '.svn'];
// ---------------------

// (findTargetFoldersRecursive function remains the same - see previous version)
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
                    if (!IGNORE_DIRS.includes(entry)) {
                        foundFolders = foundFolders.concat(findTargetFoldersRecursive(entryPath, targetName));
                    }
                }
            } catch (statError) {
                // console.warn(`Skipping (stat error): ${entryPath} - ${statError.message}`);
            }
        }
    } catch (readDirError) {
        // console.warn(`Skipping (readdir error): ${currentPath} - ${readDirError.message}`);
    }
    return foundFolders;
}


// (identifyFilesForAction function remains the same - see previous version)
/**
 * Identifies files in a given folder that do NOT contain the criteria string.
 * @param {string} folderPath The path to the folder containing files to process.
 * @param {string} criteria The string to check for (absence of which means file meets criteria).
 * @returns {string[]} An array of absolute paths for files meeting the criteria.
 */
function identifyFilesForAction(folderPath, criteria) {
    const filesToAction = [];
    try {
        const entries = fs.readdirSync(folderPath);
        for (const entry of entries) {
            const filePath = path.join(folderPath, entry);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    if (!content.includes(criteria)) {
                        filesToAction.push(filePath);
                    }
                }
            } catch (statError) {
                // console.warn(`  Skipping file (stat error): ${filePath} - ${statError.message}`);
            }
        }
    } catch (readDirError) {
        console.error(`  Error reading directory ${folderPath} for processing: ${readDirError.message}`);
    }
    return filesToAction;
}

// (updateForceignoreFile function remains the same - see previous version)
/**
 * Updates the .forceignore file with new entries.
 * @param {string} projectRootPath The root path of the project where .forceignore should reside.
 * @param {string[]} absoluteFilePathsToAdd An array of absolute file paths to add.
 */
function updateForceignoreFile(projectRootPath, absoluteFilePathsToAdd) {
    const forceignorePath = path.join(projectRootPath, FORCEIGNORE_FILENAME);
    let existingEntries = new Set();
    let originalContentLines = [];

    if (fs.existsSync(forceignorePath)) {
        try {
            const existingContent = fs.readFileSync(forceignorePath, 'utf8');
            originalContentLines = existingContent.split(/\r?\n/);
            originalContentLines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine !== '' && !trimmedLine.startsWith('#')) {
                    existingEntries.add(trimmedLine);
                }
            });
        } catch (readError) {
            console.error(`Error reading ${forceignorePath}: ${readError.message}`);
            return; 
        }
    }

    const newRelativePaths = [];
    for (const absoluteFilePath of absoluteFilePathsToAdd) {
        const relativePath = path.relative(projectRootPath, absoluteFilePath).split(path.sep).join('/');
        if (!existingEntries.has(relativePath)) {
            newRelativePaths.push(relativePath);
            existingEntries.add(relativePath); 
        }
    }

    if (newRelativePaths.length > 0) {
        let contentToAppend = "";
        const headerExists = originalContentLines.some(line => line.trim() === SCRIPT_IGNORE_COMMENT);

        if (originalContentLines.length > 0 && 
            originalContentLines[originalContentLines.length - 1].trim() !== '' &&
            (!headerExists || originalContentLines[originalContentLines.length - 1].trim() !== SCRIPT_IGNORE_COMMENT) ) {
            contentToAppend += "\n"; // Add a newline if file has content and doesn't end with newline or our comment
        }
        
        if (!headerExists) {
             contentToAppend += (originalContentLines.filter(l => l.trim() !== '').length > 0 ? "\n" : "") + SCRIPT_IGNORE_COMMENT + "\n";
        } else {
             // If header exists, make sure there is a newline after it if we are adding to it.
             // This simple append assumes entries go after the header or at the end.
             // More sophisticated logic could insert within a block.
             if (contentToAppend === "" && originalContentLines.length > 0 && originalContentLines[originalContentLines.length -1].trim() !== '') {
                 contentToAppend += "\n";
             }
        }

        contentToAppend += newRelativePaths.join('\n') + "\n";

        try {
            fs.appendFileSync(forceignorePath, contentToAppend, 'utf8');
            console.log(`\nAppended ${newRelativePaths.length} new entr(y/ies) to ${forceignorePath}`);
            newRelativePaths.forEach(p => console.log(`  Added: ${p}`));
        } catch (appendError) {
            console.error(`Error appending to ${forceignorePath}: ${appendError.message}`);
        }
    } else {
        console.log(`\nNo new unique file paths to add to ${forceignorePath}.`);
    }
}


/**
 * Main function to orchestrate the script.
 */
function main() {
    // Parse command line arguments
    let effectiveDeleteFiles = DEFAULT_DELETE_FILES;
    let effectiveUpdateForceignore = DEFAULT_UPDATE_FORCEIGNORE;
    let pathArgument = null;
    const cliArgs = process.argv.slice(2);
    const remainingArgsForPath = [];

    let deleteArgProcessed = false;
    let updateForceignoreArgProcessed = false;

    for (const arg of cliArgs) {
        if (arg === '--delete') {
            effectiveDeleteFiles = true;
            deleteArgProcessed = true;
        } else if (arg === '--update-forceignore') {
            effectiveUpdateForceignore = true;
            updateForceignoreArgProcessed = true;
        } else if (arg === '--no-delete') {
            effectiveDeleteFiles = false;
            deleteArgProcessed = true;
        } else if (arg === '--no-update-forceignore') {
            effectiveUpdateForceignore = false;
            updateForceignoreArgProcessed = true;
        } else if (!arg.startsWith('--')) {
            remainingArgsForPath.push(arg);
        } else {
            console.warn(`Warning: Unknown option ${arg} will be ignored.`);
        }
    }

    if (remainingArgsForPath.length > 0) {
        pathArgument = remainingArgsForPath[0];
        if (remainingArgsForPath.length > 1) {
            console.warn(`Warning: Multiple path arguments found. Using the first one: "${pathArgument}". The rest are ignored: ${remainingArgsForPath.slice(1).join(', ')}`);
        }
    }

    // Initial console logs reflecting effective settings
    console.log(`Node.js File Utility`);
    console.log(`-----------------------------`);
    if (deleteArgProcessed) {
        console.log(`INFO: File deletion explicitly set to ${effectiveDeleteFiles} by command-line argument.`);
    }
    if (effectiveDeleteFiles) {
        console.warn("ACTION: File deletion is ENABLED.");
    } else {
        console.log("INFO: File deletion is DISABLED (Dry-run for deletion). Use --delete to enable.");
    }

    if (updateForceignoreArgProcessed) {
        console.log(`INFO: .forceignore update explicitly set to ${effectiveUpdateForceignore} by command-line argument.`);
    }
    if (effectiveUpdateForceignore) {
        console.log("ACTION: .forceignore file update is ENABLED.");
    } else {
        console.log("INFO: .forceignore file update is DISABLED. Use --update-forceignore to enable.");
    }
    console.log(`Criteria: Files NOT containing "${CRITERIA_STRING}" in folders named "${TARGET_FOLDER_NAME}" will be targeted.\n`);


    const searchStartPath = pathArgument ? path.resolve(pathArgument) : process.cwd();

    try {
        if (!fs.existsSync(searchStartPath) || !fs.statSync(searchStartPath).isDirectory()) {
            console.error(`Error: Starting directory '${searchStartPath}' not found or is not a directory.`);
            console.error("Usage: node cleanupDataSourceObjects.js [--delete] [--update-forceignore] [--no-delete] [--no-update-forceignore] [path_to_search_from]");
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

    let allFilesIdentifiedForAction = [];

    targetFolders.forEach(folderPath => {
        console.log(`\nIdentifying files in directory: '${folderPath}'`);
        const filesInFolder = identifyFilesForAction(folderPath, CRITERIA_STRING);

        if (filesInFolder.length > 0) {
            console.log(`  Found ${filesInFolder.length} file(s) in this folder that do NOT contain '${CRITERIA_STRING}':`);
            filesInFolder.forEach(filePath => {
                let actionSummary = [];
                if (effectiveDeleteFiles) actionSummary.push('To be DELETED');
                if (effectiveUpdateForceignore) actionSummary.push('To be added to .forceignore');
                
                console.log(`    - ${filePath} ${actionSummary.length > 0 ? `(${actionSummary.join(', ')})` : '(No action enabled)'}`);

                if (effectiveDeleteFiles) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`      DELETED: ${filePath}`);
                    } catch (deleteError) {
                        console.error(`      ERROR DELETING: ${filePath} - ${deleteError.message}`);
                    }
                }
            });
            allFilesIdentifiedForAction = allFilesIdentifiedForAction.concat(filesInFolder);
        } else {
            console.log(`  No files in this folder met the criteria for action.`);
        }
    });

    if (effectiveUpdateForceignore && allFilesIdentifiedForAction.length > 0) {
        updateForceignoreFile(searchStartPath, allFilesIdentifiedForAction);
    } else if (effectiveUpdateForceignore) {
        console.log("\nNo files identified for action, so .forceignore was not modified.");
    }
    
    console.log("\n-----------------------------");
    console.log("Script finished.");
    if (!effectiveDeleteFiles) {
        console.log("REMINDER: Deletion was in dry-run mode. Use --delete to actually delete files.");
    }
    if (!effectiveUpdateForceignore) {
        console.log("REMINDER: .forceignore file was not updated. Use --update-forceignore to enable.");
    }
}

// Run the main function
main();