import * as vscode from 'vscode';
import * as cp from "child_process";

export function activate(context: vscode.ExtensionContext) {
	// const openFile = vscode.commands.registerCommand('vscode-working-files.openFile', (element: QuickStartContainer1TreeElement) => {
	// 	if (element) {
	// 		const filePath = getFileFullPath('', element);
	// 		const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri?.path;
	// 		if (!filePath || !workspacePath) {
	// 			vscode.window.showInformationMessage('Working files はファイルを開けません');
	// 			return;
	// 		}
	// 		const path = `${workspacePath}/${filePath}`;
	// 		try {
	// 			var openPath = vscode.Uri.parse(path);
	// 			vscode.workspace.openTextDocument(openPath).then(doc => {
	// 				vscode.window.showTextDocument(doc);
	// 			});
	// 		} catch {
	// 			vscode.window.showInformationMessage(`次のファイルがひらけませんでした: ${path}`);
	// 		}
	// 	}
	// });

	const wf = new WorkingFilesView();
	wf.makeRootElements();

	vscode.commands.registerCommand('vscode-working-files.refreshEntry', () =>
		wf.makeRootElements()
  );

	vscode.window.registerTreeDataProvider('git-working-files', wf);
}

export function deactivate() {}

class WorkingFilesView {
	private _onDidChangeTreeData: vscode.EventEmitter<QuickStartContainer1TreeElement | null> = new vscode.EventEmitter<QuickStartContainer1TreeElement | null>();
	readonly onDidChangeTreeData: vscode.Event<QuickStartContainer1TreeElement | null> = this
    ._onDidChangeTreeData.event;

  private rootElements: QuickStartContainer1TreeElement[];
  constructor() {
		this.rootElements = [];
  }

	async makeRootElements (): Promise<void> {
    this.rootElements = await this.createElements();
		this.refresh();
	}

	getTreeItem(element: QuickStartContainer1TreeElement): vscode.TreeItem | Thenable<vscode.TreeItem> {
    const collapsibleState = element.children.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None;
    return new vscode.TreeItem(element.name, collapsibleState);
  }

	getChildren(element: QuickStartContainer1TreeElement) {
		return element ? element.children : this.rootElements;
	}

	private async createElements(): Promise<QuickStartContainer1TreeElement[]> {
		const fileNames = await this.getWorkingBranchChangingFiles();

		let result: Obj[] = [];
		let level = {result};
		let temp: QuickStartContainer1TreeElement[] = [];

		fileNames.forEach(path => {
			path.split('/').reduce((r: any, name, i, a) => {
				if(!r[name]) {
					r[name] = {result: []};
					r.result.push({name, children: r[name].result});
				}
				
				return r[name];
			}, level);
		});

		result.forEach(value => {
			temp.push(new QuickStartContainer1TreeElement(value.name, value.name));
			this.put(temp.slice(-1)[0], value.children);
		});

		return temp;
  }

	private put (element: QuickStartContainer1TreeElement, result: Obj[]) {
		result.forEach(a => {
			element.addChild(new QuickStartContainer1TreeElement(a.name, a.name));
			this.put(element.children.slice(-1)[0], a.children);
		});
	}

	private execShell (cmd: string) {
		return new Promise<string>((resolve, reject) => {
			cp.exec(cmd, (err, out) => {
				if (err) {
					return reject(err);
				}
				return resolve(out);
			});
		});
	};

	async getWorkingBranchChangingFiles (): Promise<string[]> {
		try {
			const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri?.path;
			await this.execShell(`cd ${workspacePath}`);
			const result = await this.execShell(`cd ${workspacePath} && git -c core.quotepath=false diff \`git show-branch --merge-base master HEAD\` HEAD --name-only`);
			const statusResult = await this.execShell(`cd ${workspacePath} && git status --porcelain`);
			const result2 = statusResult.split('\n').map(line => {
				const status = line.match(/.. /) ?? [''];
				return line.replace(status[0], '');
			});

			return [
				...result.split('\n'),
				...result2
			].filter(fileName => !!fileName);
		} catch (e) {
			console.error(e);
			return [];
		}
	}
	
	refresh(): void {
    this._onDidChangeTreeData.fire(undefined as any);
  }
}

interface Obj {
	name: string
	children: Obj[]
}

export class QuickStartContainer1TreeElement extends vscode.TreeItem {
  private _children: QuickStartContainer1TreeElement[] = [];
  private _parent: QuickStartContainer1TreeElement | undefined | null;

  constructor(
		public name: string,
    public readonly label: string
  ) {
    super(label);
  }

	public command = {
		'command': 'vscode.open',
		'title': 'open'
	};

	public resourceUri = vscode.Uri.parse(getFileFullPath('', this));

  get parent(): QuickStartContainer1TreeElement | undefined | null {
    return this._parent;
  }

  get children(): QuickStartContainer1TreeElement[] {
    return this._children;
  }

  addChild(child: QuickStartContainer1TreeElement) {
    child.parent?.removeChild(child);
    this._children.push(child);
    child._parent = this;
  }

  removeChild(child: QuickStartContainer1TreeElement) {
    const childIndex = this._children.indexOf(child);
    if (childIndex >= 0) {
      this._children.splice(childIndex, 1);
      child._parent = null;
    }
  }
}

function getFileFullPath (path: string, obj: QuickStartContainer1TreeElement) {
	path = path ? `${obj.name}/${path}` : obj.name;

	if (obj.parent) {
		path = getFileFullPath(path, obj.parent);
	}
	return path;
};