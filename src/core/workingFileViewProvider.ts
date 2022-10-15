import * as vscode from 'vscode';

import { TreeElement } from './treeElement';
import { getWorkspaceChangingFiles } from './command';

interface FileTreeObject {
	name: string
	children: FileTreeObject[]
}

export class WorkingFilesViewProvider implements vscode.TreeDataProvider<TreeElement> {
	private _onDidChangeTreeData: vscode.EventEmitter<TreeElement | null> = new vscode.EventEmitter<TreeElement | null>();
	readonly onDidChangeTreeData: vscode.Event<TreeElement | null> = this._onDidChangeTreeData.event;

  private rootElements: TreeElement[] = [];
	
  constructor() {
		this.refresh();
	}

	refresh (): void {
		this.makeRootElements();
	}

	getTreeItem(element: TreeElement): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

	getChildren(element: TreeElement) {
		return element ? element.children : this.rootElements;
	}

	private async createElements(): Promise<TreeElement[]> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return [];
		}

		const elements = workspaceFolders.map(rootFolder => new TreeElement(`${rootFolder.name}`, `${rootFolder.name}`, rootFolder, true));

		for await (const element of elements) {
			const fileNames = await getWorkspaceChangingFiles(element.rootPath?.uri.path);

			// ファイル名の一覧からツリー構造のオブジェクトを作る
			const result: FileTreeObject[] = [];
			const level = {result};
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
				element.addChild(new TreeElement(value.name, value.name, element.rootPath, false));
				this.put(element.children.slice(-1)[0], value.children);
			});

			if (result.length <= 0) {
				element.addChild(new TreeElement('差分はありません', '差分はありません', element.rootPath, false));
			}
		}

		return elements;
  }

	private put (element: TreeElement, result: FileTreeObject[]) {
		result.forEach(a => {
			element.addChild(new TreeElement(a.name, a.name, element.rootPath, false));
			this.put(element.children.slice(-1)[0], a.children);
		});
	}

	private async makeRootElements (): Promise<void> {
    this.rootElements = await this.createElements();
		this.viewRefresh();
		vscode.commands.executeCommand('setContext', 'working-files.loaded', true);
		
		if (this.rootElements.length <= 0) {
			vscode.commands.executeCommand('setContext', 'working-files.no-workspace', true);
		} else {
			vscode.commands.executeCommand('setContext', 'working-files.no-workspace', false);
		}
	}
	
	private viewRefresh(): void {
    this._onDidChangeTreeData.fire(undefined as any);
  }
}