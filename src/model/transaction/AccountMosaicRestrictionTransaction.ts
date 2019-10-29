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

import { Convert } from '../../core/format';
import { AccountMosaicRestrictionModificationBuilder } from '../../infrastructure/catbuffer/AccountMosaicRestrictionModificationBuilder';
import { AccountMosaicRestrictionTransactionBuilder } from '../../infrastructure/catbuffer/AccountMosaicRestrictionTransactionBuilder';
import { AmountDto } from '../../infrastructure/catbuffer/AmountDto';
import {
    EmbeddedAccountMosaicRestrictionTransactionBuilder,
} from '../../infrastructure/catbuffer/EmbeddedAccountMosaicRestrictionTransactionBuilder';
import { KeyDto } from '../../infrastructure/catbuffer/KeyDto';
import { SignatureDto } from '../../infrastructure/catbuffer/SignatureDto';
import { TimestampDto } from '../../infrastructure/catbuffer/TimestampDto';
import { UnresolvedMosaicIdDto } from '../../infrastructure/catbuffer/UnresolvedMosaicIdDto';
import { PublicAccount } from '../account/PublicAccount';
import { NetworkType } from '../blockchain/NetworkType';
import { MosaicId } from '../mosaic/MosaicId';
import { AccountRestrictionType } from '../restriction/AccountRestrictionType';
import { UInt64 } from '../UInt64';
import { AccountRestrictionModification } from './AccountRestrictionModification';
import { Deadline } from './Deadline';
import { InnerTransaction } from './InnerTransaction';
import { Transaction } from './Transaction';
import { TransactionInfo } from './TransactionInfo';
import { TransactionType } from './TransactionType';
import { TransactionVersion } from './TransactionVersion';

export class AccountMosaicRestrictionTransaction extends Transaction {

    /**
     * Create a modify account mosaic restriction transaction object
     * @param deadline - The deadline to include the transaction.
     * @param restrictionType - The account restriction type.
     * @param modifications - The array of modifications.
     * @param networkType - The network type.
     * @param maxFee - (Optional) Max fee defined by the sender
     * @returns {AccountAddressRestrictionTransaction}
     */
    public static create(deadline: Deadline,
                         restrictionType: AccountRestrictionType,
                         modifications: Array<AccountRestrictionModification<number[]>>,
                         networkType: NetworkType,
                         maxFee: UInt64 = new UInt64([0, 0])): AccountMosaicRestrictionTransaction {
        return new AccountMosaicRestrictionTransaction(networkType,
            TransactionVersion.ACCOUNT_RESTRICTION_MOSAIC,
            deadline,
            maxFee,
            restrictionType,
            modifications);
    }

    /**
     * @param networkType
     * @param version
     * @param deadline
     * @param maxFee
     * @param restrictionType
     * @param modifications
     * @param signature
     * @param signer
     * @param transactionInfo
     */
    constructor(networkType: NetworkType,
                version: number,
                deadline: Deadline,
                maxFee: UInt64,
                public readonly restrictionType: AccountRestrictionType,
                public readonly modifications: Array<AccountRestrictionModification<number[]>>,
                signature?: string,
                signer?: PublicAccount,
                transactionInfo?: TransactionInfo) {
        super(TransactionType.ACCOUNT_RESTRICTION_MOSAIC,
              networkType, version, deadline, maxFee, signature, signer, transactionInfo);
    }

    /**
     * Create a transaction object from payload
     * @param {string} payload Binary payload
     * @param {Boolean} isEmbedded Is embedded transaction (Default: false)
     * @returns {Transaction | InnerTransaction}
     */
    public static createFromPayload(payload: string,
                                    isEmbedded: boolean = false): Transaction | InnerTransaction {
        const builder = isEmbedded ? EmbeddedAccountMosaicRestrictionTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload)) :
            AccountMosaicRestrictionTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload));
        const signerPublicKey = Convert.uint8ToHex(builder.getSignerPublicKey().key);
        const networkType = Convert.hexToUint8(builder.getVersion().toString(16))[0];
        const transaction = AccountMosaicRestrictionTransaction.create(
            isEmbedded ? Deadline.create() : Deadline.createFromDTO(
                (builder as AccountMosaicRestrictionTransactionBuilder).getDeadline().timestamp),
            builder.getRestrictionType().valueOf(),
            builder.getModifications().map((modification) => {
                return AccountRestrictionModification.createForMosaic(
                    modification.modificationAction.valueOf(),
                    new MosaicId(modification.value.unresolvedMosaicId),
                );
            }),
            networkType,
            isEmbedded ? new UInt64([0, 0]) : new UInt64((builder as AccountMosaicRestrictionTransactionBuilder).fee.amount),
        );
        return isEmbedded ?
            transaction.toAggregate(PublicAccount.createFromPublicKey(signerPublicKey, networkType)) : transaction;
    }

    /**
     * @override Transaction.size()
     * @description get the byte size of a AccountMosaicRestrictionTransaction
     * @returns {number}
     * @memberof AccountMosaicRestrictionTransaction
     */
    public get size(): number {
        const byteSize = super.size;

        // set static byte size fields
        const byteRestrictionType = 1;
        const byteModificationCount = 1;

        // each modification contains :
        // - 1 byte for modificationAction
        // - 8 bytes for the modification value (mosaicId)
        const byteModifications = 9 * this.modifications.length;

        return byteSize + byteRestrictionType + byteModificationCount + byteModifications;
    }

    /**
     * @internal
     * @returns {Uint8Array}
     */
    protected generateBytes(): Uint8Array {
        const signerBuffer = new Uint8Array(32);
        const signatureBuffer = new Uint8Array(64);

        const transactionBuilder = new AccountMosaicRestrictionTransactionBuilder(
            new SignatureDto(signatureBuffer),
            new KeyDto(signerBuffer),
            this.versionToDTO(),
            TransactionType.ACCOUNT_RESTRICTION_MOSAIC.valueOf(),
            new AmountDto(this.maxFee.toDTO()),
            new TimestampDto(this.deadline.toDTO()),
            this.restrictionType.valueOf(),
            this.modifications.map((modification) => {
                return new AccountMosaicRestrictionModificationBuilder(
                    modification.modificationAction.valueOf(),
                    new UnresolvedMosaicIdDto(modification.value),
                );
            }),
        );
        return transactionBuilder.serialize();
    }

    /**
     * @internal
     * @returns {Uint8Array}
     */
    protected generateEmbeddedBytes(): Uint8Array {
        const transactionBuilder = new EmbeddedAccountMosaicRestrictionTransactionBuilder(
            new KeyDto(Convert.hexToUint8(this.signer!.publicKey)),
            this.versionToDTO(),
            TransactionType.ACCOUNT_RESTRICTION_MOSAIC.valueOf(),
            this.restrictionType.valueOf(),
            this.modifications.map((modification) => {
                return new AccountMosaicRestrictionModificationBuilder(
                    modification.modificationAction.valueOf(),
                    new UnresolvedMosaicIdDto(modification.value),
                );
            }),
        );
        return transactionBuilder.serialize();
    }
}
