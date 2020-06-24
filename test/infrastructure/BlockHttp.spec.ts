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
    BlockDTO,
    BlockInfoDTO,
    BlockMetaDTO,
    BlockPage,
    BlockRoutesApi,
    MerklePathItemDTO,
    MerkleProofInfoDTO,
    NetworkTypeEnum,
    Pagination,
    PositionEnum,
} from 'symbol-openapi-typescript-fetch-client';
import { deepEqual, instance, mock, reset, when } from 'ts-mockito';
import { DtoMapping } from '../../src/core/utils/DtoMapping';
import { BlockHttp } from '../../src/infrastructure/BlockHttp';
import { BlockRepository } from '../../src/infrastructure/BlockRepository';
import { Address } from '../../src/model/account/Address';
import { BlockInfo } from '../../src/model/blockchain/BlockInfo';
import { MerklePathItem } from '../../src/model/blockchain/MerklePathItem';
import { MerklePosition } from '../../src/model/blockchain/MerklePosition';
import { NetworkType } from '../../src/model/network/NetworkType';
import { UInt64 } from '../../src/model/UInt64';

describe('BlockHttp', () => {
    const blockDTO = {} as BlockDTO;
    blockDTO.version = 1;
    blockDTO.network = NetworkTypeEnum.NUMBER_152;
    blockDTO.difficulty = '2';
    blockDTO.feeMultiplier = 3;
    blockDTO.height = '4';
    blockDTO.previousBlockHash = '5';
    blockDTO.type = 6;
    blockDTO.signerPublicKey = '81E5E7AE49998802DABC816EC10158D3A7879702FF29084C2C992CD1289877A7';
    blockDTO.timestamp = '7';
    blockDTO.beneficiaryAddress = Address.createFromPublicKey(
        '81E5E7AE49998802DABC816EC10158D3A7879702FF29084C2C992CD1289877A8',
        NetworkType.MIJIN_TEST,
    ).encoded();

    const blockMetaDTO = {} as BlockMetaDTO;
    blockMetaDTO.generationHash = 'abc';
    blockMetaDTO.hash = 'aHash';
    blockMetaDTO.numStatements = 10;
    blockMetaDTO.numTransactions = 20;
    blockMetaDTO.totalFee = '30';
    blockMetaDTO.stateHashSubCacheMerkleRoots = ['a', 'b', 'c'];

    const blockInfoDto = {} as BlockInfoDTO;
    blockInfoDto.block = blockDTO;
    blockInfoDto.meta = blockMetaDTO;

    const url = 'http://someHost';
    const response: http.IncomingMessage = mock();
    const blockRoutesApi: BlockRoutesApi = mock();
    const blockRepository: BlockRepository = DtoMapping.assign(new BlockHttp(url), {
        blockRoutesApi: instance(blockRoutesApi),
    });

    before(() => {
        reset(response);
        reset(blockRoutesApi);
    });

    function assertBlockInfo(blockInfo: BlockInfo): void {
        expect(blockInfo).to.be.not.null;
        expect(blockInfo.type).to.be.equals(blockInfoDto.block.type);
        expect(blockInfo.previousBlockHash).to.be.equals(blockInfoDto.block.previousBlockHash);
        expect(blockInfo.height.toString()).to.be.equals(blockInfoDto.block.height);
        expect(blockInfo.feeMultiplier).to.be.equals(blockInfoDto.block.feeMultiplier);
        expect(blockInfo.networkType).to.be.equals(blockInfoDto.block.network);
        expect(blockInfo.version).to.be.equals(blockInfoDto.block.version);
        expect(blockInfo.beneficiaryAddress?.encoded()).to.be.equals(blockInfoDto.block.beneficiaryAddress);
        expect(blockInfo.difficulty.toString()).to.be.equals(blockInfoDto.block.difficulty);
        expect(blockInfo.feeMultiplier).to.be.equals(blockInfoDto.block.feeMultiplier);
        expect(blockInfo.signer!.publicKey).to.be.equals(blockInfoDto.block.signerPublicKey);
        expect(blockInfo.signature).to.be.equals(blockInfoDto.block.signature);

        expect(blockInfo.generationHash).to.be.equals(blockInfoDto.meta.generationHash);
        expect(blockInfo.hash).to.be.equals(blockInfoDto.meta.hash);
        expect(blockInfo.numStatements).to.be.equals(blockInfoDto.meta.numStatements);
        expect(blockInfo.numTransactions).to.be.equals(blockInfoDto.meta.numTransactions);
        expect(blockInfo.totalFee.toString()).to.be.equals(blockInfoDto.meta.totalFee);
    }

    it('getBlockInfo', async () => {
        when(blockRoutesApi.getBlockByHeight('1')).thenReturn(Promise.resolve(blockInfoDto));
        const blockInfo = await blockRepository.getBlockByHeight(UInt64.fromUint(1)).toPromise();
        assertBlockInfo(blockInfo);
    });

    it('searchBlocks', async () => {
        const pagination = {} as Pagination;
        pagination.pageNumber = 1;
        pagination.pageSize = 1;
        pagination.totalEntries = 1;
        pagination.totalPages = 1;

        const body = {} as BlockPage;
        body.data = [blockInfoDto];
        body.pagination = pagination;
        when(
            blockRoutesApi.searchBlocks(
                deepEqual(blockDTO.signerPublicKey),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
            ),
        ).thenReturn(Promise.resolve(body));
        const blockInfos = await blockRepository.search({ signerPublicKey: blockDTO.signerPublicKey }).toPromise();
        assertBlockInfo(blockInfos.data[0]);
    });

    it('getMerkleTransaction', async () => {
        const merkleProofInfoDTO = {} as MerkleProofInfoDTO;
        const merklePathItemDTO = {} as MerklePathItemDTO;
        merklePathItemDTO.hash = 'bbb';
        merklePathItemDTO.position = PositionEnum.Left;
        merkleProofInfoDTO.merklePath = [merklePathItemDTO];

        when(blockRoutesApi.getMerkleTransaction('2', 'abc')).thenReturn(Promise.resolve(merkleProofInfoDTO));
        const merkleProofInfo = await blockRepository.getMerkleTransaction(UInt64.fromUint(2), 'abc').toPromise();
        expect(merkleProofInfo).to.be.not.null;
        expect(merkleProofInfo.merklePath).to.deep.equals([new MerklePathItem(MerklePosition.Left, 'bbb')]);
    });
});
