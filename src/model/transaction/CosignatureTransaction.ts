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

import { KeyPair } from '../../core/crypto';
import { Convert } from '../../core/format';
import { Account } from '../account';
import { AggregateTransaction } from './AggregateTransaction';
import { CosignatureSignedTransaction } from './CosignatureSignedTransaction';
import { Transaction } from './Transaction';

/**
 * Cosignature transaction is used to sign an aggregate transactions with missing cosignatures.
 */
export class CosignatureTransaction {
    /**
     * @param transactionToCosign Aggregate transaction
     */
    constructor(
        /**
         * Transaction to cosign.
         */
        public readonly transactionToCosign: AggregateTransaction,
    ) {}

    /**
     * Create a cosignature transaction
     * @param transactionToCosign - Transaction to cosign.
     * @returns {CosignatureTransaction}
     */
    public static create(transactionToCosign: AggregateTransaction): CosignatureTransaction {
        return new CosignatureTransaction(transactionToCosign);
    }

    /**
     * Co-sign transaction with transaction payload (off chain)
     * Creating a new CosignatureSignedTransaction
     * @param account - The signing account
     * @param payload - off transaction payload (aggregated transaction is unannounced)
     * @param generationHash - Network generation hash
     * @returns {CosignatureSignedTransaction}
     */
    public static signTransactionPayload(account: Account, payload: string, generationHash: string): CosignatureSignedTransaction {
        const transactionHash = Transaction.createTransactionHash(payload, Array.from(Convert.hexToUint8(generationHash)));
        return this.signTransactionHash(account, transactionHash);
    }

    /**
     * Co-sign transaction with transaction hash (off chain)
     * Creating a new CosignatureSignedTransaction
     * @param account - The signing account
     * @param transactionHash - The hash of the aggregate transaction to be cosigned
     * @returns {CosignatureSignedTransaction}
     */
    public static signTransactionHash(account: Account, transactionHash: string): CosignatureSignedTransaction {
        const hashBytes = Convert.hexToUint8(transactionHash);
        const keyPairEncoded = KeyPair.createKeyPairFromPrivateKeyString(account.privateKey);
        const signature = KeyPair.sign(keyPairEncoded, new Uint8Array(hashBytes));
        return new CosignatureSignedTransaction(transactionHash, Convert.uint8ToHex(signature), account.publicKey);
    }

    /**
     * Serialize and sign transaction creating a new SignedTransaction
     * @param account
     * @param transactionHash Transaction hash (optional)
     * @returns {CosignatureSignedTransaction}
     */
    public signWith(account: Account, transactionHash?: string): CosignatureSignedTransaction {
        const hash = transactionHash || this.transactionToCosign.transactionInfo?.hash;
        if (!hash) {
            throw new Error('Transaction to cosign should be announced first');
        }
        return CosignatureTransaction.signTransactionHash(account, hash);
    }
}
