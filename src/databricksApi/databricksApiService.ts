import * as vscode from 'vscode';
import * as fs from 'fs';
import { DatabricksWorkspaceTreeItem } from './workspaces/DatabricksWorkspaceTreeItem';
import { iDatabricksWorkspaceItem } from './workspaces/iDatabricksworkspaceItem';
import { WorkspaceItemExportFormat, WorkspaceItemType, WorkspaceItemLanguage } from './workspaces/_types';

import { DatabricksClusterTreeItem } from './clusters/DatabricksClusterTreeItem';
import { iDatabricksRuntimeVersion } from './clusters/iDatabricksRuntimeVersion';

import { DatabricksFSTreeItem } from './dbfs/DatabricksFSTreeItem';
import { iDatabricksFSItem } from './dbfs/iDatabricksFSItem';

import { DatabricksSecretTreeItem } from './secrets/DatabricksSecretTreeItem';
import { iDatabricksSecretScope } from './secrets/iDatabricksSecretScope';
import { iDatabricksSecret } from './secrets/iDatabricksSecret';

import { DatabricksEnvironmentTreeItem } from './../environments/DatabricksEnvironmentTreeItem';
import { iDatabricksEnvironment } from './../environments/iDatabricksEnvironment';
import { ActiveDatabricksEnvironment } from './../environments/ActiveDatabricksEnvironment';


export abstract class DatabricksApiService {
	private static API_SUB_URL: string = "/api/";
	private static _apiService: any;

	static initialize(environment: iDatabricksEnvironment = ActiveDatabricksEnvironment): void {
		const axios = require('axios');
		// Set config defaults when creating the instance
		this._apiService = axios.create({
			baseURL: environment.apiRootUrl + this.API_SUB_URL
		});
		
		// Alter defaults after instance has been created
		this._apiService.defaults.headers.common['Authorization'] = "Bearer " + environment.personalAccessToken;
		this._apiService.defaults.headers.common['Content-Type'] = 'application/json';
		this._apiService.defaults.headers.common['Accept'] = 'application/json';
	}

	private static writeBase64toFile(base64String: string, filePath: string): void {
		if (!fs.existsSync(filePath)){
			fs.mkdirSync(filePath.split('\\').slice(0, -1).join('\\'), { recursive: true });
		}
		fs.writeFile(filePath, base64String, {encoding: 'base64'}, function(err) {
			vscode.window.showErrorMessage(`ERROR: ${err}`);
		});
	}

	private static readBase64FromFile(filePath: string): string {
		// read binary data
		var bitmap = fs.readFileSync(filePath);
		// convert binary data to base64 encoded string
		return Buffer.from(bitmap).toString('base64');
	}

	private static sortArrayByProperty(unsortedArray: object[], property: string = "label")	{
		unsortedArray.sort((t1, t2) => {
			const name1 = t1[property].toLowerCase();
			const name2 = t2[property].toLowerCase();
			if (name1 > name2) { return 1; }
			if (name1 < name2) { return -1; }
			return 0;
		});
	}

	static async listWorkspaceItems(path: string) : Promise<DatabricksWorkspaceTreeItem[]> {
		let endpoint = '2.0/workspace/list';
		let body = { path: path };
		
		let response = await this._apiService.get(endpoint, { params: body});
		
		let result = response.data;
		let items = result.objects as iDatabricksWorkspaceItem[];

		let wsItems: DatabricksWorkspaceTreeItem[] = [];
		if(items != undefined)
		{
			items.map(item => wsItems.push(new DatabricksWorkspaceTreeItem(item.path, item.object_type, item.object_id, item.language)));
			DatabricksApiService.sortArrayByProperty(wsItems, "label");
		}
		return wsItems;
	}

	static async downloadWorkspaceItem(path: string, localPath: string, format: WorkspaceItemExportFormat = "SOURCE"): Promise<void> {
		let endpoint = '2.0/workspace/export';
		let body = { 
			path: path,
			format: format
		};
		
		let response = await this._apiService.get(endpoint, { params: body});
		
		let result = response.data;

		this.writeBase64toFile(result.content, localPath);
	}

	static async uploadWorkspaceItem(localPath: string, path: string, language: WorkspaceItemLanguage, overwrite: boolean = true, format: WorkspaceItemExportFormat = "SOURCE"): Promise<void> {
		let endpoint = '2.0/workspace/import';
		let body = {
			content: this.readBase64FromFile(localPath),
			path: path,
			language: language,
			overwrite: overwrite,
			format: format
		};

		let response = await this._apiService.post(endpoint, body);
		
		let result = response.data;
	}

	static async listClusters() : Promise<DatabricksClusterTreeItem[]> {
		let endpoint = '2.0/clusters/list';

		let response = await this._apiService.get(endpoint);
		
		let result = response.data;
		let items = result.clusters as DatabricksClusterTreeItem[];

		let cItems: DatabricksClusterTreeItem[] = [];
		if(items != undefined)
		{
			items.map(item => cItems.push(new DatabricksClusterTreeItem(JSON.stringify(item, null, 4), item.cluster_id, item.cluster_name, item.state)));
			DatabricksApiService.sortArrayByProperty(cItems, "label");
		}
		return cItems;
	}

	static async startCluster(cluster_id: string): Promise<object> {
		let endpoint = '2.0/clusters/start';
		let body = { cluster_id: cluster_id };

		let response = await this._apiService.post(endpoint, body);
		
		return response;
	}

	static async stopCluster(cluster_id: string): Promise<object> {
		let endpoint = '2.0/clusters/delete';
		let body = { cluster_id: cluster_id };

		let response = this._apiService.post(endpoint, body);
		
		return response;
	}

	static async listRuntimeVersions(path: string) : Promise<iDatabricksRuntimeVersion[]> {
		let endpoint = '2.0/clusters/spark-versions';

		let response = await this._apiService.get(endpoint);
		
		let result = response.data;

		return result.versions;
	}

	static async listDBFSItems(path: string) : Promise<DatabricksFSTreeItem[]> {
		let endpoint = '2.0/dbfs/list';
		let body = { path: path };
		
		let response = await this._apiService.get(endpoint, { params: body});
		
		let result = response.data;

		// array of file is in result.files
		let items = result.files as iDatabricksFSItem[];
		
		let dbfsItems: DatabricksFSTreeItem[] = [];
		if(items != undefined)
		{
			items.map(item => dbfsItems.push(new DatabricksFSTreeItem(item.path, item.is_dir, item.size)));
			DatabricksApiService.sortArrayByProperty(dbfsItems, "label");
		}
		return dbfsItems;
	}

	static async downloadDBFSItem(path: string, localPath: string, format: WorkspaceItemExportFormat = "SOURCE"): Promise<void> {
		vscode.window.showErrorMessage("Not yet implemented!");
	}

	static async uploadDBFSItem(localPath: string, path: string, language: WorkspaceItemLanguage, overwrite: boolean = true, format: WorkspaceItemExportFormat = "SOURCE"): Promise<void> {
		vscode.window.showErrorMessage("Not yet implemented!");
	}


	static async listSecretScopes() : Promise<DatabricksSecretTreeItem[]> {
		let endpoint = '2.0/secrets/scopes/list';
		
		let response = await this._apiService.get(endpoint);
		
		let result = response.data;

		// array of scopes is in result.scopes
		let items = result.scopes as iDatabricksSecretScope[];
		
		let scopeItems: DatabricksSecretTreeItem[] = [];
		if(items != undefined)
		{
			items.map(item => scopeItems.push(new DatabricksSecretTreeItem(item.name)));
			DatabricksApiService.sortArrayByProperty(scopeItems, "label");
		}
		return scopeItems;
	}

	static async createSecretScopes(scope: string, initial_manage_principal: string = "users") : Promise<object> {
		let endpoint = '2.0/secrets/scopes/create';
		let body = { 
			scope: 						scope, 
			initial_manage_principal: 	initial_manage_principal
		};

		let response = await this._apiService.post(endpoint, body);
		
		return response;
	}

	static async deleteSecretScope(scope: string) : Promise<object> {
		// currently only sting values are supported!
		let endpoint = '2.0/secrets/delete';
		let body = { 
			scope: 			scope
		};

		let response = await this._apiService.post(endpoint, body);
		
		return response;
	}

	static async listSecrets(scope: string) : Promise<DatabricksSecretTreeItem[]> {
		let endpoint = '2.0/secrets/list';
		let body = { scope: scope };
		
		let response = await this._apiService.get(endpoint, { params: body});
		
		let result = response.data;

		// array of secrets is in result.secrets
		let items = result.secrets as iDatabricksSecret[];
		
		let scopeItems: DatabricksSecretTreeItem[] = [];
		if(items != undefined)
		{
			items.map(item => scopeItems.push(new DatabricksSecretTreeItem(scope, item.key)));
			DatabricksApiService.sortArrayByProperty(scopeItems, "label");
		}
		return scopeItems;
	}

	static async setSecret(scope: string, secret: string, value: string) : Promise<object> {
		// currently only sting values are supported!
		let endpoint = '2.0/secrets/put';
		let body = { 
			scope: 			scope, 
			key: 			secret,
			string_value: 	value
		};

		let response = await this._apiService.post(endpoint, body);
		
		return response;
	}

	static async deleteSecret(scope: string, secret: string) : Promise<object> {
		// currently only sting values are supported!
		let endpoint = '2.0/secrets/delete';
		let body = { 
			scope: 			scope, 
			key: 			secret
		};

		let response = await this._apiService.post(endpoint, body);
		
		return response;
	}
}