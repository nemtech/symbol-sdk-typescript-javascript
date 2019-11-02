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

import { ClientResponse } from 'http';
import { from as observableFrom, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BlockchainScore } from '../model/blockchain/BlockchainScore';
import { UInt64 } from '../model/UInt64';
import {
    ChainRoutesApi,
    ChainScoreDTO,
    HeightInfoDTO
} from 'nem2-sdk-openapi-typescript-node-client';
import { ChainRepository } from './ChainRepository';
import { Http } from './Http';

/**
 * Chian http repository.
 *
 * @since 1.0
 */
export class ChainHttp extends Http implements ChainRepository {
    /**
     * @internal
     * Nem2 Library chain routes api
     */
    private chainRoutesApi: ChainRoutesApi;

    /**
     * Constructor
     * @param url
     */
    constructor(url: string) {
        super();
        this.chainRoutesApi = new ChainRoutesApi(url);
    }

    /**
     * Gets current blockchain height
     * @returns Observable<UInt64>
     */
    public getBlockchainHeight(): Observable<UInt64> {
        return observableFrom(this.chainRoutesApi.getBlockchainHeight()).pipe(
            map((response: { response: ClientResponse; body: HeightInfoDTO; }) => {
                const heightDTO = response.body;
                return UInt64.fromNumericString(heightDTO.height);
            }),
            catchError((error) => throwError(this.errorHandling(error))),
        );
    }

    /**
     * Gets current blockchain score
     * @returns Observable<BlockchainScore>
     */
    public getChainScore(): Observable<BlockchainScore> {
        return observableFrom(this.chainRoutesApi.getChainScore()).pipe(
            map((response: { response: ClientResponse; body: ChainScoreDTO; }) => {
                const blockchainScoreDTO = response.body;
                return new BlockchainScore(
                    UInt64.fromNumericString(blockchainScoreDTO.scoreLow),
                    UInt64.fromNumericString(blockchainScoreDTO.scoreHigh),
                );
            }),
            catchError((error) => throwError(this.errorHandling(error))),
        );
    }
}
