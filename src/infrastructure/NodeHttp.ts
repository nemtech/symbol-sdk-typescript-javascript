/*
 * Copyright 2019 NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Observable } from 'rxjs';
import { NodeInfoDTO, NodeRoutesApi } from 'symbol-openapi-typescript-fetch-client';
import { UInt64 } from '../model';
import { StorageInfo } from '../model/blockchain';
import { NodeHealth, NodeInfo, NodeTime, RoleType, ServerInfo } from '../model/node';
import { Deployment } from '../model/node/Deployment';
import { Http } from './Http';
import { NodeRepository } from './NodeRepository';

/**
 * Node http repository.
 *
 * @since 1.0
 */
export class NodeHttp extends Http implements NodeRepository {
    /**
     * @internal
     * Symbol openapi typescript-node client account routes api
     */
    private readonly nodeRoutesApi: NodeRoutesApi;

    /**
     * Constructor
     * @param url Base catapult-rest url
     * @param fetchApi fetch function to be used when performing rest requests.
     */
    constructor(url: string, fetchApi?: any) {
        super(url, fetchApi);
        this.nodeRoutesApi = new NodeRoutesApi(this.config());
    }

    /**
     * Supplies additional information about the application running on a node.
     * @summary Get the node information
     */
    public getNodeInfo(): Observable<NodeInfo> {
        return this.call(this.nodeRoutesApi.getNodeInfo(), (body) => this.toNodeInfo(body));
    }

    /**
     * Gets the list of peers visible by the node,
     * @summary Gets the list of peers visible by the node
     */
    public getNodePeers(): Observable<NodeInfo[]> {
        return this.call(this.nodeRoutesApi.getNodePeers(), (body) => body.map((nodeInfo) => this.toNodeInfo(nodeInfo)));
    }

    /**
     * Gets the node time at the moment the reply was sent and received.
     * @summary Get the node time
     */
    public getNodeTime(): Observable<NodeTime> {
        return this.call(this.nodeRoutesApi.getNodeTime(), (body) => {
            const nodeTimeDTO = body;
            if (nodeTimeDTO.communicationTimestamps.sendTimestamp && nodeTimeDTO.communicationTimestamps.receiveTimestamp) {
                return new NodeTime(
                    UInt64.fromNumericString(nodeTimeDTO.communicationTimestamps.sendTimestamp),
                    UInt64.fromNumericString(nodeTimeDTO.communicationTimestamps.receiveTimestamp),
                );
            }
            throw Error('Node time not available');
        });
    }

    /**
     * Gets blockchain storage info.
     * @returns Observable<BlockchainStorageInfo>
     */
    public getStorageInfo(): Observable<StorageInfo> {
        return this.call(
            this.nodeRoutesApi.getNodeStorage(),
            (body) => new StorageInfo(body.numBlocks, body.numTransactions, body.numAccounts),
        );
    }

    /**
     * Gets blockchain server info.
     * @returns Observable<Server>
     */
    public getServerInfo(): Observable<ServerInfo> {
        return this.call(
            this.nodeRoutesApi.getServerInfo(),
            (body) =>
                new ServerInfo(
                    body.serverInfo.restVersion,
                    body.serverInfo.sdkVersion,
                    body.serverInfo?.deployment
                        ? new Deployment(
                              body.serverInfo.deployment.deploymentTool,
                              body.serverInfo.deployment.deploymentToolVersion,
                              body.serverInfo.deployment.lastUpdatedDate,
                          )
                        : undefined,
                ),
        );
    }

    /**
     * Gets blockchain server info.
     * @returns Observable<Server>
     */
    public getNodeHealth(): Observable<NodeHealth> {
        return this.call(this.nodeRoutesApi.getNodeHealth(), (body) => new NodeHealth(body.status.apiNode, body.status.db));
    }

    /**
     * Return unlocked harvesting account from node.
     * @returns Observable<string[]>
     */
    getUnlockedAccount(): Observable<string[]> {
        return this.call(this.nodeRoutesApi.getUnlockedAccount(), (body) => {
            return body.unlockedAccount;
        });
    }

    /**
     * It maps NodeInfoDTO to NodeInfo
     *
     * @param nodeInfo the dto object.
     * @returns the model object
     */
    private toNodeInfo(nodeInfo: NodeInfoDTO): NodeInfo {
        return new NodeInfo(
            nodeInfo.publicKey,
            nodeInfo.networkGenerationHashSeed,
            nodeInfo.port,
            nodeInfo.networkIdentifier,
            nodeInfo.version,
            this.getNodeRoles(nodeInfo.roles),
            nodeInfo.host,
            nodeInfo.friendlyName,
            nodeInfo.nodePublicKey,
        );
    }

    /**
     * Return user friendly role type list
     * @param roleType combined node role types
     */
    public getNodeRoles(roleType: number): RoleType[] {
        const roles: RoleType[] = [];
        if ((RoleType.PeerNode.valueOf() & roleType) != 0) {
            roles.push(RoleType.PeerNode);
        }
        if ((RoleType.ApiNode.valueOf() & roleType) != 0) {
            roles.push(RoleType.ApiNode);
        }
        if ((RoleType.VotingNode.valueOf() & roleType) != 0) {
            roles.push(RoleType.VotingNode);
        }
        if ((RoleType.IPv4Node.valueOf() & roleType) != 0) {
            roles.push(RoleType.IPv4Node);
        }
        if ((RoleType.IPv6Node.valueOf() & roleType) != 0) {
            roles.push(RoleType.IPv6Node);
        }
        return roles;
    }
}
