import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class TreeElement extends vscode.TreeItem {
  private _children: TreeElement[] = [];
  private _parent: TreeElement | undefined | null;

  collapsibleState!: vscode.TreeItemCollapsibleState;
  command!: vscode.Command | undefined;

  constructor(
		public name: string,
    public readonly label: string,
		public readonly rootPath?: vscode.WorkspaceFolder,
    public readonly isWorkspace?: boolean
  ) {
    super(label);
    
    this.initializeCollapsibleState();

    this.iconPath = isWorkspace ? {
      light: path.join(__filename, '..', '..', 'assets', 'icon.svg'),
      dark: path.join(__filename, '..', '..', 'assets', 'icon.svg')
    } : undefined;
	}

  initializeCollapsibleState (): void {
    this.collapsibleState = this.children.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None;
  }

  initializeCommand (): void {
		const filePath = getFileFullPath(this);
		const workspacePath = this.rootPath?.uri.path;
		const path = `${workspacePath}/${filePath}`;
		try {
			if (fs.statSync(path).isFile()) {
				this.command = {
					command: 'vscode.open',
					title: 'open',
					arguments: [vscode.Uri.file(path)]
				};
        this.resourceUri = vscode.Uri.file(path);
			}
		} catch {}
  }

  get parent(): TreeElement | undefined | null {
    return this._parent;
  }

  set parent (parent: TreeElement | undefined | null) {
    this._parent = parent;
    this.initializeCommand();
  }

  get children(): TreeElement[] {
    return this._children;
  }

  addChild(child: TreeElement) {
    child.parent?.removeChild(child);
    this._children.push(child);
    child.parent = this;

    this.initializeCollapsibleState();
  }

  removeChild(child: TreeElement) {
    const childIndex = this._children.indexOf(child);
    if (childIndex >= 0) {
      this._children.splice(childIndex, 1);
      child.parent = null;
    }

    this.initializeCollapsibleState();
  }
}

function getFileFullPath (obj: TreeElement) {
	const fullPathWithWorkSpaceName = _getFileFullPath('', obj);
	const fullPath = fullPathWithWorkSpaceName.split('/').slice(1).join('/');
	return fullPath;
}

function _getFileFullPath (path: string, obj: TreeElement) {
	path = path ? `${obj.name}/${path}` : obj.name;
	if (obj.parent) {
		path = _getFileFullPath(path, obj.parent);
	}
	return path;
};