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
    AccountOperationRestrictionTransactionBuilder,
    AmountDto,
    EmbeddedAccountOperationRestrictionTransactionBuilder,
    EmbeddedTransactionBuilder,
    KeyDto,
    SignatureDto,
    TimestampDto,
    TransactionBuilder,
} from 'catbuffer-typescript';
import { Convert } from '../../core/format';
import { PublicAccount } from '../account/PublicAccount';
import { NetworkType } from '../network/NetworkType';
import { UInt64 } from '../UInt64';
import { Deadline } from './Deadline';
import { InnerTransaction } from './InnerTransaction';
import { Transaction } from './Transaction';
import { TransactionInfo } from './TransactionInfo';
import { TransactionType } from './TransactionType';
import { TransactionVersion } from './TransactionVersion';
import { Address } from '../account/Address';
import { OperationRestrictionFlag } from '../restriction/OperationRestrictionFlag';

export class AccountOperationRestrictionTransaction extends Transaction {
    /**
     * Create a modify account operation restriction type transaction object
     * @param deadline - The deadline to include the transaction.
     * @param restrictionFlags - The account restriction flags.
     * @param restrictionAdditions - Account restriction additions.
     * @param restrictionDeletions - Account restriction deletions.
     * @param networkType - The network type.
     * @param maxFee - (Optional) Max fee defined by the sender
     * @param signature - (Optional) Transaction signature
     * @param signer - (Optional) Signer public account
     * @returns {AccountOperationRestrictionTransaction}
     */
    public static create(
        deadline: Deadline,
        restrictionFlags: OperationRestrictionFlag,
        restrictionAdditions: TransactionType[],
        restrictionDeletions: TransactionType[],
        networkType: NetworkType,
        maxFee: UInt64 = new UInt64([0, 0]),
        signature?: string,
        signer?: PublicAccount,
    ): AccountOperationRestrictionTransaction {
        return new AccountOperationRestrictionTransaction(
            networkType,
            TransactionVersion.MODIFY_ACCOUNT_RESTRICTION_ENTITY_TYPE,
            deadline,
            maxFee,
            restrictionFlags,
            restrictionAdditions,
            restrictionDeletions,
            signature,
            signer,
        );
    }

    /**
     * @param networkType
     * @param version
     * @param deadline
     * @param maxFee
     * @param restrictionFlags
     * @param restrictionAdditions
     * @param restrictionDeletions
     * @param signature
     * @param signer
     * @param transactionInfo
     */
    constructor(
        networkType: NetworkType,
        version: number,
        deadline: Deadline,
        maxFee: UInt64,
        public readonly restrictionFlags: OperationRestrictionFlag,
        public readonly restrictionAdditions: TransactionType[],
        public readonly restrictionDeletions: TransactionType[],
        signature?: string,
        signer?: PublicAccount,
        transactionInfo?: TransactionInfo,
    ) {
        super(TransactionType.ACCOUNT_OPERATION_RESTRICTION, networkType, version, deadline, maxFee, signature, signer, transactionInfo);
    }

    /**
     * Create a transaction object from payload
     * @param {string} payload Binary payload
     * @param {number} epochAdjustment Nemesis block epoch
     * @param {Boolean} isEmbedded Is embedded transaction (Default: false)
     * @returns {Transaction | InnerTransaction}
     */
    public static createFromPayload(payload: string, epochAdjustment: number, isEmbedded = false): Transaction | InnerTransaction {
        const builder = isEmbedded
            ? EmbeddedAccountOperationRestrictionTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload))
            : AccountOperationRestrictionTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload));
        const signer = Convert.uint8ToHex(builder.getSignerPublicKey().key);
        const networkType = builder.getNetwork().valueOf();
        const signature = payload.substring(16, 144);
        const transaction = AccountOperationRestrictionTransaction.create(
            isEmbedded
                ? Deadline.createEmtpy()
                : Deadline.createFromDTO(
                      (builder as AccountOperationRestrictionTransactionBuilder).getDeadline().timestamp,
                      epochAdjustment,
                  ),
            builder.getRestrictionFlags().valueOf(),
            builder.getRestrictionAdditions(),
            builder.getRestrictionDeletions(),
            networkType,
            isEmbedded ? new UInt64([0, 0]) : new UInt64((builder as AccountOperationRestrictionTransactionBuilder).fee.amount),
            isEmbedded || signature.match(`^[0]+$`) ? undefined : signature,
            signer.match(`^[0]+$`) ? undefined : PublicAccount.createFromPublicKey(signer, networkType),
        );
        return isEmbedded ? transaction.toAggregate(PublicAccount.createFromPublicKey(signer, networkType)) : transaction;
    }

    /**
     * @internal
     * @returns {TransactionBuilder}
     */
    protected createBuilder(): TransactionBuilder {
        const signerBuffer = this.signer !== undefined ? Convert.hexToUint8(this.signer.publicKey) : new Uint8Array(32);
        const signatureBuffer = this.signature !== undefined ? Convert.hexToUint8(this.signature) : new Uint8Array(64);

        const transactionBuilder = new AccountOperationRestrictionTransactionBuilder(
            new SignatureDto(signatureBuffer),
            new KeyDto(signerBuffer),
            this.versionToDTO(),
            this.networkType.valueOf(),
            TransactionType.ACCOUNT_OPERATION_RESTRICTION.valueOf(),
            new AmountDto(this.maxFee.toDTO()),
            new TimestampDto(this.deadline.toDTO()),
            this.restrictionFlags.valueOf(),
            this.restrictionAdditions,
            this.restrictionDeletions,
        );
        return transactionBuilder;
    }

    /**
     * @internal
     * @returns {EmbeddedTransactionBuilder}
     */
    public toEmbeddedTransaction(): EmbeddedTransactionBuilder {
        return new EmbeddedAccountOperationRestrictionTransactionBuilder(
            new KeyDto(Convert.hexToUint8(this.signer!.publicKey)),
            this.versionToDTO(),
            this.networkType.valueOf(),
            TransactionType.ACCOUNT_OPERATION_RESTRICTION.valueOf(),
            this.restrictionFlags.valueOf(),
            this.restrictionAdditions,
            this.restrictionDeletions,
        );
    }

    /**
     * @internal
     * @returns {AccountOperationRestrictionTransaction}
     */
    resolveAliases(): AccountOperationRestrictionTransaction {
        return this;
    }

    /**
     * @internal
     * Check a given address should be notified in websocket channels
     * @param address address to be notified
     * @returns {boolean}
     */
    public shouldNotifyAccount(address: Address): boolean {
        return super.isSigned(address);
    }
}
