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
    EmbeddedSecretLockTransactionBuilder,
    EmbeddedTransactionBuilder,
    Hash256Dto,
    KeyDto,
    SecretLockTransactionBuilder,
    SignatureDto,
    TimestampDto,
    UnresolvedAddressDto,
    UnresolvedMosaicBuilder,
    UnresolvedMosaicIdDto,
} from 'catbuffer-typescript';
import { Convert, Convert as convert } from '../../core/format';
import { DtoMapping } from '../../core/utils/DtoMapping';
import { UnresolvedMapping } from '../../core/utils/UnresolvedMapping';
import { Address } from '../account/Address';
import { PublicAccount } from '../account/PublicAccount';
import { Mosaic } from '../mosaic/Mosaic';
import { NamespaceId } from '../namespace/NamespaceId';
import { NetworkType } from '../network/NetworkType';
import { Statement } from '../receipt/Statement';
import { Deadline } from './Deadline';
import { LockHashAlgorithmLengthValidator, LockHashAlgorithm } from './LockHashAlgorithm';
import { InnerTransaction } from './InnerTransaction';
import { Transaction } from './Transaction';
import { TransactionInfo } from './TransactionInfo';
import { TransactionType } from './TransactionType';
import { TransactionVersion } from './TransactionVersion';

export class SecretLockTransaction extends Transaction {

    /**
     * Create a secret lock transaction object.
     *
     * @param deadline - The deadline to include the transaction.
     * @param mosaic - The locked mosaic.
     * @param duration - The funds lock duration.
     * @param hashAlgorithm - The hash algorithm secret is generated with.
     * @param secret - The proof hashed.
     * @param recipientAddress - The unresolved recipient address of the funds.
     * @param networkType - The network type.
     * @param maxFee - (Optional) Max fee defined by the sender
     *
     * @return a SecretLockTransaction instance
     */
    public static create(deadline: Deadline,
                         mosaic: Mosaic,
                         duration: bigint,
                         hashAlgorithm: LockHashAlgorithm,
                         secret: string,
                         recipientAddress: Address | NamespaceId,
                         networkType: NetworkType,
                         maxFee: bigint = BigInt(0)): SecretLockTransaction {
        return new SecretLockTransaction(
            networkType,
            TransactionVersion.SECRET_LOCK,
            deadline,
            maxFee,
            mosaic,
            duration,
            hashAlgorithm,
            secret,
            recipientAddress,
        );
    }

    /**
     * @param networkType
     * @param version
     * @param deadline
     * @param maxFee
     * @param mosaic
     * @param duration
     * @param hashAlgorithm
     * @param secret
     * @param recipientAddress
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
                 * The duration for the funds to be released or returned.
                 */
                public readonly duration: bigint,
                /**
                 * The hash algorithm, secret is generated with.
                 */
                public readonly hashAlgorithm: LockHashAlgorithm,
                /**
                 * The proof hashed.
                 */
                public readonly secret: string,
                /**
                 * The unresolved recipientAddress of the funds.
                 */
                public readonly recipientAddress: Address | NamespaceId,
                signature?: string,
                signer?: PublicAccount,
                transactionInfo?: TransactionInfo) {
        super(TransactionType.SECRET_LOCK, networkType, version, deadline, maxFee, signature, signer, transactionInfo);
        if (!LockHashAlgorithmLengthValidator(hashAlgorithm, this.secret)) {
            throw new Error('HashAlgorithm and Secret have incompatible length or not hexadecimal string');
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
        const builder = isEmbedded ? EmbeddedSecretLockTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload)) :
            SecretLockTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload));
        const signerPublicKey = Convert.uint8ToHex(builder.getSignerPublicKey().key);
        const networkType = builder.getNetwork().valueOf();
        const transaction = SecretLockTransaction.create(
            isEmbedded ? Deadline.create() : Deadline.createFromBigInt(
                (builder as SecretLockTransactionBuilder).getDeadline().timestamp),
            new Mosaic(
                UnresolvedMapping.toUnresolvedMosaic(builder.getMosaic().mosaicId.unresolvedMosaicId),
                builder.getMosaic().amount.amount,
            ),
            builder.getDuration().blockDuration,
            builder.getHashAlgorithm().valueOf(),
            Convert.uint8ToHex(builder.getSecret().hash256),
            UnresolvedMapping.toUnresolvedAddress(Convert.uint8ToHex(builder.getRecipientAddress().unresolvedAddress)),
            networkType,
            isEmbedded ? BigInt(0) : (builder as SecretLockTransactionBuilder).fee.amount);
        return isEmbedded ?
            transaction.toAggregate(PublicAccount.createFromPublicKey(signerPublicKey, networkType)) : transaction;
    }

    /**
     * @override Transaction.size()
     * @description get the byte size of a SecretLockTransaction
     * @returns {number}
     * @memberof SecretLockTransaction
     */
    public get size(): number {
        const byteSize = super.size;

        // set static byte size fields
        const byteMosaicId = 8;
        const byteAmount = 8;
        const byteDuration = 8;
        const byteAlgorithm = 1;
        const byteRecipient = 25;

        // convert secret to uint8
        const byteSecret = convert.hexToUint8(this.secret).length;

        return byteSize + byteMosaicId + byteAmount + byteDuration + byteAlgorithm + byteRecipient + byteSecret;
    }

    /**
     * @description Get secret bytes
     * @returns {Uint8Array}
     * @memberof SecretLockTransaction
     */
    public getSecretByte(): Uint8Array {
        return convert.hexToUint8(64 > this.secret.length ? this.secret + '0'.repeat(64 - this.secret.length) : this.secret);
    }

    /**
     * @internal
     * @returns {Uint8Array}
     */
    protected generateBytes(): Uint8Array {
        const signerBuffer = new Uint8Array(32);
        const signatureBuffer = new Uint8Array(64);

        const transactionBuilder = new SecretLockTransactionBuilder(
            new SignatureDto(signatureBuffer),
            new KeyDto(signerBuffer),
            this.versionToDTO(),
            this.networkType.valueOf(),
            TransactionType.SECRET_LOCK.valueOf(),
            new AmountDto(this.maxFee),
            new TimestampDto(this.deadline.toBigInt()),
            new Hash256Dto(this.getSecretByte()),
            new UnresolvedMosaicBuilder(new UnresolvedMosaicIdDto(this.mosaic.id.id),
                new AmountDto(this.mosaic.amount)),
            new BlockDurationDto(this.duration),
            this.hashAlgorithm.valueOf(),
            new UnresolvedAddressDto(UnresolvedMapping.toUnresolvedAddressBytes(this.recipientAddress, this.networkType)),
        );
        return transactionBuilder.serialize();
    }

    /**
     * @internal
     * @returns {EmbeddedTransactionBuilder}
     */
    public toEmbeddedTransaction(): EmbeddedTransactionBuilder {
        return new EmbeddedSecretLockTransactionBuilder(
            new KeyDto(convert.hexToUint8(this.signer!.publicKey)),
            this.versionToDTO(),
            this.networkType.valueOf(),
            TransactionType.SECRET_LOCK.valueOf(),
            new Hash256Dto(this.getSecretByte()),
            new UnresolvedMosaicBuilder(new UnresolvedMosaicIdDto(this.mosaic.id.id),
                new AmountDto(this.mosaic.amount)),
            new BlockDurationDto(this.duration),
            this.hashAlgorithm.valueOf(),
            new UnresolvedAddressDto(UnresolvedMapping.toUnresolvedAddressBytes(this.recipientAddress, this.networkType)),
        );
    }

    /**
     * @internal
     * @param statement Block receipt statement
     * @param aggregateTransactionIndex Transaction index for aggregated transaction
     * @returns {SecretLockTransaction}
     */
    resolveAliases(statement: Statement, aggregateTransactionIndex: number = 0): SecretLockTransaction {
        const transactionInfo = this.checkTransactionHeightAndIndex();
        return DtoMapping.assign(this, {
            recipientAddress: statement.resolveAddress(this.recipientAddress,
                transactionInfo.height.toString(), transactionInfo.index, aggregateTransactionIndex),
            mosaic: statement.resolveMosaic(this.mosaic, transactionInfo.height.toString(),
                transactionInfo.index, aggregateTransactionIndex)});
    }
}
