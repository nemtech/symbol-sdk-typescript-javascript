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

import { from as observableFrom, Observable, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { MultisigRoutesApi } from 'symbol-openapi-typescript-node-client';
import { Address } from '../model/account/Address';
import { MultisigAccountGraphInfo } from '../model/account/MultisigAccountGraphInfo';
import { MultisigAccountInfo } from '../model/account/MultisigAccountInfo';
import { PublicAccount } from '../model/account/PublicAccount';
import { NetworkType } from '../model/network/NetworkType';
import { Http } from './Http';
import { MultisigRepository } from './MultisigRepository';

/**
 * Multisig http repository.
 *
 * @since 1.0
 */
export class MultisigHttp extends Http implements MultisigRepository {
    /**
     * @internal
     * Symbol openapi typescript-node client account routes api
     */
    private readonly multisigRoutesApi: MultisigRoutesApi;
    /**
     * @internal
     * network type for the mappings.
     */
    private readonly networkTypeObservable: Observable<NetworkType>;
    /**
     * Constructor
     * @param url
     * @param networkType
     */
    constructor(url: string, networkType?: NetworkType | Observable<NetworkType>) {
        super(url);
        this.multisigRoutesApi = new MultisigRoutesApi(url);
        this.networkTypeObservable = this.createNetworkTypeObservable(networkType);
    }

    /**
     * Gets a MultisigAccountInfo for an account.
     * @param address - * Address can be created rawAddress or publicKey
     * @returns Observable<MultisigAccountInfo>
     */
    public getMultisigAccountInfo(address: Address): Observable<MultisigAccountInfo> {
        return this.networkTypeObservable.pipe(
            mergeMap((networkType) => observableFrom(
                this.multisigRoutesApi.getAccountMultisig(address.plain()))
                    .pipe(map(({body}) => new MultisigAccountInfo(
                        PublicAccount.createFromPublicKey(body.multisig.accountPublicKey, networkType),
                        body.multisig.minApproval,
                        body.multisig.minRemoval,
                        body.multisig.cosignatoryPublicKeys
                            .map((cosigner) => PublicAccount.createFromPublicKey(cosigner, networkType)),
                        body.multisig.multisigPublicKeys
                            .map((multisigAccount) => PublicAccount.createFromPublicKey(multisigAccount, networkType)),
                    )),
                catchError((error) =>  throwError(this.errorHandling(error))),
        )));
    }

    /**
     * Gets a MultisigAccountGraphInfo for an account.
     * @param address - * Address can be created rawAddress or publicKey
     * @returns Observable<MultisigAccountGraphInfo>
     */
    public getMultisigAccountGraphInfo(address: Address): Observable<MultisigAccountGraphInfo> {
        return this.networkTypeObservable.pipe(
            mergeMap((networkType) => observableFrom(
                this.multisigRoutesApi.getAccountMultisigGraph(address.plain()))
                    .pipe(map(({body}) => {
                        const multisigAccountGraphInfosDTO = body;
                        const multisigAccounts = new Map<number, MultisigAccountInfo[]>();
                        multisigAccountGraphInfosDTO.map((multisigAccountGraphInfoDTO) => {
                            multisigAccounts.set(multisigAccountGraphInfoDTO.level,
                                multisigAccountGraphInfoDTO.multisigEntries.map((multisigAccountInfoDTO) => {
                                    return new MultisigAccountInfo(
                                        PublicAccount.createFromPublicKey(multisigAccountInfoDTO.multisig.accountPublicKey, networkType),
                                        multisigAccountInfoDTO.multisig.minApproval,
                                        multisigAccountInfoDTO.multisig.minRemoval,
                                        multisigAccountInfoDTO.multisig.cosignatoryPublicKeys
                                            .map((cosigner) => PublicAccount.createFromPublicKey(cosigner, networkType)),
                                        multisigAccountInfoDTO.multisig.multisigPublicKeys
                                            .map((multisigAccountDTO) =>
                                                PublicAccount.createFromPublicKey(multisigAccountDTO, networkType)));
                                }),
                            );
                        });
                        return new MultisigAccountGraphInfo(multisigAccounts);
                    }),
                    catchError((error) =>  throwError(this.errorHandling(error))),
        )));
    }
}
