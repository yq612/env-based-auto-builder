/**
 * @name Vscode
 * @des Vscode tool libraries
 */

import * as vscode from 'vscode';

/**
 * Determines whether the working directory exists
 * @return {boolean} 
 */
export function isWorkspaceFolderExists() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return false;
    }
    return true;
}
/**
 *
 * @export
 * @return {string} 
 */
export function getProjectPath() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return (workspaceFolders && workspaceFolders.length) ? workspaceFolders[0].uri.fsPath : "";
}
