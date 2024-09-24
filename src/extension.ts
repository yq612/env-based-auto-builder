import * as vscode from 'vscode';
import * as path from 'path';
import * as fse from 'fs-extra';
import { generateDynamicFileName, getEnvFiles, getScriptsFromPackageJson, runCommand, zipDirectory } from "./tools";
import { getProjectPath, isWorkspaceFolderExists } from './vscode';

// Let the user choose a script, with 'build' preferred as the default option
async function selectScript(scripts: Record<string, string>): Promise<string | undefined> {
    const scriptNames = Object.keys(scripts).filter(script => script.includes('build'));
    return await vscode.window.showQuickPick(scriptNames, {
        placeHolder: 'Select a build-related script to run'
    });
}

async function buildForAllEnvironments() {

    if (!isWorkspaceFolderExists()) {
        return;
    }

    const projectRoot = getProjectPath();
    const targetZipFolderName = await generateDynamicFileName(projectRoot);
    const envFiles = await getEnvFiles(projectRoot);

    if (envFiles.length === 0) {
        vscode.window.showErrorMessage('No environment files found.');
        return;
    }

    const scripts = await getScriptsFromPackageJson(projectRoot);
    const selectedScript = await selectScript(scripts);
    if (!selectedScript) {
        vscode.window.showErrorMessage('No script selected.');
        return;
    }

    for (const envFile of envFiles) {
        const envName = path.basename(envFile).replace('.env.', '');
        const scriptValue = scripts[selectedScript];

        if (!scriptValue) {
            vscode.window.showErrorMessage(`No script found for ${selectedScript}`);
            return;
        }

        // Execute the npm run command via spawn and add the --mode parameter
        const command = 'npm';
        const args = ['run', selectedScript, '--', '--mode', envName];

        try {
            // Run the package command
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Building for ${envName} with ${selectedScript}...`,
                cancellable: false
            }, async () => {
                // Execute your build task
                await runCommand(command, args, projectRoot);
                const distFolder = path.join(projectRoot, 'dist');  // 源 dist 目录
                const zipFolder = path.join(projectRoot, targetZipFolderName, `${envName}.zip`);  // 生成的 ZIP 文件路径

                // Make sure the target zip folder exists
                await fse.ensureDir(path.join(projectRoot, targetZipFolderName));

                // Compress the dist directory to a zip file
                await zipDirectory(distFolder, zipFolder);
                // A new notification is displayed when the build is complete
                vscode.window.showInformationMessage(`✅ ${envName} build completed with ${selectedScript}!`);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error during build for ${envName} with ${selectedScript}: ${error}`);
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('extension.autoEnvBuilder', () => {
        buildForAllEnvironments();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }