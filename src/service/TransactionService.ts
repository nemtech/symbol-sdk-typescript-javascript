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

import { combineLatest, merge, Observable, of } from 'rxjs';
import { first, map, mergeMap, toArray } from 'rxjs/operators';
import { IListener, ReceiptRepository, TransactionGroup, TransactionRepository } from '../infrastructure';
import { ReceiptPaginationStreamer } from '../infrastructure/paginationStreamer';
import { Address } from '../model/account';
import { NamespaceId } from '../model/namespace';
import { Statement } from '../model/receipt';
import {
    AccountAddressRestrictionTransaction,
    AggregateTransaction,
    LockFundsTransaction,
    MosaicAddressRestrictionTransaction,
    MosaicGlobalRestrictionTransaction,
    MosaicMetadataTransaction,
    MosaicSupplyChangeTransaction,
    SecretLockTransaction,
    SecretProofTransaction,
    SignedTransaction,
    Transaction,
    TransactionStatusError,
    TransactionType,
    TransferTransaction,
} from '../model/transaction';
import { ITransactionService } from './interfaces';

/**
 * Transaction Service
 */
export class TransactionService implements ITransactionService {
    /**
     * Constructor
     * @param transactionRepository
     * @param receiptRepository
     */
    constructor(private readonly transactionRepository: TransactionRepository, private readonly receiptRepository: ReceiptRepository) {}

    /**
     * Resolve unresolved mosaic / address from array of transactions
     * @param transationHashes List of transaction hashes.
     * @returns Observable<Transaction[]>
     */
    public resolveAliases(transationHashes: string[]): Observable<Transaction[]> {
        return this.transactionRepository.getTransactionsById(transationHashes, TransactionGroup.Confirmed).pipe(
            mergeMap((_) => {
                return _;
            }),
            mergeMap((transaction) => this.resolveTransaction(transaction)),
            toArray(),
        );
    }

    /**
     * @param signedTransaction Signed transaction to be announced.
     * @param listener Websocket listener
     * @returns {Observable<Transaction>}
     */
    public announce(signedTransaction: SignedTransaction, listener: IListener): Observable<Transaction> {
        const signerAddress = signedTransaction.getSignerAddress();
        return this.transactionRepository
            .announce(signedTransaction)
            .pipe(
                mergeMap(() =>
                    this.getTransactionOrRaiseError(
                        listener,
                        signerAddress,
                        signedTransaction.hash,
                        listener.confirmed(signerAddress, signedTransaction.hash),
                    ),
                ),
            );
    }

    /**
     * Announce aggregate transaction
     * **NOTE** A lock fund transaction for this aggregate bonded should exists
     * @param signedTransaction Signed aggregate bonded transaction.
     * @param listener Websocket listener
     * @returns {Observable<AggregateTransaction>}
     */
    public announceAggregateBonded(signedTransaction: SignedTransaction, listener: IListener): Observable<AggregateTransaction> {
        const signerAddress = signedTransaction.getSignerAddress();
        const transactionObservable = this.transactionRepository
            .announceAggregateBonded(signedTransaction)
            .pipe(mergeMap(() => listener.aggregateBondedAdded(signerAddress, signedTransaction.hash)));
        return this.getTransactionOrRaiseError(listener, signerAddress, signedTransaction.hash, transactionObservable);
    }

    /**
     * This method announces an a hash lock transaction followed by a aggregate bonded transaction
     * while waiting for being confirmed by listing to the /confirmed and /aggregateBondedAdded web
     * socket. If an error is sent while processing any of the given transaction an Error is raised.
     *
     * @param signedHashLockTransaction Signed hash lock transaction.
     * @param signedAggregateTransaction Signed aggregate bonded transaction.
     * @param listener Websocket listener
     * @returns {Observable<AggregateTransaction>}
     */
    public announceHashLockAggregateBonded(
        signedHashLockTransaction: SignedTransaction,
        signedAggregateTransaction: SignedTransaction,
        listener: IListener,
    ): Observable<AggregateTransaction> {
        return this.announce(signedHashLockTransaction, listener).pipe(
            mergeMap(() => this.announceAggregateBonded(signedAggregateTransaction, listener)),
        );
    }

    /**
     * @internal
     *
     * This method publishes an error if the listener receives an error code for the given address & transaction hash.
     * Otherwise, it returns the passed transactionObservable
     *
     * @param listener the listener.
     * @param address the signer address
     * @param transactionHash the transaction hash
     * @param transactionObservable the observable with the valid transaction
     */
    private getTransactionOrRaiseError<T extends Transaction>(
        listener: IListener,
        address: Address,
        transactionHash: string,
        transactionObservable: Observable<T>,
    ): Observable<T> {
        const errorObservable = listener.status(address, transactionHash);
        return merge(transactionObservable, errorObservable).pipe(
            first(),
            map((errorOrTransaction) => {
                if (errorOrTransaction instanceof TransactionStatusError) {
                    throw new Error(errorOrTransaction.code);
                } else {
                    return errorOrTransaction;
                }
            }),
        );
    }

    /**
     * Resolve transaction alias(s)
     * @param transaction Transaction to be resolved
     * @returns {Observable<Transaction>}
     */
    private resolveTransaction(transaction: Transaction): Observable<Transaction> {
        if ([TransactionType.AGGREGATE_BONDED, TransactionType.AGGREGATE_COMPLETE].includes(transaction.type)) {
            if ((transaction as AggregateTransaction).innerTransactions.find((tx) => this.checkShouldResolve(tx as Transaction))) {
                return this.resolvedFromReceipt(transaction, transaction.transactionInfo!.index);
            }
            return of(transaction);
        }
        return this.checkShouldResolve(transaction) ? this.resolvedFromReceipt(transaction, 0) : of(transaction);
    }

    /**
     * @internal
     * Check if receiptRepository needs to be called to resolve transaction alias
     * @param transaction Transaction
     * @return {boolean}
     */
    private checkShouldResolve(transaction: Transaction): boolean {
        switch (transaction.type) {
            case TransactionType.ACCOUNT_KEY_LINK:
            case TransactionType.ACCOUNT_METADATA:
            case TransactionType.ACCOUNT_OPERATION_RESTRICTION:
            case TransactionType.ADDRESS_ALIAS:
            case TransactionType.MOSAIC_ALIAS:
            case TransactionType.MOSAIC_DEFINITION:
            case TransactionType.MULTISIG_ACCOUNT_MODIFICATION:
            case TransactionType.NAMESPACE_METADATA:
            case TransactionType.NAMESPACE_REGISTRATION:
                return false;
            case TransactionType.ACCOUNT_ADDRESS_RESTRICTION:
                const accountAddressRestriction = transaction as AccountAddressRestrictionTransaction;
                return (
                    accountAddressRestriction.restrictionAdditions.find((address) => address instanceof NamespaceId) !== undefined ||
                    accountAddressRestriction.restrictionDeletions.find((address) => address instanceof NamespaceId) !== undefined
                );
            case TransactionType.ACCOUNT_MOSAIC_RESTRICTION:
                const accountMosaicRestriction = transaction as AccountAddressRestrictionTransaction;
                return (
                    accountMosaicRestriction.restrictionAdditions.find((mosaicId) => mosaicId instanceof NamespaceId) !== undefined ||
                    accountMosaicRestriction.restrictionDeletions.find((mosaicId) => mosaicId instanceof NamespaceId) !== undefined
                );
            case TransactionType.HASH_LOCK:
                return (transaction as LockFundsTransaction).mosaic.id instanceof NamespaceId;
            case TransactionType.MOSAIC_ADDRESS_RESTRICTION:
                const mosaicAddressRestriction = transaction as MosaicAddressRestrictionTransaction;
                return (
                    mosaicAddressRestriction.targetAddress instanceof NamespaceId ||
                    mosaicAddressRestriction.mosaicId instanceof NamespaceId
                );
            case TransactionType.MOSAIC_GLOBAL_RESTRICTION:
                const mosaicGlobalRestriction = transaction as MosaicGlobalRestrictionTransaction;
                return (
                    mosaicGlobalRestriction.referenceMosaicId instanceof NamespaceId ||
                    mosaicGlobalRestriction.mosaicId instanceof NamespaceId
                );
            case TransactionType.MOSAIC_METADATA:
                return (transaction as MosaicMetadataTransaction).targetMosaicId instanceof NamespaceId;
            case TransactionType.MOSAIC_SUPPLY_CHANGE:
                return (transaction as MosaicSupplyChangeTransaction).mosaicId instanceof NamespaceId;
            case TransactionType.SECRET_PROOF:
                return (transaction as SecretProofTransaction).recipientAddress instanceof NamespaceId;
            case TransactionType.SECRET_LOCK:
                const secretLock = transaction as SecretLockTransaction;
                return secretLock.recipientAddress instanceof NamespaceId || secretLock.mosaic.id instanceof NamespaceId;
            case TransactionType.TRANSFER:
                const transfer = transaction as TransferTransaction;
                return (
                    transfer.recipientAddress instanceof NamespaceId ||
                    transfer.mosaics.find((mosaic) => mosaic.id instanceof NamespaceId) !== undefined
                );
            default:
                throw new Error('Transaction type not not recogonised.');
        }
    }

    /**
     * @internal
     * Resolve transaction alais(s) from block receipt by calling receiptRepository
     * @param transaction Transaction to be resolved
     * @param aggregateIndex Aggregate transaction index
     * @return {Observable<Transaction>}
     */
    private resolvedFromReceipt(transaction: Transaction, aggregateIndex: number): Observable<Transaction> {
        const addressResolution = ReceiptPaginationStreamer.addressResolutionStatements(this.receiptRepository)
            .search({ height: transaction.transactionInfo!.height })
            .pipe(toArray());
        const mosaicResolution = ReceiptPaginationStreamer.mosaicResolutionStatements(this.receiptRepository)
            .search({ height: transaction.transactionInfo!.height })
            .pipe(toArray());
        return combineLatest(mosaicResolution, addressResolution)
            .pipe(
                map(([mosaic, address]) => {
                    return new Statement([], address, mosaic);
                }),
            )
            .pipe(map((statement) => transaction.resolveAliases(statement, aggregateIndex)));
    }
}
