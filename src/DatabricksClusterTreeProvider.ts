import * as vscode from 'vscode';
import { DatabricksApiService} from './databricksApi/databricksApiService';
import { DatabricksClusterTreeItem } from './databricksApi/clusters/DatabricksClusterTreeItem';

// https://vshaxe.github.io/vscode-extern/vscode/TreeDataProvider.html
export class DatabricksClusterTreeProvider implements vscode.TreeDataProvider<DatabricksClusterTreeItem> {
	private _databricksApiService: DatabricksApiService;
	private _workspaceLocalFolder: string;

	private _onDidChangeTreeData: vscode.EventEmitter<DatabricksClusterTreeItem | undefined> = new vscode.EventEmitter<DatabricksClusterTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<DatabricksClusterTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor() {	}

	refresh(showInfoMessage: boolean = false): void {
		if(showInfoMessage){
			vscode.window.showInformationMessage('Refreshing Clusters ...');
		}
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: DatabricksClusterTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: DatabricksClusterTreeItem): Thenable<DatabricksClusterTreeItem[]> {	
		if (element != null && element != undefined) {
			return element.getChildren();
		}
		else {
			return DatabricksClusterTreeItem.getDummyItem("ROOT").getChildren();
		}
	}

	add(): void {
		vscode.window.showErrorMessage(`Not yet implemented!`);
	}
}
