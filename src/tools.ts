/**
 * @name Tools
 * @des Common tool libraries
 */

import * as fse from 'fs-extra';
import * as path from 'path';
import archiver from 'archiver';
import { spawn } from 'child_process';


/**
 * Gets the.env file in the current project dynamically
 * @param {string} projectRoot
 * @return {*}  {Promise<string[]>}
 */
export async function getEnvFiles(projectRoot: string): Promise<string[]> {
    const files = await fse.readdir(projectRoot);
    return files.filter(file => file.startsWith('.env.') && fse.statSync(path.join(projectRoot, file)).isFile());
}

/**
 * Generate a file name based on the name field in package.json and the current time (format: project name _yyyymmdd_hhmm)
 * @param {string} projectRoot
 * @return {*}  {Promise<string>}
 */
export async function generateDynamicFileName(projectRoot: string): Promise<string> {
    // Get the path to package.json    
    const packageJsonPath = path.join(projectRoot, 'package.json');

    // Read package.json and parse out the name field
    const packageJson = JSON.parse(await fse.readFile(packageJsonPath, 'utf-8'));
    const packageName = packageJson.name || 'QuickEnvBuilder';

    // Get the current time and format it as yyyymmdd_hhmm
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${yyyy}${mm}${dd}_${hh}${mi}`;

    // Returns the concatenated file name
    return `${packageName}_${formattedTime}`;
}
/**
 * Compress the directory to a zip file
 * @param {string} sourceDir
 * @param {string} zipFilePath
 * @return {*}  {Promise<void>}
 */
export async function zipDirectory(sourceDir: string, zipFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fse.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(`Error during compression: ${err.message}`));

        archive.pipe(output);
        archive.directory(sourceDir, false);  // Add the source directory to the ZIP file
        archive.finalize();  // Complete the compression
    });
}

/**
 * Helper function that executes the command using spawn
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @return {*}  {Promise<void>}
 */
export function runCommand(command: string, args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd });
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(`Process exited with code ${code}`);
            }
        });

        child.on('error', (error) => {
            reject(`Failed to start process: ${error.message}`);
        });
    });
}

/**
 * Read the scripts field in package.json
 * @param {string} projectRoot
 * @return {*}  {Promise<Record<string, string>>}
 */
export async function getScriptsFromPackageJson(projectRoot: string): Promise<Record<string, string>> {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(await fse.readFile(packageJsonPath, 'utf-8'));
    return packageJson.scripts || {};
}