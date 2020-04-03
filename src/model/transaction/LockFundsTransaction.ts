/*
 * Copyright 2018 NEM
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
    BlockDurationDto,
    EmbeddedHashLockTransactionBuilder,
    EmbeddedTransactionBuilder,
    Hash256Dto,
    HashLockTransactionBuilder,
    KeyDto,
    SignatureDto,
    TimestampDto,
    UnresolvedMosaicBuilder,
    UnresolvedMosaicIdDto,
} from 'catbuffer-typescript';
import { Convert } from '../../core/format';
import { DtoMapping } from '../../core/utils/DtoMapping';
import { PublicAccount } from '../account/PublicAccount';
import { Mosaic } from '../mosaic/Mosaic';
import { MosaicId } from '../mosaic/MosaicId';
import { NetworkType } from '../network/NetworkType';
import { Statement } from '../receipt/Statement';
import { Deadline } from './Deadline';
import { InnerTransaction } from './InnerTransaction';
import { SignedTransaction } from './SignedTransaction';
import { Transaction } from './Transaction';
import { TransactionInfo } from './TransactionInfo';
import { TransactionType } from './TransactionType';
import { TransactionVersion } from './TransactionVersion';

/**
 * Lock funds transaction is used before sending an Aggregate bonded transaction, as a deposit to announce the transaction.
 * When aggregate bonded transaction is confirmed funds are returned to LockFundsTransaction signer.
 *
 * @since 1.0
 */
export class LockFundsTransaction extends Transaction {

    /**
     * Aggregate bonded hash.
     */
    public readonly hash: string;
    signedTransaction: SignedTransaction;

    /**
     * Create a Lock funds transaction object
     * @param deadline - The deadline to include the transaction.
     * @param mosaic - The locked mosaic.
     * @param duration - The funds lock duration.
     * @param signedTransaction - The signed transaction for which funds are locked.
     * @param networkType - The network type.
     * @param maxFee - (Optional) Max fee defined by the sender
     * @returns {LockFundsTransaction}
     */
    public static create(deadline: Deadline,
                         mosaic: Mosaic,
                         duration: bigint,
                         signedTransaction: SignedTransaction,
                         networkType: NetworkType,
                         maxFee: bigint = BigInt(0)): LockFundsTransaction {
        return new LockFundsTransaction(
            networkType,
            TransactionVersion.HASH_LOCK,
            deadline,
            maxFee,
            mosaic,
            duration,
            signedTransaction,
        );
    }

    /**
     * @param networkType
     * @param version
     * @param deadline
     * @param maxFee
     * @param mosaic
     * @param duration
     * @param signedTransaction
     * @param signature
     * @param signer
     * @param transactionInfo
     */
    constructor(networkType: NetworkType,
                version: number,
                deadline: Deadline,
                maxFee: bigint,
                /**
                 * The locked mosaic.
                 */
                public readonly mosaic: Mosaic,
                /**
                 * The funds lock duration.
                 */
                public readonly duration: bigint,
                signedTransaction: SignedTransaction,
                signature?: string,
                signer?: PublicAccount,
                transactionInfo?: TransactionInfo) {
        super(TransactionType.HASH_LOCK, networkType, version, deadline, maxFee, signature, signer, transactionInfo);
        this.hash = signedTransaction.hash;
        this.signedTransaction = signedTransaction;
        if (signedTransaction.type !== TransactionType.AGGREGATE_BONDED) {
            throw new Error('Signed transaction must be Aggregate Bonded Transaction');
        }
    }

    /**
     * Create a transaction object from payload
     * @param {string} payload Binary payload
     * @param {Boolean} isEmbedded Is embedded transaction (Default: false)
     * @returns {Transaction | InnerTransaction}
     */
    public static createFromPayload(payload: string,
                                    isEmbedded: boolean = false): Transaction | InnerTransaction {
        const builder = isEmbedded ? EmbeddedHashLockTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload)) :
            HashLockTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload));
        const signerPublicKey = Convert.uint8ToHex(builder.getSignerPublicKey().key);
        const networkType = builder.getNetwork().valueOf();
        const transaction = LockFundsTransaction.create(
            isEmbedded ? Deadline.create() : Deadline.createFromBigInt((builder as HashLockTransactionBuilder).getDeadline().timestamp),
            new Mosaic(
                new MosaicId(builder.getMosaic().mosaicId.unresolvedMosaicId),
                builder.getMosaic().amount.amount,
            ),
            builder.getDuration().blockDuration,
            new SignedTransaction('', Convert.uint8ToHex(builder.getHash().hash256), '', TransactionType.AGGREGATE_BONDED, networkType),
            networkType,
            isEmbedded ? BigInt(0) : (builder as HashLockTransactionBuilder).fee.amount);
        return isEmbedded ?
            transaction.toAggregate(PublicAccount.createFromPublicKey(signerPublicKey, networkType)) : transaction;
    }

    /**
     * @override Transaction.size()
     * @description get the byte size of a LockFundsTransaction
     * @returns {number}
     * @memberof LockFundsTransaction
     */
    public get size(): number {
        const byteSize = super.size;

        // set static byte size fields
        const byteMosaicId = 8;
        const byteAmount = 8;
        const byteDuration = 8;
        const byteHash = 32;

        return byteSize + byteMosaicId + byteAmount + byteDuration + byteHash;
    }

    /**
     * @internal
     * @returns {Uint8Array}
     */
    protected generateBytes(): Uint8Array {
        const signerBuffer = new Uint8Array(32);
        const signatureBuffer = new Uint8Array(64);

        const transactionBuilder = new HashLockTransactionBuilder(
            new SignatureDto(signatureBuffer),
            new KeyDto(signerBuffer),
            this.versionToDTO(),
            this.networkType.valueOf(),
            TransactionType.HASH_LOCK.valueOf(),
            new AmountDto(this.maxFee),
            new TimestampDto(this.deadline.toBigInt()),
            new UnresolvedMosaicBuilder(new UnresolvedMosaicIdDto(this.mosaic.id.id),
                new AmountDto(this.mosaic.amount)),
            new BlockDurationDto(this.duration),
            new Hash256Dto(Convert.hexToUint8(this.hash)),
        );
        return transactionBuilder.serialize();
    }

    /**
     * @internal
     * @returns {EmbeddedTransactionBuilder}
     */
    public toEmbeddedTransaction(): EmbeddedTransactionBuilder {
        return new EmbeddedHashLockTransactionBuilder(
            new KeyDto(Convert.hexToUint8(this.signer!.publicKey)),
            this.versionToDTO(),
            this.networkType.valueOf(),
            TransactionType.HASH_LOCK.valueOf(),
            new UnresolvedMosaicBuilder(new UnresolvedMosaicIdDto(this.mosaic.id.id),
                new AmountDto(this.mosaic.amount)),
            new BlockDurationDto(this.duration),
            new Hash256Dto(Convert.hexToUint8(this.hash)),
        );
    }

    /**
     * @internal
     * @param statement Block receipt statement
     * @param aggregateTransactionIndex Transaction index for aggregated transaction
     * @returns {LockFundsTransaction}
     */
    resolveAliases(statement: Statement, aggregateTransactionIndex: number = 0): LockFundsTransaction {
        const transactionInfo = this.checkTransactionHeightAndIndex();
        return DtoMapping.assign(this, {
            mosaic: statement.resolveMosaic(this.mosaic, transactionInfo.height.toString(),
            transactionInfo.index, aggregateTransactionIndex)});
    }
}
