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

import {
    AmountDto,
    EmbeddedMosaicMetadataTransactionBuilder,
    EmbeddedTransactionBuilder,
    KeyDto,
    MosaicMetadataTransactionBuilder,
    SignatureDto,
    TimestampDto,
    UnresolvedMosaicIdDto,
} from 'catbuffer-typescript';
import { Convert } from '../../core/format';
import { DtoMapping } from '../../core/utils/DtoMapping';
import { UnresolvedMapping } from '../../core/utils/UnresolvedMapping';
import { PublicAccount } from '../account/PublicAccount';
import { MosaicId } from '../mosaic/MosaicId';
import { NamespaceId } from '../namespace/NamespaceId';
import { NetworkType } from '../network/NetworkType';
import { Statement } from '../receipt/Statement';
import { UInt64 } from '../UInt64';
import { Deadline } from './Deadline';
import { InnerTransaction } from './InnerTransaction';
import { Transaction } from './Transaction';
import { TransactionInfo } from './TransactionInfo';
import { TransactionType } from './TransactionType';
import { TransactionVersion } from './TransactionVersion';

/**
 * Announce an mosaic metadata transaction to associate a key-value state to an account.
 */
export class MosaicMetadataTransaction extends Transaction {
    /**
     * Create a mosaic meta data transaction object
     * @param deadline - transaction deadline
     * @param targetPublicKey - Public key of the target account.
     * @param scopedMetadataKey - Metadata key scoped to source, target and type.
     * @param targetMosaicId - Target unresolved mosaic identifier.
     * @param valueSizeDelta - Change in value size in bytes.
     * @param value - String value with UTF-8 encoding
     *                Difference between the previous value and new value.
     *                You can calculate value as xor(previous-value, new-value).
     *                If there is no previous value, use directly the new value.
     * @param maxFee - (Optional) Max fee defined by the sender
     * @param signature - (Optional) Transaction signature
     * @param signer - (Optional) Signer public account
     * @returns {MosaicMetadataTransaction}
     */
    public static create(
        deadline: Deadline,
        targetPublicKey: string,
        scopedMetadataKey: UInt64,
        targetMosaicId: MosaicId | NamespaceId,
        valueSizeDelta: number,
        value: string,
        networkType: NetworkType,
        maxFee: UInt64 = new UInt64([0, 0]),
        signature?: string,
        signer?: PublicAccount,
    ): MosaicMetadataTransaction {
        return new MosaicMetadataTransaction(
            networkType,
            TransactionVersion.MOSAIC_METADATA,
            deadline,
            maxFee,
            targetPublicKey,
            scopedMetadataKey,
            targetMosaicId,
            valueSizeDelta,
            value,
            signature,
            signer,
        );
    }

    /**
     * @param networkType
     * @param version
     * @param deadline
     * @param maxFee
     * @param targetPublicKey
     * @param scopedMetadataKey
     * @param targetMosaicId
     * @param valueSizeDelta
     * @param value
     * @param signature
     * @param signer
     * @param transactionInfo
     */
    constructor(
        networkType: NetworkType,
        version: number,
        deadline: Deadline,
        maxFee: UInt64,
        /**
         * Public key of the target account.
         */
        public readonly targetPublicKey: string,
        /**
         * Metadata key scoped to source, target and type.
         */
        public readonly scopedMetadataKey: UInt64,
        /**
         * Target mosaic identifier.
         */
        public readonly targetMosaicId: MosaicId | NamespaceId,
        /**
         * Change in value size in bytes.
         */
        public readonly valueSizeDelta: number,
        /**
         * String value with UTF-8 encoding.
         * Difference between the previous value and new value.
         */
        public readonly value: string,
        signature?: string,
        signer?: PublicAccount,
        transactionInfo?: TransactionInfo,
    ) {
        super(TransactionType.MOSAIC_METADATA, networkType, version, deadline, maxFee, signature, signer, transactionInfo);
    }

    /**
     * Create a transaction object from payload
     * @param {string} payload Binary payload
     * @param {Boolean} isEmbedded Is embedded transaction (Default: false)
     * @returns {Transaction | InnerTransaction}
     */
    public static createFromPayload(payload: string, isEmbedded = false): Transaction | InnerTransaction {
        const builder = isEmbedded
            ? EmbeddedMosaicMetadataTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload))
            : MosaicMetadataTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload));
        const signerPublicKey = Convert.uint8ToHex(builder.getSignerPublicKey().key);
        const networkType = builder.getNetwork().valueOf();
        const signature = payload.substring(16, 144);
        const transaction = MosaicMetadataTransaction.create(
            isEmbedded ? Deadline.create() : Deadline.createFromDTO((builder as MosaicMetadataTransactionBuilder).getDeadline().timestamp),
            Convert.uint8ToHex(builder.getTargetPublicKey().key),
            new UInt64(builder.getScopedMetadataKey()),
            UnresolvedMapping.toUnresolvedMosaic(new UInt64(builder.getTargetMosaicId().unresolvedMosaicId).toHex()),
            builder.getValueSizeDelta(),
            Convert.uint8ToUtf8(builder.getValue()),
            networkType,
            isEmbedded ? new UInt64([0, 0]) : new UInt64((builder as MosaicMetadataTransactionBuilder).fee.amount),
            isEmbedded || signature.match(`^[0]+$`) ? undefined : signature,
            signerPublicKey.match(`^[0]+$`) ? undefined : PublicAccount.createFromPublicKey(signerPublicKey, networkType),
        );
        return isEmbedded ? transaction.toAggregate(PublicAccount.createFromPublicKey(signerPublicKey, networkType)) : transaction;
    }

    /**
     * @override Transaction.size()
     * @description get the byte size of a AccountLinkTransaction
     * @returns {number}
     * @memberof AccountLinkTransaction
     */
    public get size(): number {
        const byteSize = super.size;

        // set static byte size fields
        const targetPublicKey = 32;
        const byteScopedMetadataKey = 8;
        const byteTargetMosaicId = 8;
        const byteValueSizeDelta = 2;
        const valueSize = 2;

        return byteSize + targetPublicKey + byteScopedMetadataKey + byteTargetMosaicId + byteValueSizeDelta + valueSize + this.value.length;
    }

    /**
     * @internal
     * @returns {Uint8Array}
     */
    protected generateBytes(): Uint8Array {
        const signerBuffer = this.signer !== undefined ? Convert.hexToUint8(this.signer.publicKey) : new Uint8Array(32);
        const signatureBuffer = this.signature !== undefined ? Convert.hexToUint8(this.signature) : new Uint8Array(64);

        const transactionBuilder = new MosaicMetadataTransactionBuilder(
            new SignatureDto(signatureBuffer),
            new KeyDto(signerBuffer),
            this.versionToDTO(),
            this.networkType.valueOf(),
            TransactionType.MOSAIC_METADATA.valueOf(),
            new AmountDto(this.maxFee.toDTO()),
            new TimestampDto(this.deadline.toDTO()),
            new KeyDto(Convert.hexToUint8(this.targetPublicKey)),
            this.scopedMetadataKey.toDTO(),
            new UnresolvedMosaicIdDto(this.targetMosaicId.id.toDTO()),
            this.valueSizeDelta,
            Convert.utf8ToUint8(this.value),
        );
        return transactionBuilder.serialize();
    }

    /**
     * @internal
     * @returns {EmbeddedTransactionBuilder}
     */
    public toEmbeddedTransaction(): EmbeddedTransactionBuilder {
        return new EmbeddedMosaicMetadataTransactionBuilder(
            new KeyDto(Convert.hexToUint8(this.signer!.publicKey)),
            this.versionToDTO(),
            this.networkType.valueOf(),
            TransactionType.MOSAIC_METADATA.valueOf(),
            new KeyDto(Convert.hexToUint8(this.targetPublicKey)),
            this.scopedMetadataKey.toDTO(),
            new UnresolvedMosaicIdDto(this.targetMosaicId.id.toDTO()),
            this.valueSizeDelta,
            Convert.utf8ToUint8(this.value),
        );
    }

    /**
     * @internal
     * @param statement Block receipt statement
     * @param aggregateTransactionIndex Transaction index for aggregated transaction
     * @returns {MosaicMetadataTransaction}
     */
    resolveAliases(statement: Statement, aggregateTransactionIndex = 0): MosaicMetadataTransaction {
        const transactionInfo = this.checkTransactionHeightAndIndex();
        return DtoMapping.assign(this, {
            targetMosaicId: statement.resolveMosaicId(
                this.targetMosaicId,
                transactionInfo.height.toString(),
                transactionInfo.index,
                aggregateTransactionIndex,
            ),
        });
    }
}
