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

import {from as observableFrom, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {BlockchainScore} from '../model/blockchain/BlockchainScore';
import {UInt64} from '../model/UInt64';
import { ChainRepository } from './ChainRepository';
import {Http} from './Http';

/**
 * Chian http repository.
 *
 * @since 1.0
 */
export class ChainHttp extends Http implements ChainRepository {
    /**
     * Constructor
     * @param url
     */
    constructor(url: string) {
        super(url);
    }

    /**
     * Gets current blockchain height
     * @returns Observable<UInt64>
     */
    public getBlockchainHeight(): Observable<UInt64> {
        const postBody = null;

        const pathParams = {
        };
        const queryParams = {
        };
        const headerParams = {
        };
        const formParams = {
        };

        const authNames = [];
        const contentTypes = [];
        const accepts = ['application/json'];

        const response = this.apiClient.callApi(
            '/chain/height', 'GET',
            pathParams, queryParams, headerParams, formParams, postBody,
            authNames, contentTypes, accepts);
        return observableFrom(response).pipe(map((heightDTO: any) => {
            return new UInt64(heightDTO.height);
        }));
    }

    /**
     * Gets current blockchain score
     * @returns Observable<BlockchainScore>
     */
    public getBlockchainScore(): Observable<BlockchainScore> {
        const postBody = null;

        const pathParams = {
        };
        const queryParams = {
        };
        const headerParams = {
        };
        const formParams = {
        };

        const authNames = [];
        const contentTypes = [];
        const accepts = ['application/json'];

        const response = this.apiClient.callApi(
            '/chain/score', 'GET',
            pathParams, queryParams, headerParams, formParams, postBody,
            authNames, contentTypes, accepts);
        return observableFrom(response).pipe(map((blockchainScoreDTO: any) => {
            return new BlockchainScore(
                new UInt64(blockchainScoreDTO.scoreLow),
                new UInt64(blockchainScoreDTO.scoreHigh),
            );
        }));
    }
}
