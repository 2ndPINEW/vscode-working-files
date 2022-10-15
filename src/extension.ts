import * as vscode from 'vscode';

import { WorkingFilesViewProvider } from './core/workingFileViewProvider';

export function activate(_context: vscode.ExtensionContext) {
	const wf = new WorkingFilesViewProvider();
	wf.refresh();

	vscode.workspace.onDidSaveTextDocument(() => {
		wf.refresh();
	});
	vscode.workspace.onDidCreateFiles(() => {
		wf.refresh();
	});
	vscode.workspace.onDidDeleteFiles(() => {
		wf.refresh();
	});
	vscode.workspace.onDidRenameFiles(() => {
		wf.refresh();
	});

	vscode.commands.registerCommand('vscode-working-files.refreshEntry', () =>
		wf.refresh()
  );

	vscode.window.registerTreeDataProvider('git-working-files', wf);
}

export function deactivate() {}
