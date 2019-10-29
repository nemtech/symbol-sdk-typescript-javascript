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

import {KeyPair, SHA3Hasher} from '../../core/crypto';
import {Convert} from '../../core/format';
import {AggregateBondedTransactionBuilder} from '../../infrastructure/catbuffer/AggregateBondedTransactionBuilder';
import {AggregateCompleteTransactionBuilder} from '../../infrastructure/catbuffer/AggregateCompleteTransactionBuilder';
import {AmountDto} from '../../infrastructure/catbuffer/AmountDto';
import {CosignatureBuilder} from '../../infrastructure/catbuffer/CosignatureBuilder';
import {GeneratorUtils} from '../../infrastructure/catbuffer/GeneratorUtils';
import {KeyDto} from '../../infrastructure/catbuffer/KeyDto';
import {SignatureDto} from '../../infrastructure/catbuffer/SignatureDto';
import {TimestampDto} from '../../infrastructure/catbuffer/TimestampDto';
import {CreateTransactionFromPayload} from '../../infrastructure/transaction/CreateTransactionFromPayload';
import {Account} from '../account/Account';
import {PublicAccount} from '../account/PublicAccount';
import {NetworkType} from '../blockchain/NetworkType';
import {UInt64} from '../UInt64';
import {AggregateTransactionCosignature} from './AggregateTransactionCosignature';
import {CosignatureSignedTransaction} from './CosignatureSignedTransaction';
import {Deadline} from './Deadline';
import {InnerTransaction} from './InnerTransaction';
import {SignedTransaction} from './SignedTransaction';
import {Transaction} from './Transaction';
import {TransactionInfo} from './TransactionInfo';
import {TransactionType} from './TransactionType';
import {TransactionVersion} from './TransactionVersion';

/**
 * Aggregate innerTransactions contain multiple innerTransactions that can be initiated by different accounts.
 */
export class AggregateTransaction extends Transaction {

    /**
     * @param networkType
     * @param type
     * @param version
     * @param deadline
     * @param maxFee
     * @param innerTransactions
     * @param cosignatures
     * @param signature
     * @param signer
     * @param transactionInfo
     */
    constructor(networkType: NetworkType,
                type: number,
                version: number,
                deadline: Deadline,
                maxFee: UInt64,
                /**
                 * The array of innerTransactions included in the aggregate transaction.
                 */
                public readonly innerTransactions: InnerTransaction[],
                /**
                 * The array of transaction cosigners signatures.
                 */
                public readonly cosignatures: AggregateTransactionCosignature[],
                signature?: string,
                signer?: PublicAccount,
                transactionInfo?: TransactionInfo) {
        super(type, networkType, version, deadline, maxFee, signature, signer, transactionInfo);
    }

    /**
     * Create an aggregate complete transaction object
     * @param deadline - The deadline to include the transaction.
     * @param innerTransactions - The array of inner innerTransactions.
     * @param networkType - The network type.
     * @param cosignatures
     * @param maxFee - (Optional) Max fee defined by the sender
     * @returns {AggregateTransaction}
     */
    public static createComplete(deadline: Deadline,
                                 innerTransactions: InnerTransaction[],
                                 networkType: NetworkType,
                                 cosignatures: AggregateTransactionCosignature[],
                                 maxFee: UInt64 = new UInt64([0, 0])): AggregateTransaction {
        return new AggregateTransaction(networkType,
            TransactionType.AGGREGATE_COMPLETE,
            TransactionVersion.AGGREGATE_COMPLETE,
            deadline,
            maxFee,
            innerTransactions,
            cosignatures,
        );
    }

    /**
     * Create an aggregate bonded transaction object
     * @param {Deadline} deadline
     * @param {InnerTransaction[]} innerTransactions
     * @param {NetworkType} networkType
     * @param {AggregateTransactionCosignature[]} cosignatures
     * @param {UInt64} maxFee - (Optional) Max fee defined by the sender
     * @return {AggregateTransaction}
     */
    public static createBonded(deadline: Deadline,
                               innerTransactions: InnerTransaction[],
                               networkType: NetworkType,
                               cosignatures: AggregateTransactionCosignature[] = [],
                               maxFee: UInt64 = new UInt64([0, 0])): AggregateTransaction {
        return new AggregateTransaction(networkType,
            TransactionType.AGGREGATE_BONDED,
            TransactionVersion.AGGREGATE_BONDED,
            deadline,
            maxFee,
            innerTransactions,
            cosignatures,
        );
    }

    /**
     * Create a transaction object from payload
     * @param {string} payload Binary payload
     * @returns {AggregateTransaction}
     */
    public static createFromPayload(payload: string): AggregateTransaction {
        /**
         * Get transaction type from the payload hex
         * As buffer uses separate builder class for Complete and bonded
         */
        const type = parseInt(Convert.uint8ToHex(Convert.hexToUint8(payload.substring(204, 208)).reverse()), 16);
        const builder = type === TransactionType.AGGREGATE_COMPLETE ?
            AggregateCompleteTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload)) :
            AggregateBondedTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload));
        const innerTransactionHex = Convert.uint8ToHex(builder.getTransactions());
        const networkType = Convert.hexToUint8(builder.getVersion().toString(16))[0];
        const consignaturesHex = Convert.uint8ToHex(builder.getCosignatures());

        /**
         * Get inner transactions array
         */
        const embeddedTransactionArray: string[] = [];
        let innerBinary = innerTransactionHex;
        while (innerBinary.length) {
            const payloadSize = parseInt(Convert.uint8ToHex(Convert.hexToUint8(innerBinary.substring(0, 8)).reverse()), 16) * 2;
            const innerTransaction = innerBinary.substring(0, payloadSize);
            embeddedTransactionArray.push(innerTransaction);
            innerBinary = innerBinary.substring(payloadSize);
        }

        /**
         * Get cosignatures
         */
        const consignatureArray = consignaturesHex.match(/.{1,192}/g);
        const consignatures = consignatureArray ? consignatureArray.map((cosignature) =>
            new AggregateTransactionCosignature(
                cosignature.substring(64, 192),
                PublicAccount.createFromPublicKey(cosignature.substring(0, 64), networkType),
            )) : [];

        return type === TransactionType.AGGREGATE_COMPLETE ?
            AggregateTransaction.createComplete(
                Deadline.createFromDTO(builder.deadline.timestamp),
                embeddedTransactionArray.map((transactionRaw) => {
                    return CreateTransactionFromPayload(transactionRaw, true) as InnerTransaction;
                }),
                networkType,
                consignatures,
                new UInt64(builder.fee.amount),
            ) : AggregateTransaction.createBonded(
                Deadline.createFromDTO(builder.deadline.timestamp),
                embeddedTransactionArray.map((transactionRaw) => {
                    return CreateTransactionFromPayload(transactionRaw, true) as InnerTransaction;
                }),
                networkType,
                consignatures,
                new UInt64(builder.fee.amount),
            );
    }

    /**
     * @description add inner transactions to current list
     * @param {InnerTransaction[]} transaction
     * @returns {AggregateTransaction}
     * @memberof AggregateTransaction
     */
    public addTransactions(transactions: InnerTransaction[]): AggregateTransaction {
        const innerTransactions = this.innerTransactions.concat(transactions);
        return Object.assign({__proto__: Object.getPrototypeOf(this)}, this, {innerTransactions});
    }

    /**
     * @internal
     * Sign transaction with cosignatories creating a new SignedTransaction
     * @param initiatorAccount - Initiator account
     * @param cosignatories - The array of accounts that will cosign the transaction
     * @param generationHash - Network generation hash hex
     * @returns {SignedTransaction}
     */
    public signTransactionWithCosignatories(initiatorAccount: Account,
                                            cosignatories: Account[],
                                            generationHash: string): SignedTransaction {
        const signedTransaction = this.signWith(initiatorAccount, generationHash);
        const transactionHashBytes = Convert.hexToUint8(signedTransaction.hash);
        let signedPayload = signedTransaction.payload;
        cosignatories.forEach((cosigner) => {
            const signSchema = SHA3Hasher.resolveSignSchema(cosigner.networkType);
            const signature = KeyPair.sign(cosigner, transactionHashBytes, signSchema);
            signedPayload += cosigner.publicKey + Convert.uint8ToHex(signature);
        });

        // Calculate new size
        const size = `00000000${(signedPayload.length / 2).toString(16)}`;
        const formatedSize = size.substr(size.length - 8, size.length);
        const littleEndianSize = formatedSize.substr(6, 2) + formatedSize.substr(4, 2) +
            formatedSize.substr(2, 2) + formatedSize.substr(0, 2);

        signedPayload = littleEndianSize + signedPayload.substr(8, signedPayload.length - 8);
        return new SignedTransaction(signedPayload, signedTransaction.hash, initiatorAccount.publicKey,
            this.type, this.networkType);
    }

    /**
     * @internal
     * Sign transaction with cosignatories collected from cosigned transactions and creating a new SignedTransaction
     * For off chain Aggregated Complete Transaction co-signing.
     * @param initiatorAccount - Initiator account
     * @param {CosignatureSignedTransaction[]} cosignatureSignedTransactions - Array of cosigned transaction
     * @param generationHash - Network generation hash hex
     * @return {SignedTransaction}
     */
    public signTransactionGivenSignatures(initiatorAccount: Account,
                                          cosignatureSignedTransactions: CosignatureSignedTransaction[],
                                          generationHash: string): SignedTransaction {
        const signedTransaction = this.signWith(initiatorAccount, generationHash);
        let signedPayload = signedTransaction.payload;
        cosignatureSignedTransactions.forEach((cosignedTransaction) => {
            signedPayload += cosignedTransaction.signerPublicKey + cosignedTransaction.signature;
        });

        // Calculate new size
        const size = `00000000${(signedPayload.length / 2).toString(16)}`;
        const formatedSize = size.substr(size.length - 8, size.length);
        const littleEndianSize = formatedSize.substr(6, 2) + formatedSize.substr(4, 2) +
            formatedSize.substr(2, 2) + formatedSize.substr(0, 2);

        signedPayload = littleEndianSize + signedPayload.substr(8, signedPayload.length - 8);
        return new SignedTransaction(signedPayload, signedTransaction.hash, initiatorAccount.publicKey,
            this.type, this.networkType);
    }

    /**
     * Check if account has signed transaction
     * @param publicAccount - Signer public account
     * @returns {boolean}
     */
    public signedByAccount(publicAccount: PublicAccount): boolean {
        return this.cosignatures.find((cosignature) => cosignature.signer.equals(publicAccount)) !== undefined
            || (this.signer !== undefined && this.signer.equals(publicAccount));
    }

    /**
     * @override Transaction.size()
     * @description get the byte size of a AggregateTransaction
     * @returns {number}
     * @memberof AggregateTransaction
     */
    public get size(): number {
        const byteSize = super.size;

        // set static byte size fields
        const byteTransactionsSize = 4;

        // calculate each inner transaction's size
        let byteTransactions = 0;
        this.innerTransactions.map((transaction) => {
            byteTransactions += (transaction.size - 80);
        });

        const byteCosignatures = this.cosignatures.length * 96;
        return byteSize + byteTransactionsSize + byteTransactions + byteCosignatures;
    }

    /**
     * @internal
     * @returns {Uint8Array}
     */
    protected generateBytes(signer?: PublicAccount): Uint8Array {
        const signerBuffer = new Uint8Array(32);
        const signatureBuffer = new Uint8Array(64);
        let transactions = Uint8Array.from([]);
        this.innerTransactions.forEach((transaction) => {
            if (!transaction.signer) {
                if (this.type === TransactionType.AGGREGATE_COMPLETE) {
                    transaction = Object.assign({__proto__: Object.getPrototypeOf(transaction)}, transaction, {signer});
                } else {
                    throw new Error(
                        'InnerTransaction signer must be provide. Only AggregateComplete transaction can use delegated signer.');
                }
            }
            const transactionByte = transaction.toAggregateTransactionBytes();
            transactions = GeneratorUtils.concatTypedArrays(transactions, transactionByte);
        });

        let cosignatures = Uint8Array.from([]);
        this.cosignatures.forEach((cosignature) => {
            const signerBytes = Convert.hexToUint8(cosignature.signer.publicKey);
            const signatureBytes = Convert.hexToUint8(cosignature.signature);
            const cosignatureBytes = new CosignatureBuilder(
                new KeyDto(signerBytes),
                new SignatureDto(signatureBytes),
            ).serialize();
            cosignatures = GeneratorUtils.concatTypedArrays(cosignatures, cosignatureBytes);
        });

        const transactionBuilder = this.type === TransactionType.AGGREGATE_COMPLETE ?
            new AggregateCompleteTransactionBuilder(
                new SignatureDto(signatureBuffer),
                new KeyDto(signerBuffer),
                this.versionToDTO(),
                this.type.valueOf(),
                new AmountDto(this.maxFee.toDTO()),
                new TimestampDto(this.deadline.toDTO()),
                transactions,
                cosignatures,
            ) :
            new AggregateBondedTransactionBuilder(
                new SignatureDto(signatureBuffer),
                new KeyDto(signerBuffer),
                this.versionToDTO(),
                this.type.valueOf(),
                new AmountDto(this.maxFee.toDTO()),
                new TimestampDto(this.deadline.toDTO()),
                transactions,
                cosignatures,
            );
        return transactionBuilder.serialize();
    }

    /**
     * @internal
     * @returns {Uint8Array}
     */
    protected generateEmbeddedBytes(): Uint8Array {
        throw new Error('Method not implemented');
    }
}
