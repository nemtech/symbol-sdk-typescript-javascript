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

import { UInt64 } from '../UInt64';
import { MetadataType } from './MetadataType';
import { Address } from '../account/Address';
import { MosaicId } from '../mosaic/MosaicId';
import { NamespaceId } from '../namespace/NamespaceId';

/**
 * A mosaic describes an instance of a mosaic definition.
 * Mosaics can be transferred by means of a transfer transaction.
 */
export class MetadataEntry {
    /**
     * Constructor
     * @param {string} compositeHash - The composite hash
     * @param {string} sourceAddress - The metadata source address (provider)
     * @param {string} targetAddress - The metadata target address
     * @param {UInt64} scopedMetadataKey - The key scoped to source, target and type
     * @param {MetadatType} metadataType - The metadata type (Account | Mosaic | Namespace)
     * @param {string} value - The metadata value
     * @param {UnresolvedMosaicId | undefined} targetId - The target mosaic or namespace identifier
     */
    constructor(
        /**
         * The composite hash
         */
        public readonly compositeHash: string,
        /**
         * The metadata source address (provider)
         */
        public readonly sourceAddress: Address,
        /**
         * The metadata target address
         */
        public readonly targetAddress: Address,
        /**
         * The key scoped to source, target and type
         */
        public readonly scopedMetadataKey: UInt64,
        /**
         * The metadata type
         */
        public readonly metadataType: MetadataType,
        /**
         * The metadata value
         */
        public readonly value: string,
        /**
         * The target mosaic or namespace identifier
         */
        public readonly targetId?: MosaicId | NamespaceId,
    ) {}
}
