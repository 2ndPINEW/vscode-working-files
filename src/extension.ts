import * as vscode from 'vscode';
import * as cp from "child_process";

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('vscode-working-files.helloWorld', async () => {
	});

	context.subscriptions.push(disposable);

	vscode.commands.registerCommand('vscode-working-files.openResource', resource => openResource(resource));

	const wf = new WorkingFilesView();
	wf.makeRootElements();
	vscode.window.registerTreeDataProvider('git-working-files', wf);

	function openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}
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
		vscode.window.showInformationMessage('make elements');
    this.rootElements = await this.createElements();
		this.refresh();
	}

	getTreeItem(element: QuickStartContainer1TreeElement): vscode.TreeItem | Thenable<vscode.TreeItem> {
    const collapsibleState = element.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
    return new vscode.TreeItem(element.name, collapsibleState);
  }

	getChildren(element: QuickStartContainer1TreeElement) {
		return element ? element.children : this.rootElements;
	}

	private async createElements(): Promise<QuickStartContainer1TreeElement[]> {
		const splitedFileNames = await this.getWorkingBranchChangingFiles();

		let result: Obj[] = [];
		let level = {result};

		splitedFileNames.forEach(path => {
			path.split('/').reduce((r: any, name, i, a) => {
				if(!r[name]) {
					r[name] = {result: []};
					r.result.push({name, children: r[name].result});
				}
				
				return r[name];
			}, level);
		});

		return [];
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
			const result = await this.execShell('cd /Users/takase/dev/live-web && git -c core.quotepath=false diff `git show-branch --merge-base master HEAD` HEAD --name-only');
			vscode.window.showInformationMessage('result' + result);
			return result.split('\n');
		} catch {
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

export class QuickStartContainer1TreeElement {

  private _children: QuickStartContainer1TreeElement[];
  private _parent: QuickStartContainer1TreeElement | undefined | null;
  constructor(
    public name: string
  ) {
    this._children = [];
  }

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