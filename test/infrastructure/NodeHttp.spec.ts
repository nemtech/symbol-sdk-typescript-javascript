/*
 * Copyright 2020 NEM
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
import { expect } from 'chai';
import * as http from 'http';
import {
    CommunicationTimestampsDTO,
    NodeHealthDTO,
    NodeHealthInfoDTO,
    NodeInfoDTO,
    NodeRoutesApi,
    NodeStatusEnum,
    NodeTimeDTO,
    ServerDTO,
    ServerInfoDTO,
    StorageInfoDTO,
} from 'symbol-openapi-typescript-fetch-client';
import { instance, mock, reset, when } from 'ts-mockito';
import { DtoMapping } from '../../src/core/utils';
import { NodeHttp } from '../../src/infrastructure';
import { RoleType } from '../../src/model';
import { NetworkType } from '../../src/model/network';

describe('NodeHttp', () => {
    const url = 'http://someHost';
    const response: http.IncomingMessage = mock();
    const nodeRoutesApi: NodeRoutesApi = mock();
    const nodeRepository = DtoMapping.assign(new NodeHttp(url), { nodeRoutesApi: instance(nodeRoutesApi) });

    before(() => {
        reset(response);
        reset(nodeRoutesApi);
    });

    it('getNodeHealth', async () => {
        const body = {} as NodeHealthInfoDTO;
        body.status = {} as NodeHealthDTO;
        body.status.apiNode = NodeStatusEnum.Down;
        body.status.db = NodeStatusEnum.Up;

        when(nodeRoutesApi.getNodeHealth()).thenReturn(Promise.resolve(body));

        const nodeHealth = await nodeRepository.getNodeHealth().toPromise();
        expect(nodeHealth).to.be.not.null;
        expect(nodeHealth.apiNode).to.be.equals(NodeStatusEnum.Down);
        expect(nodeHealth.db).to.be.equals(NodeStatusEnum.Up);
    });

    it('getServerInfo', async () => {
        const body = {} as ServerInfoDTO;
        body.serverInfo = {} as ServerDTO;
        body.serverInfo.restVersion = 'Some Rest Version';
        body.serverInfo.sdkVersion = 'Some SDK Version';

        when(nodeRoutesApi.getServerInfo()).thenReturn(Promise.resolve(body));

        const serverInfo = await nodeRepository.getServerInfo().toPromise();
        expect(serverInfo).to.be.not.null;
        expect(serverInfo.restVersion).to.be.equals(body.serverInfo.restVersion);
        expect(serverInfo.sdkVersion).to.be.equals(body.serverInfo.sdkVersion);
        expect(serverInfo.deployment).to.be.undefined;
    });

    it('getServerInfo with deployment', async () => {
        const body: ServerInfoDTO = {
            serverInfo: {
                restVersion: 'Some Rest Version',
                sdkVersion: 'Some SDK Version',
                deployment: {
                    deploymentTool: 'symbol-bootstrap',
                    deploymentToolVersion: '1.0.6-alpha-202105280712',
                    lastUpdatedDate: '2021-06-02',
                },
            },
        };

        when(nodeRoutesApi.getServerInfo()).thenReturn(Promise.resolve(body));
        const serverInfo = await nodeRepository.getServerInfo().toPromise();
        expect(serverInfo).to.be.not.null;
        expect(serverInfo.restVersion).to.be.equals(body.serverInfo.restVersion);
        expect(serverInfo.deployment).to.be.deep.equals(body.serverInfo.deployment);
    });

    it('getNodeInfo', async () => {
        const body = {} as NodeInfoDTO;
        body.networkIdentifier = NetworkType.TEST_NET;
        body.friendlyName = 'Some Friendly name';
        body.networkGenerationHashSeed = 'Some Gen Hash';
        body.host = 'Some Host';
        body.port = 1234;
        body.publicKey = 'Some Public Key';
        body.roles = 1;
        body.version = 4567;

        when(nodeRoutesApi.getNodeInfo()).thenReturn(Promise.resolve(body));

        const nodeInfo = await nodeRepository.getNodeInfo().toPromise();
        expect(nodeInfo).to.be.not.null;
        expect(nodeInfo.friendlyName).to.be.equal(body.friendlyName);
        expect(nodeInfo.host).to.be.equal(body.host);
        expect(nodeInfo.networkGenerationHashSeed).to.be.equal(body.networkGenerationHashSeed);
        expect(nodeInfo.networkIdentifier).to.deep.equal(body.networkIdentifier);
        expect(nodeInfo.port).to.be.equal(body.port);
        expect(nodeInfo.publicKey).to.be.equal(body.publicKey);
        expect(nodeInfo.version).to.be.equal(body.version);
        expect(
            nodeInfo.roles
                .map((r) => r.valueOf())
                .reduce(function (a, b) {
                    return a | b;
                }, 0),
        ).to.be.equal(body.roles);
    });

    it('getNodeInfo - Full node', async () => {
        const body = {} as NodeInfoDTO;
        body.networkIdentifier = NetworkType.TEST_NET;
        body.friendlyName = 'Some Friendly name';
        body.networkGenerationHashSeed = 'Some Gen Hash';
        body.host = 'Some Host';
        body.port = 1234;
        body.publicKey = 'Some Public Key';
        body.roles = 7;
        body.version = 4567;

        when(nodeRoutesApi.getNodeInfo()).thenReturn(Promise.resolve(body));

        const nodeInfo = await nodeRepository.getNodeInfo().toPromise();
        expect(nodeInfo).to.be.not.null;
        expect(nodeInfo.friendlyName).to.be.equal(body.friendlyName);
        expect(nodeInfo.host).to.be.equal(body.host);
        expect(nodeInfo.networkGenerationHashSeed).to.be.equal(body.networkGenerationHashSeed);
        expect(nodeInfo.networkIdentifier).to.deep.equal(body.networkIdentifier);
        expect(nodeInfo.port).to.be.equal(body.port);
        expect(nodeInfo.publicKey).to.be.equal(body.publicKey);
        expect(nodeInfo.version).to.be.equal(body.version);
        expect(
            nodeInfo.roles
                .map((r) => r.valueOf())
                .reduce(function (a, b) {
                    return a | b;
                }, 0),
        ).to.be.equal(body.roles);
        expect(nodeInfo.roles.indexOf(RoleType.ApiNode) !== -1).to.be.true;
        expect(nodeInfo.roles.indexOf(RoleType.PeerNode) !== -1).to.be.true;
        expect(nodeInfo.roles.indexOf(RoleType.VotingNode) !== -1).to.be.true;
    });

    it('getNodePeers', async () => {
        const body = {} as NodeInfoDTO;
        body.networkIdentifier = NetworkType.TEST_NET;
        body.friendlyName = 'Some Friendly name';
        body.networkGenerationHashSeed = 'Some Gen Hash';
        body.host = 'Some Host';
        body.port = 1234;
        body.publicKey = 'Some Public Key';
        body.roles = 1;
        body.version = 4567;

        when(nodeRoutesApi.getNodePeers()).thenReturn(Promise.resolve([body]));

        const nodeInfoList = await nodeRepository.getNodePeers().toPromise();
        const nodeInfo = nodeInfoList[0];
        expect(nodeInfo).to.be.not.null;
        expect(nodeInfo.friendlyName).to.be.equal(body.friendlyName);
        expect(nodeInfo.host).to.be.equal(body.host);
        expect(nodeInfo.networkGenerationHashSeed).to.be.equal(body.networkGenerationHashSeed);
        expect(nodeInfo.networkIdentifier).to.deep.equal(body.networkIdentifier);
        expect(nodeInfo.port).to.be.equal(body.port);
        expect(nodeInfo.publicKey).to.be.equal(body.publicKey);
        expect(nodeInfo.version).to.be.equal(body.version);
        expect(
            nodeInfo.roles
                .map((r) => r.valueOf())
                .reduce(function (a, b) {
                    return a | b;
                }, 0),
        ).to.be.equal(body.roles);
    });

    it('getNodeTime', async () => {
        const body = {} as NodeTimeDTO;
        body.communicationTimestamps = {} as CommunicationTimestampsDTO;
        body.communicationTimestamps.receiveTimestamp = '1111';
        body.communicationTimestamps.sendTimestamp = '2222';

        when(nodeRoutesApi.getNodeTime()).thenReturn(Promise.resolve(body));

        const nodeTime = await nodeRepository.getNodeTime().toPromise();
        expect(nodeTime).to.be.not.null;
        if (nodeTime.receiveTimeStamp && nodeTime.sendTimeStamp) {
            expect(nodeTime.receiveTimeStamp.toDTO()).to.deep.equals([1111, 0]);
            expect(nodeTime.sendTimeStamp.toDTO()).to.deep.equals([2222, 0]);
        }
    });

    it('getNodeTim When No Timestamp', async () => {
        const body = {} as NodeTimeDTO;
        body.communicationTimestamps = {} as CommunicationTimestampsDTO;
        body.communicationTimestamps.receiveTimestamp = '1111';

        when(nodeRoutesApi.getNodeTime()).thenReturn(Promise.resolve(body));

        try {
            await nodeRepository.getNodeTime().toPromise();
        } catch (e) {
            expect(e.message).to.deep.equals('Node time not available');
        }
    });

    it('getUnlockedAccount', async () => {
        const body = { unlockedAccount: ['key1', 'key2'] };

        when(nodeRoutesApi.getUnlockedAccount()).thenReturn(Promise.resolve(body));

        const unlockedAccount = await nodeRepository.getUnlockedAccount().toPromise();
        expect(unlockedAccount).to.be.not.null;
        expect(unlockedAccount[0]).to.be.equal('key1');
        expect(unlockedAccount[1]).to.be.equal('key2');
    });

    it('getStorageInfo', async () => {
        const body = {} as StorageInfoDTO;
        body.numAccounts = 1;
        body.numBlocks = 2;
        body.numTransactions = 3;

        when(nodeRoutesApi.getNodeStorage()).thenReturn(Promise.resolve(body));

        const storageInfo = await nodeRepository.getStorageInfo().toPromise();
        expect(storageInfo).to.deep.equals(body);
    });

    it('getStorageInfo on Exception on response body text', async () => {
        when(nodeRoutesApi.getNodeStorage()).thenReturn(
            Promise.reject({
                response: { statusCode: 500, statusMessage: 'Some Error', body: 'The Body' },
            }),
        );
        try {
            await nodeRepository.getStorageInfo().toPromise();
        } catch (e) {
            expect(e.message).to.deep.equals('{"statusCode":500,"statusMessage":"Some Error","body":"The Body"}');
        }
    });

    it('getStorageInfo on Exception on response body object', async () => {
        when(nodeRoutesApi.getNodeStorage()).thenReturn(
            Promise.reject({
                response: { statusCode: 500, statusMessage: 'Some Error', body: { someResponse: 'the body' } },
            }),
        );
        try {
            await nodeRepository.getStorageInfo().toPromise();
        } catch (e) {
            expect(e.message).to.deep.equals(
                '{"statusCode":500,"statusMessage":"Some Error","body":"{\\"someResponse\\":\\"the body\\"}"}',
            );
        }
    });

    it('getNodeRoles for different values', () => {
        expect(nodeRepository.getNodeRoles(0)).to.be.deep.eq([]);
        expect(nodeRepository.getNodeRoles(1)).to.be.deep.eq([RoleType.PeerNode]);
        expect(nodeRepository.getNodeRoles(2)).to.be.deep.eq([RoleType.ApiNode]);
        expect(nodeRepository.getNodeRoles(3)).to.be.deep.eq([RoleType.PeerNode, RoleType.ApiNode]);
        expect(nodeRepository.getNodeRoles(4)).to.be.deep.eq([RoleType.VotingNode]);
        expect(nodeRepository.getNodeRoles(7)).to.be.deep.eq([RoleType.PeerNode, RoleType.ApiNode, RoleType.VotingNode]);
        expect(nodeRepository.getNodeRoles(64)).to.be.deep.eq([RoleType.IPv4Node]);
        expect(nodeRepository.getNodeRoles(128)).to.be.deep.eq([RoleType.IPv6Node]);
        expect(nodeRepository.getNodeRoles(129)).to.be.deep.eq([RoleType.PeerNode, RoleType.IPv6Node]);
    });

    it('getStorageInfo on Exception on fetch response text function', async () => {
        when(nodeRoutesApi.getNodeStorage()).thenReturn(
            Promise.reject({ status: 500, statusText: 'Some Error', text: () => Promise.resolve('Some body text') }),
        );
        try {
            await nodeRepository.getStorageInfo().toPromise();
        } catch (e) {
            expect(e.message).to.deep.equals('{"statusCode":500,"statusMessage":"Some Error","body":"Some body text"}');
        }
    });
});
