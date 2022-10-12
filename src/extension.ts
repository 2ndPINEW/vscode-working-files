import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('vscode-working-files.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World!');
	});

	context.subscriptions.push(disposable);

	const wf = new WorkingFilesView();
	vscode.window.registerTreeDataProvider('git-working-files', wf);

	// https://stackoverflow.com/questions/43007267/how-to-run-a-system-command-from-vscode-extension
	// うごかーん
	function commentLine(command: string) {
		const cp = require('child_process');
		cp.exec(command, (err: any, stdout: any, stderr: any) => {
				console.log('stdout: ' + stdout);
				vscode.window.showInformationMessage('stdout: ' + stdout);
				console.log('stderr: ' + stderr);
				if (err) {
						console.log('error: ' + err);
				}
		});
	}

	function getWorkingBranchChangingFiles (): void {
		commentLine('git -c core.quotepath=false diff `git show-branch --merge-base master HEAD` HEAD --name-only');
	}

	getWorkingBranchChangingFiles();
}

export function deactivate() {}

// git -c core.quotepath=false diff `git show-branch --merge-base master HEAD` HEAD --name-only

class WorkingFilesView {
	constructor() {
		//初期値などを定義
	}

	getTreeItem(element: any) {
		//ツリーの最小単位を返す
		return element;
	}

	getChildren(element: any) {
		return element;
	}
}
