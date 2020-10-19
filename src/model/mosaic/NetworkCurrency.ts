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

import { NamespaceId } from '../namespace/NamespaceId';
import { UInt64 } from '../UInt64';
import { Mosaic } from './Mosaic';
import { MosaicId } from './MosaicId';
import { UnresolvedMosaicId } from './UnresolvedMosaicId';

/**
 * An object that knows how to create Mosaics based on the Mosaic Info and Namespace configuration.
 */
export class NetworkCurrency {
    /**
     * NetworkCurrency for public / Public_test network.
     *
     * This represents the per-network currency mosaic. This mosaicId is aliased with namespace name `symbol.xym`.
     *
     * This simplifies offline operations but general applications should load the currency from the repository factory and network currency service.
     *
     * If you are creating a private network and you need offline access, you can create a NetworkCurrency in memory.
     *
     */
    public static readonly PUBLIC = new NetworkCurrency({
        unresolvedMosaicId: new NamespaceId('symbol.xym'),
        namespaceId: new NamespaceId('symbol.xym'),
        mosaicId: new MosaicId('5B66E76BECAD0860'),
        divisibility: 6,
        transferable: true,
        supplyMutable: false,
    });

    /**
     * The selected unresolved mosaic id used when creating {@link Mosaic}. This could either be the
     * Namespace or the Mosaic id.
     */
    public readonly unresolvedMosaicId: UnresolvedMosaicId;
    /**
     * Mosaic id of this currency. This value is optional if the user only wants to provide the mosaic
     * id. This value will be set if it's loaded by rest.
     */
    public readonly mosaicId?: MosaicId;
    /**
     * The Namespace id of this currency. This value is option if the user only wants to provide the
     * namespace id. This value will be set if it's loaded by rest.
     */
    public readonly namespaceId?: NamespaceId;

    /** Divisibility of this currency, required to create Mosaic from relative amounts. */
    public readonly divisibility: number;

    /** Is this currency transferable. */
    public readonly transferable: boolean;

    /** Is this currency supply mutable. */
    public readonly supplyMutable: boolean;

    constructor({
        unresolvedMosaicId,
        mosaicId,
        namespaceId,
        divisibility,
        transferable,
        supplyMutable,
    }: {
        unresolvedMosaicId?: UnresolvedMosaicId;
        mosaicId?: MosaicId;
        namespaceId?: NamespaceId;
        divisibility: number;
        transferable: boolean;
        supplyMutable: boolean;
    }) {
        const finalMosaicId = unresolvedMosaicId || namespaceId || mosaicId;
        if (!finalMosaicId) {
            throw new Error('At least one mosaic Id or Namespace id must be provided');
        }
        this.unresolvedMosaicId = finalMosaicId;
        this.mosaicId = mosaicId;
        this.namespaceId = namespaceId;
        this.divisibility = divisibility;
        this.transferable = transferable;
        this.supplyMutable = supplyMutable;
    }

    /**
     * Creates a Mosaic from this relative amount.
     *
     * @param amount
     * @returns {Mosaic}
     */
    public createRelative(amount: UInt64 | number): Mosaic {
        if (typeof amount === 'number') {
            return new Mosaic(this.unresolvedMosaicId, UInt64.fromUint(amount * Math.pow(10, this.divisibility)));
        }
        return new Mosaic(this.unresolvedMosaicId, UInt64.fromUint((amount as UInt64).compact() * Math.pow(10, this.divisibility)));
    }

    /**
     * Creates a Mosaic from this relative amount.
     *
     * @param amount
     * @returns {Mosaic}
     */
    public createAbsolute(amount: UInt64 | number): Mosaic {
        if (typeof amount === 'number') {
            return new Mosaic(this.unresolvedMosaicId, UInt64.fromUint(amount));
        }
        return new Mosaic(this.unresolvedMosaicId, amount);
    }
}
