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

import { deepEqual } from 'assert';
import { expect } from 'chai';
import { sha3_256 } from 'js-sha3';
import { Convert } from '../../../src/core/format';
import { TransactionMapping } from '../../../src/core/utils/TransactionMapping';
import { Account } from '../../../src/model/account/Account';
import { Address } from '../../../src/model/account/Address';
import { PublicAccount } from '../../../src/model/account/PublicAccount';
import { EncryptedMessage } from '../../../src/model/message/EncryptedMessage';
import { MessageType } from '../../../src/model/message/MessageType';
import { PlainMessage } from '../../../src/model/message/PlainMessage';
import { Mosaic } from '../../../src/model/mosaic/Mosaic';
import { MosaicFlags } from '../../../src/model/mosaic/MosaicFlags';
import { MosaicId } from '../../../src/model/mosaic/MosaicId';
import { MosaicNonce } from '../../../src/model/mosaic/MosaicNonce';
import { MosaicSupplyChangeAction } from '../../../src/model/mosaic/MosaicSupplyChangeAction';
import { NetworkCurrencyLocal } from '../../../src/model/mosaic/NetworkCurrencyLocal';
import { AliasAction } from '../../../src/model/namespace/AliasAction';
import { NamespaceId } from '../../../src/model/namespace/NamespaceId';
import { NamespaceRegistrationType } from '../../../src/model/namespace/NamespaceRegistrationType';
import { NetworkType } from '../../../src/model/network/NetworkType';
import { AccountRestrictionFlags } from '../../../src/model/restriction/AccountRestrictionType';
import { MosaicRestrictionType } from '../../../src/model/restriction/MosaicRestrictionType';
import { AccountAddressRestrictionTransaction } from '../../../src/model/transaction/AccountAddressRestrictionTransaction';
import { AccountLinkTransaction } from '../../../src/model/transaction/AccountLinkTransaction';
import { AccountMetadataTransaction } from '../../../src/model/transaction/AccountMetadataTransaction';
import { AccountMosaicRestrictionTransaction } from '../../../src/model/transaction/AccountMosaicRestrictionTransaction';
import { AccountOperationRestrictionTransaction } from '../../../src/model/transaction/AccountOperationRestrictionTransaction';
import { AccountRestrictionTransaction } from '../../../src/model/transaction/AccountRestrictionTransaction';
import { AddressAliasTransaction } from '../../../src/model/transaction/AddressAliasTransaction';
import { AggregateTransaction } from '../../../src/model/transaction/AggregateTransaction';
import { Deadline } from '../../../src/model/transaction/Deadline';
import { LockHashAlgorithm } from '../../../src/model/transaction/LockHashAlgorithm';
import { LinkAction } from '../../../src/model/transaction/LinkAction';
import { LockFundsTransaction } from '../../../src/model/transaction/LockFundsTransaction';
import { MosaicAddressRestrictionTransaction } from '../../../src/model/transaction/MosaicAddressRestrictionTransaction';
import { MosaicAliasTransaction } from '../../../src/model/transaction/MosaicAliasTransaction';
import { MosaicDefinitionTransaction } from '../../../src/model/transaction/MosaicDefinitionTransaction';
import { MosaicGlobalRestrictionTransaction } from '../../../src/model/transaction/MosaicGlobalRestrictionTransaction';
import { MosaicMetadataTransaction } from '../../../src/model/transaction/MosaicMetadataTransaction';
import { MosaicSupplyChangeTransaction } from '../../../src/model/transaction/MosaicSupplyChangeTransaction';
import { MultisigAccountModificationTransaction } from '../../../src/model/transaction/MultisigAccountModificationTransaction';
import { NamespaceMetadataTransaction } from '../../../src/model/transaction/NamespaceMetadataTransaction';
import { NamespaceRegistrationTransaction } from '../../../src/model/transaction/NamespaceRegistrationTransaction';
import { SecretLockTransaction } from '../../../src/model/transaction/SecretLockTransaction';
import { SecretProofTransaction } from '../../../src/model/transaction/SecretProofTransaction';
import { TransactionType } from '../../../src/model/transaction/TransactionType';
import { TransferTransaction } from '../../../src/model/transaction/TransferTransaction';
import { UInt64 } from '../../../src/model/UInt64';
import { TestingAccount } from '../../conf/conf.spec';

describe('TransactionMapping - createFromPayload', () => {
    let account: Account;
    const generationHash = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6';
    before(() => {
        account = TestingAccount;
    });

    it('should create AccountRestrictionAddressTransaction', () => {
        const address = Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC');
        const addressRestrictionTransaction = AccountRestrictionTransaction.createAddressRestrictionModificationTransaction(
            Deadline.create(),
            AccountRestrictionFlags.AllowIncomingAddress,
            [address],
            [],
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = addressRestrictionTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as AccountAddressRestrictionTransaction;

        expect(transaction.restrictionFlags).to.be.equal(AccountRestrictionFlags.AllowIncomingAddress);
        expect((transaction.restrictionAdditions[0] as Address).plain()).to.be.equal('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC');
        expect(transaction.restrictionDeletions.length).to.be.equal(0);
    });

    it('should create AccountRestrictionMosaicTransaction', () => {
        const mosaicId = new MosaicId([2262289484, 3405110546]);
        const mosaicRestrictionTransaction = AccountRestrictionTransaction.createMosaicRestrictionModificationTransaction(
            Deadline.create(),
            AccountRestrictionFlags.AllowMosaic,
            [mosaicId],
            [],
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = mosaicRestrictionTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as AccountMosaicRestrictionTransaction;
        expect(transaction.restrictionFlags).to.be.equal(AccountRestrictionFlags.AllowMosaic);
        expect((transaction.restrictionAdditions[0] as MosaicId).toHex()).to.be.equal(mosaicId.toHex());
        expect(transaction.restrictionDeletions.length).to.be.equal(0);
    });

    it('should create AccountRestrictionOperationTransaction', () => {
        const operation = TransactionType.ADDRESS_ALIAS;
        const operationRestrictionTransaction = AccountRestrictionTransaction.createOperationRestrictionModificationTransaction(
            Deadline.create(),
            AccountRestrictionFlags.AllowIncomingTransactionType,
            [operation],
            [],
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = operationRestrictionTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as AccountOperationRestrictionTransaction;
        expect(transaction.restrictionFlags).to.be.equal(AccountRestrictionFlags.AllowIncomingTransactionType);
        expect(transaction.restrictionAdditions[0]).to.be.equal(operation);
        expect(transaction.restrictionDeletions.length).to.be.equal(0);
    });

    it('should create AddressAliasTransaction', () => {
        const namespaceId = new NamespaceId([33347626, 3779697293]);
        const address = Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC');
        const addressAliasTransaction = AddressAliasTransaction.create(
            Deadline.create(),
            AliasAction.Link,
            namespaceId,
            address,
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = addressAliasTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as AddressAliasTransaction;

        expect(transaction.aliasAction).to.be.equal(AliasAction.Link);
        expect(transaction.namespaceId.id.lower).to.be.equal(33347626);
        expect(transaction.namespaceId.id.higher).to.be.equal(3779697293);
        expect(transaction.address.plain()).to.be.equal('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC');
    });

    it('should create MosaicAliasTransaction', () => {
        const namespaceId = new NamespaceId([33347626, 3779697293]);
        const mosaicId = new MosaicId([2262289484, 3405110546]);
        const mosaicAliasTransaction = MosaicAliasTransaction.create(
            Deadline.create(),
            AliasAction.Link,
            namespaceId,
            mosaicId,
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = mosaicAliasTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as MosaicAliasTransaction;
        expect(transaction.aliasAction).to.be.equal(AliasAction.Link);
        expect(transaction.namespaceId.id.lower).to.be.equal(33347626);
        expect(transaction.namespaceId.id.higher).to.be.equal(3779697293);
        expect(transaction.mosaicId.id.lower).to.be.equal(2262289484);
        expect(transaction.mosaicId.id.higher).to.be.equal(3405110546);
    });

    it('should create MosaicDefinitionTransaction', () => {
        const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(),
            MosaicNonce.createFromUint8Array(new Uint8Array([0xe6, 0xde, 0x84, 0xb8])), // nonce
            new MosaicId(UInt64.fromUint(1).toDTO()), // ID
            MosaicFlags.create(false, false, false),
            3,
            UInt64.fromUint(1000),
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = mosaicDefinitionTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as MosaicDefinitionTransaction;

        expect(transaction.duration!.lower).to.be.equal(1000);
        expect(transaction.duration!.higher).to.be.equal(0);
        expect(transaction.divisibility).to.be.equal(3);
        expect(transaction.flags.supplyMutable).to.be.equal(false);
        expect(transaction.flags.transferable).to.be.equal(false);
        expect(transaction.flags.restrictable).to.be.equal(false);
    });

    it('should create MosaicDefinitionTransaction - without duration', () => {
        const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(),
            MosaicNonce.createFromUint8Array(new Uint8Array([0xe6, 0xde, 0x84, 0xb8])), // nonce
            new MosaicId(UInt64.fromUint(1).toDTO()), // ID
            MosaicFlags.create(false, false, false),
            3,
            UInt64.fromUint(0),
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = mosaicDefinitionTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as MosaicDefinitionTransaction;

        expect(transaction.divisibility).to.be.equal(3);
        expect(transaction.flags.supplyMutable).to.be.equal(false);
        expect(transaction.flags.transferable).to.be.equal(false);
        expect(transaction.flags.restrictable).to.be.equal(false);
    });

    it('should create MosaicDefinitionTransaction - without duration', () => {
        const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(),
            MosaicNonce.createFromUint8Array(new Uint8Array([0xe6, 0xde, 0x84, 0xb8])), // nonce
            new MosaicId(UInt64.fromUint(1).toDTO()), // ID
            MosaicFlags.create(false, false, false),
            3,
            UInt64.fromUint(0),
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = mosaicDefinitionTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as MosaicDefinitionTransaction;

        expect(transaction.divisibility).to.be.equal(3);
        expect(transaction.flags.supplyMutable).to.be.equal(false);
        expect(transaction.flags.transferable).to.be.equal(false);
        expect(transaction.flags.transferable).to.be.equal(false);
    });

    it('should create MosaicDefinitionTransaction - without duration', () => {
        const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(),
            MosaicNonce.createFromUint8Array(new Uint8Array([0xe6, 0xde, 0x84, 0xb8])), // nonce
            new MosaicId(UInt64.fromUint(1).toDTO()), // ID
            MosaicFlags.create(false, false, false),
            3,
            UInt64.fromUint(0),
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = mosaicDefinitionTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as MosaicDefinitionTransaction;

        expect(transaction.divisibility).to.be.equal(3);
        expect(transaction.flags.supplyMutable).to.be.equal(false);
        expect(transaction.flags.transferable).to.be.equal(false);
        expect(transaction.flags.transferable).to.be.equal(false);
    });

    it('should create MosaicDefinitionTransaction - without duration', () => {
        const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(),
            MosaicNonce.createFromUint8Array(new Uint8Array([0xe6, 0xde, 0x84, 0xb8])), // nonce
            new MosaicId(UInt64.fromUint(1).toDTO()), // ID
            MosaicFlags.create(false, false, false),
            3,
            UInt64.fromUint(0),
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = mosaicDefinitionTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as MosaicDefinitionTransaction;

        expect(transaction.divisibility).to.be.equal(3);
        expect(transaction.flags.supplyMutable).to.be.equal(false);
        expect(transaction.flags.transferable).to.be.equal(false);
        expect(transaction.flags.transferable).to.be.equal(false);
    });

    it('should create MosaicSupplyChangeTransaction', () => {
        const mosaicId = new MosaicId([2262289484, 3405110546]);
        const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
            Deadline.create(),
            mosaicId,
            MosaicSupplyChangeAction.Increase,
            UInt64.fromUint(10),
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = mosaicSupplyChangeTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as MosaicSupplyChangeTransaction;

        expect(transaction.action).to.be.equal(MosaicSupplyChangeAction.Increase);
        expect(transaction.delta.lower).to.be.equal(10);
        expect(transaction.delta.higher).to.be.equal(0);
        expect(transaction.mosaicId.id.lower).to.be.equal(2262289484);
        expect(transaction.mosaicId.id.higher).to.be.equal(3405110546);
    });

    it('should create TransferTransaction', () => {
        const transferTransaction = TransferTransaction.create(
            Deadline.create(),
            Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC'),
            [NetworkCurrencyLocal.createRelative(100)],
            PlainMessage.create('test-message'),
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = transferTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as TransferTransaction;

        expect(transaction.message.payload).to.be.equal('test-message');
        expect(transaction.mosaics.length).to.be.equal(1);
        expect(transaction.recipientToString()).to.be.equal('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC');
    });

    it('should create SecretLockTransaction', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createAbsolute(10),
            UInt64.fromUint(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(Convert.hexToUint8(proof)).hex(),
            recipientAddress,
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = secretLockTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as SecretLockTransaction;

        expect(transaction.mosaic.amount.equals(UInt64.fromUint(10))).to.be.equal(true);
        expect(transaction.duration.equals(UInt64.fromUint(100))).to.be.equal(true);
        expect(transaction.hashAlgorithm).to.be.equal(0);
        expect(transaction.secret).to.be.equal('9B3155B37159DA50AA52D5967C509B410F5A36A3B1E31ECB5AC76675D79B4A5E');
        expect((transaction.recipientAddress as Address).plain()).to.be.equal(recipientAddress.plain());
    });

    it('should create SecretProofTransaction', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const secretProofTransaction = SecretProofTransaction.create(
            Deadline.create(),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(Convert.hexToUint8(proof)).hex(),
            account.address,
            proof,
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = secretProofTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as SecretProofTransaction;
        expect(transaction.hashAlgorithm).to.be.equal(0);
        expect(transaction.secret).to.be.equal('9B3155B37159DA50AA52D5967C509B410F5A36A3B1E31ECB5AC76675D79B4A5E');
        expect(transaction.proof).to.be.equal(proof);
        expect((transaction.recipientAddress as Address).plain()).to.be.equal(account.address.plain());
    });

    it('should create ModifyMultiSigTransaction', () => {
        const modifyMultisigAccountTransaction = MultisigAccountModificationTransaction.create(
            Deadline.create(),
            2,
            1,
            [PublicAccount.createFromPublicKey('B0F93CBEE49EEB9953C6F3985B15A4F238E205584D8F924C621CBE4D7AC6EC24', NetworkType.MIJIN_TEST)],
            [],
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = modifyMultisigAccountTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as MultisigAccountModificationTransaction;

        expect(transaction.minApprovalDelta).to.be.equal(2);
        expect(transaction.minRemovalDelta).to.be.equal(1);
        expect(transaction.publicKeyAdditions[0].publicKey).to.be.equal('B0F93CBEE49EEB9953C6F3985B15A4F238E205584D8F924C621CBE4D7AC6EC24');
        expect(transaction.publicKeyDeletions.length).to.be.equal(0);
    });

    it('should create AggregatedTransaction - Complete', () => {
        const transferTransaction = TransferTransaction.create(
            Deadline.create(),
            Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC'),
            [],
            PlainMessage.create('test-message'),
            NetworkType.MIJIN_TEST,
        );

        const accountLinkTransaction = AccountLinkTransaction.create(
            Deadline.create(),
            account.publicKey,
            LinkAction.Link,
            NetworkType.MIJIN_TEST,
        );
        const registerNamespaceTransaction = NamespaceRegistrationTransaction.createRootNamespace(
            Deadline.create(),
            'root-test-namespace',
            UInt64.fromUint(1000),
            NetworkType.MIJIN_TEST,
        );
        const mosaicGlobalRestrictionTransaction = MosaicGlobalRestrictionTransaction.create(
            Deadline.create(),
            new MosaicId(UInt64.fromUint(1).toDTO()),
            UInt64.fromUint(4444),
            UInt64.fromUint(0),
            MosaicRestrictionType.NONE,
            UInt64.fromUint(0),
            MosaicRestrictionType.GE,
            NetworkType.MIJIN_TEST,
        );
        const mosaicAddressRestrictionTransaction = MosaicAddressRestrictionTransaction.create(
            Deadline.create(),
            new NamespaceId('test'),
            UInt64.fromUint(4444),
            account.address,
            UInt64.fromUint(0),
            NetworkType.MIJIN_TEST,
            UInt64.fromUint(0),
        );
        const accountMetadataTransaction = AccountMetadataTransaction.create(
            Deadline.create(),
            account.publicKey,
            UInt64.fromUint(1000),
            1,
            Convert.uint8ToUtf8(new Uint8Array(10)),
            NetworkType.MIJIN_TEST,
        );
        const mosaicMetadataTransaction = MosaicMetadataTransaction.create(
            Deadline.create(),
            account.publicKey,
            UInt64.fromUint(1000),
            new MosaicId([2262289484, 3405110546]),
            1,
            Convert.uint8ToUtf8(new Uint8Array(10)),
            NetworkType.MIJIN_TEST,
        );
        const namespaceMetadataTransaction = NamespaceMetadataTransaction.create(
            Deadline.create(),
            account.publicKey,
            UInt64.fromUint(1000),
            new NamespaceId([2262289484, 3405110546]),
            1,
            Convert.uint8ToUtf8(new Uint8Array(10)),
            NetworkType.MIJIN_TEST,
        );

        const mosaicAliasTransaction = MosaicAliasTransaction.create(
            Deadline.create(),
            AliasAction.Link,
            new NamespaceId([2262289484, 3405110546]),
            new MosaicId([2262289484, 3405110546]),
            NetworkType.MIJIN_TEST,
        );

        const secretProofTransaction = SecretProofTransaction.create(
            Deadline.create(),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(Convert.hexToUint8('B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7')).hex(),
            account.address,
            'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7',
            NetworkType.MIJIN_TEST,
        );

        const aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(),
            [
                transferTransaction.toAggregate(account.publicAccount),
                accountLinkTransaction.toAggregate(account.publicAccount),
                registerNamespaceTransaction.toAggregate(account.publicAccount),
                mosaicGlobalRestrictionTransaction.toAggregate(account.publicAccount),
                mosaicAddressRestrictionTransaction.toAggregate(account.publicAccount),
                mosaicMetadataTransaction.toAggregate(account.publicAccount),
                namespaceMetadataTransaction.toAggregate(account.publicAccount),
                accountMetadataTransaction.toAggregate(account.publicAccount),
                mosaicAliasTransaction.toAggregate(account.publicAccount),
                secretProofTransaction.toAggregate(account.publicAccount),
            ],
            NetworkType.MIJIN_TEST,
            [],
        );

        const signedTransaction = aggregateTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as AggregateTransaction;

        expect(transaction.type).to.be.equal(TransactionType.AGGREGATE_COMPLETE);
        expect(transaction.innerTransactions[0].type).to.be.equal(TransactionType.TRANSFER);
        expect(transaction.innerTransactions.length).to.be.greaterThan(0);
    });

    it('should create AggregatedTransaction - Bonded', () => {
        const transferTransaction = TransferTransaction.create(
            Deadline.create(),
            Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC'),
            [],
            PlainMessage.create('test-message'),
            NetworkType.MIJIN_TEST,
        );

        const aggregateTransaction = AggregateTransaction.createBonded(
            Deadline.create(),
            [transferTransaction.toAggregate(account.publicAccount)],
            NetworkType.MIJIN_TEST,
            [],
        );

        const signedTransaction = aggregateTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as AggregateTransaction;

        expect(transaction.type).to.be.equal(TransactionType.AGGREGATE_BONDED);
        expect(transaction.innerTransactions[0].type).to.be.equal(TransactionType.TRANSFER);
    });

    it('should create LockFundTransaction', () => {
        const aggregateTransaction = AggregateTransaction.createBonded(Deadline.create(), [], NetworkType.MIJIN_TEST, []);
        const signedTransaction = account.sign(aggregateTransaction, generationHash);
        const lockTransaction = LockFundsTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createRelative(10),
            UInt64.fromUint(10),
            signedTransaction,
            NetworkType.MIJIN_TEST,
        );

        const signedLockFundTransaction = lockTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedLockFundTransaction.payload) as LockFundsTransaction;

        deepEqual(transaction.mosaic.id.id, NetworkCurrencyLocal.NAMESPACE_ID.id);
        expect(transaction.mosaic.amount.compact()).to.be.equal(10000000);
        expect(transaction.hash).to.be.equal(signedTransaction.hash);
    });

    it('should create an AccountLinkTransaction object with link action', () => {
        const accountLinkTransaction = AccountLinkTransaction.create(
            Deadline.create(),
            account.publicKey,
            LinkAction.Link,
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = accountLinkTransaction.signWith(account, generationHash);
        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as AccountLinkTransaction;

        expect(transaction.linkAction).to.be.equal(1);
        expect(transaction.remotePublicKey).to.be.equal(account.publicKey);
    });

    it('should create NamespaceRegistrationTransaction - Root', () => {
        const registerNamespaceTransaction = NamespaceRegistrationTransaction.createRootNamespace(
            Deadline.create(),
            'root-test-namespace',
            UInt64.fromUint(1000),
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = registerNamespaceTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as NamespaceRegistrationTransaction;

        expect(transaction.registrationType).to.be.equal(NamespaceRegistrationType.RootNamespace);
        expect(transaction.namespaceName).to.be.equal('root-test-namespace');
    });

    it('should create NamespaceRegistrationTransaction - Sub', () => {
        const registerNamespaceTransaction = NamespaceRegistrationTransaction.createSubNamespace(
            Deadline.create(),
            'root-test-namespace',
            'parent-test-namespace',
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = registerNamespaceTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTransaction.payload) as NamespaceRegistrationTransaction;

        expect(transaction.registrationType).to.be.equal(NamespaceRegistrationType.SubNamespace);
        expect(transaction.namespaceName).to.be.equal('root-test-namespace');
    });

    it('should create MosaicGlobalRestrictionTransaction', () => {
        const mosaicGlobalRestrictionTransaction = MosaicGlobalRestrictionTransaction.create(
            Deadline.create(),
            new MosaicId(UInt64.fromUint(1).toDTO()),
            UInt64.fromUint(4444),
            UInt64.fromUint(0),
            MosaicRestrictionType.NONE,
            UInt64.fromUint(0),
            MosaicRestrictionType.GE,
            NetworkType.MIJIN_TEST,
        );

        const signedTx = mosaicGlobalRestrictionTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTx.payload) as MosaicGlobalRestrictionTransaction;

        expect(transaction.type).to.be.equal(TransactionType.MOSAIC_GLOBAL_RESTRICTION);
        expect(transaction.mosaicId.toHex()).to.be.equal(new MosaicId(UInt64.fromUint(1).toDTO()).toHex());
        expect(transaction.referenceMosaicId.toHex()).to.be.equal(new MosaicId(UInt64.fromUint(0).toDTO()).toHex());
        expect(transaction.restrictionKey.toHex()).to.be.equal(UInt64.fromUint(4444).toHex());
        expect(transaction.previousRestrictionValue.toHex()).to.be.equal(UInt64.fromUint(0).toHex());
        expect(transaction.previousRestrictionType).to.be.equal(MosaicRestrictionType.NONE);
        expect(transaction.newRestrictionValue.toHex()).to.be.equal(UInt64.fromUint(0).toHex());
        expect(transaction.newRestrictionType).to.be.equal(MosaicRestrictionType.GE);
    });

    it('should create MosaicAddressRestrictionTransaction', () => {
        const mosaicAddressRestrictionTransaction = MosaicAddressRestrictionTransaction.create(
            Deadline.create(),
            new MosaicId(UInt64.fromUint(1).toDTO()),
            UInt64.fromUint(4444),
            account.address,
            UInt64.fromUint(0),
            NetworkType.MIJIN_TEST,
            UInt64.fromUint(0),
        );

        const signedTx = mosaicAddressRestrictionTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTx.payload) as MosaicAddressRestrictionTransaction;

        expect(transaction.type).to.be.equal(TransactionType.MOSAIC_ADDRESS_RESTRICTION);
        expect(transaction.mosaicId.toHex()).to.be.equal(new MosaicId(UInt64.fromUint(1).toDTO()).toHex());
        expect(transaction.restrictionKey.toHex()).to.be.equal(UInt64.fromUint(4444).toHex());
        expect(transaction.targetAddressToString()).to.be.equal(account.address.plain());
        expect(transaction.previousRestrictionValue.toHex()).to.be.equal(UInt64.fromUint(0).toHex());
        expect(transaction.newRestrictionValue.toHex()).to.be.equal(UInt64.fromUint(0).toHex());
    });

    it('should create MosaicAddressRestrictionTransaction - MosaicAlias', () => {
        const mosaicAddressRestrictionTransaction = MosaicAddressRestrictionTransaction.create(
            Deadline.create(),
            new NamespaceId('test'),
            UInt64.fromUint(4444),
            account.address,
            UInt64.fromUint(0),
            NetworkType.MIJIN_TEST,
            UInt64.fromUint(0),
        );

        const signedTx = mosaicAddressRestrictionTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTx.payload) as MosaicAddressRestrictionTransaction;

        expect(transaction.type).to.be.equal(TransactionType.MOSAIC_ADDRESS_RESTRICTION);
        expect(transaction.mosaicId.toHex()).to.be.equal(new NamespaceId('test').toHex());
        expect(transaction.mosaicId instanceof NamespaceId).to.be.true;
        expect(transaction.restrictionKey.toHex()).to.be.equal(UInt64.fromUint(4444).toHex());
        expect(transaction.targetAddressToString()).to.be.equal(account.address.plain());
        expect(transaction.previousRestrictionValue.toHex()).to.be.equal(UInt64.fromUint(0).toHex());
        expect(transaction.newRestrictionValue.toHex()).to.be.equal(UInt64.fromUint(0).toHex());
    });

    it('should create AddressMetadataTransaction', () => {
        const accountMetadataTransaction = AccountMetadataTransaction.create(
            Deadline.create(),
            account.publicKey,
            UInt64.fromUint(1000),
            1,
            Convert.uint8ToUtf8(new Uint8Array(10)),
            NetworkType.MIJIN_TEST,
        );
        const signedTx = accountMetadataTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTx.payload) as AccountMetadataTransaction;

        expect(transaction.type).to.be.equal(TransactionType.ACCOUNT_METADATA);
        expect(transaction.targetPublicKey).to.be.equal(account.publicKey);
        expect(transaction.scopedMetadataKey.toHex()).to.be.equal(UInt64.fromUint(1000).toHex());
        expect(transaction.valueSizeDelta).to.be.equal(1);
        expect(Convert.uint8ToHex(transaction.value)).to.be.equal(Convert.uint8ToHex(new Uint8Array(10)));
    });

    it('should create MosaicMetadataTransaction', () => {
        const mosaicMetadataTransaction = MosaicMetadataTransaction.create(
            Deadline.create(),
            account.publicKey,
            UInt64.fromUint(1000),
            new MosaicId([2262289484, 3405110546]),
            1,
            Convert.uint8ToUtf8(new Uint8Array(10)),
            NetworkType.MIJIN_TEST,
        );

        const signedTx = mosaicMetadataTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTx.payload) as MosaicMetadataTransaction;

        expect(transaction.type).to.be.equal(TransactionType.MOSAIC_METADATA);
        expect(transaction.targetPublicKey).to.be.equal(account.publicKey);
        expect(transaction.scopedMetadataKey.toHex()).to.be.equal(UInt64.fromUint(1000).toHex());
        expect(transaction.valueSizeDelta).to.be.equal(1);
        expect(transaction.targetMosaicId.toHex()).to.be.equal(new MosaicId([2262289484, 3405110546]).toHex());
        expect(Convert.uint8ToHex(transaction.value)).to.be.equal(Convert.uint8ToHex(new Uint8Array(10)));
    });

    it('should create NamespaceMetadataTransaction', () => {
        const namespaceMetadataTransaction = NamespaceMetadataTransaction.create(
            Deadline.create(),
            account.publicKey,
            UInt64.fromUint(1000),
            new NamespaceId([2262289484, 3405110546]),
            1,
            Convert.uint8ToUtf8(new Uint8Array(10)),
            NetworkType.MIJIN_TEST,
        );

        const signedTx = namespaceMetadataTransaction.signWith(account, generationHash);

        const transaction = TransactionMapping.createFromPayload(signedTx.payload) as NamespaceMetadataTransaction;

        expect(transaction.type).to.be.equal(TransactionType.NAMESPACE_METADATA);
        expect(transaction.targetPublicKey).to.be.equal(account.publicKey);
        expect(transaction.scopedMetadataKey.toHex()).to.be.equal(UInt64.fromUint(1000).toHex());
        expect(transaction.valueSizeDelta).to.be.equal(1);
        expect(transaction.targetNamespaceId.toHex()).to.be.equal(new NamespaceId([2262289484, 3405110546]).toHex());
        expect(Convert.uint8ToHex(transaction.value)).to.be.equal(Convert.uint8ToHex(new Uint8Array(10)));
    });

    it('should throw error with invalid type', () => {
        const transferTransaction = TransferTransaction.create(
            Deadline.create(),
            Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC'),
            [NetworkCurrencyLocal.createRelative(100)],
            PlainMessage.create('test-message'),
            NetworkType.MIJIN_TEST,
        );

        const signedTransaction = transferTransaction.signWith(account, generationHash);
        const wrongType = signedTransaction.payload.substring(0, 219) + '0000' + signedTransaction.payload.substring(224);

        expect(() => {
            TransactionMapping.createFromPayload(wrongType) as TransferTransaction;
        }).to.throw();
    });
});

describe('TransactionMapping - createFromDTO (Transaction.toJSON() feed)', () => {
    let account: Account;
    const generationHash = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6';
    before(() => {
        account = TestingAccount;
    });

    it('should create TransferTransaction - Address', () => {
        const transferTransaction = TransferTransaction.create(
            Deadline.create(),
            Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC'),
            [NetworkCurrencyLocal.createRelative(100)],
            PlainMessage.create('test-message'),
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(transferTransaction.toJSON()) as TransferTransaction;

        expect((transaction.recipientAddress as Address).plain()).to.be.equal('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC');
        expect(transaction.message.payload).to.be.equal('test-message');
    });

    it('should create TransferTransaction - NamespaceId', () => {
        const transferTransaction = TransferTransaction.create(
            Deadline.create(),
            new NamespaceId([33347626, 3779697293]),
            [NetworkCurrencyLocal.createRelative(100)],
            PlainMessage.create('test-message'),
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(transferTransaction.toJSON()) as TransferTransaction;
        expect((transaction.recipientAddress as NamespaceId).id.toHex().toUpperCase()).to.be.equal(
            new UInt64([33347626, 3779697293]).toHex(),
        );
        expect(transaction.message.payload).to.be.equal('test-message');
    });

    it('should create TransferTransaction - Encrypted Message', () => {
        const transferTransaction = TransferTransaction.create(
            Deadline.create(),
            Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC'),
            [NetworkCurrencyLocal.createRelative(100)],
            new EncryptedMessage('12324556'),
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(transferTransaction.toJSON()) as TransferTransaction;

        expect((transaction.recipientAddress as Address).plain()).to.be.equal('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC');
        expect(transaction.message.type).to.be.equal(MessageType.EncryptedMessage);
    });

    it('should create AccountLinkTransaction', () => {
        const accountLinkTransaction = AccountLinkTransaction.create(
            Deadline.create(),
            account.publicKey,
            LinkAction.Link,
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(accountLinkTransaction.toJSON()) as AccountLinkTransaction;

        expect(transaction.remotePublicKey).to.be.equal(account.publicKey);
        expect(transaction.linkAction).to.be.equal(LinkAction.Link);
    });

    it('should create AccountRestrictionAddressTransaction', () => {
        const address = Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC');
        const addressRestrictionTransaction = AccountRestrictionTransaction.createAddressRestrictionModificationTransaction(
            Deadline.create(),
            AccountRestrictionFlags.AllowIncomingAddress,
            [address],
            [],
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(
            addressRestrictionTransaction.toJSON(),
        ) as AccountAddressRestrictionTransaction;

        expect((transaction.restrictionAdditions[0] as Address).plain()).to.be.equal('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC');
        expect(transaction.restrictionFlags).to.be.equal(AccountRestrictionFlags.AllowIncomingAddress);
        expect(transaction.restrictionDeletions.length).to.be.equal(0);
    });

    it('should create AccountRestrictionMosaicTransaction', () => {
        const mosaicId = new MosaicId([2262289484, 3405110546]);
        const mosaicRestrictionTransaction = AccountRestrictionTransaction.createMosaicRestrictionModificationTransaction(
            Deadline.create(),
            AccountRestrictionFlags.AllowMosaic,
            [mosaicId],
            [],
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(mosaicRestrictionTransaction.toJSON()) as AccountMosaicRestrictionTransaction;

        expect(transaction.type).to.be.equal(TransactionType.ACCOUNT_MOSAIC_RESTRICTION);
        expect(transaction.restrictionFlags).to.be.equal(AccountRestrictionFlags.AllowMosaic);
        expect(transaction.restrictionAdditions.length).to.be.equal(1);
    });

    it('should create AccountRestrictionOperationTransaction', () => {
        const operation = TransactionType.ADDRESS_ALIAS;
        const operationRestrictionTransaction = AccountRestrictionTransaction.createOperationRestrictionModificationTransaction(
            Deadline.create(),
            AccountRestrictionFlags.AllowIncomingTransactionType,
            [operation],
            [],
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(
            operationRestrictionTransaction.toJSON(),
        ) as AccountMosaicRestrictionTransaction;

        expect(transaction.type).to.be.equal(TransactionType.ACCOUNT_OPERATION_RESTRICTION);
        expect(transaction.restrictionFlags).to.be.equal(AccountRestrictionFlags.AllowIncomingTransactionType);
        expect(transaction.restrictionAdditions.length).to.be.equal(1);
    });

    it('should create AddressAliasTransaction', () => {
        const namespaceId = new NamespaceId([33347626, 3779697293]);
        const address = Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC');
        const addressAliasTransaction = AddressAliasTransaction.create(
            Deadline.create(),
            AliasAction.Link,
            namespaceId,
            address,
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(addressAliasTransaction.toJSON()) as AddressAliasTransaction;

        expect(transaction.type).to.be.equal(TransactionType.ADDRESS_ALIAS);
        expect(transaction.aliasAction).to.be.equal(AliasAction.Link);
    });

    it('should create MosaicAliasTransaction', () => {
        const namespaceId = new NamespaceId([33347626, 3779697293]);
        const mosaicId = new MosaicId([2262289484, 3405110546]);
        const mosaicAliasTransaction = MosaicAliasTransaction.create(
            Deadline.create(),
            AliasAction.Link,
            namespaceId,
            mosaicId,
            NetworkType.MIJIN_TEST,
        );
        const transaction = TransactionMapping.createFromDTO(mosaicAliasTransaction.toJSON()) as MosaicAliasTransaction;

        expect(transaction.type).to.be.equal(TransactionType.MOSAIC_ALIAS);
        expect(transaction.aliasAction).to.be.equal(AliasAction.Link);
    });

    it('should create MosaicDefinitionTransaction', () => {
        const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(),
            MosaicNonce.createFromUint8Array(new Uint8Array([0xe6, 0xde, 0x84, 0xb8])), // nonce
            new MosaicId(UInt64.fromUint(1).toDTO()), // ID
            MosaicFlags.create(false, false, false),
            3,
            UInt64.fromUint(1000),
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(mosaicDefinitionTransaction.toJSON()) as MosaicDefinitionTransaction;

        expect(transaction.type).to.be.equal(TransactionType.MOSAIC_DEFINITION);
        expect(transaction.flags.supplyMutable).to.be.equal(false);
        expect(transaction.flags.transferable).to.be.equal(false);
        expect(transaction.flags.transferable).to.be.equal(false);
        expect(transaction.divisibility).to.be.equal(3);
    });

    it('should create MosaicSupplyChangeTransaction', () => {
        const mosaicId = new MosaicId([2262289484, 3405110546]);
        const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
            Deadline.create(),
            mosaicId,
            MosaicSupplyChangeAction.Increase,
            UInt64.fromUint(10),
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(mosaicSupplyChangeTransaction.toJSON()) as MosaicSupplyChangeTransaction;

        expect(transaction.type).to.be.equal(TransactionType.MOSAIC_SUPPLY_CHANGE);
        expect(transaction.action).to.be.equal(MosaicSupplyChangeAction.Increase);
    });

    it('should create SecretLockTransaction', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createAbsolute(10),
            UInt64.fromUint(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(Convert.hexToUint8(proof)).hex(),
            recipientAddress,
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(secretLockTransaction.toJSON()) as SecretLockTransaction;

        expect(transaction.type).to.be.equal(TransactionType.SECRET_LOCK);
        expect(transaction.hashAlgorithm).to.be.equal(LockHashAlgorithm.Op_Sha3_256);
    });

    it('should create SecretLockTransaction - Address alias', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = new NamespaceId('test');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createAbsolute(10),
            UInt64.fromUint(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(Convert.hexToUint8(proof)).hex(),
            recipientAddress,
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(secretLockTransaction.toJSON()) as SecretLockTransaction;

        expect(transaction.type).to.be.equal(TransactionType.SECRET_LOCK);
        expect(transaction.hashAlgorithm).to.be.equal(LockHashAlgorithm.Op_Sha3_256);
        expect((transaction.recipientAddress as NamespaceId).id.toHex()).to.be.equal(recipientAddress.toHex());
    });

    it('should create SecretLockTransaction - resolved Mosaic', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            new Mosaic(new MosaicId([1, 1]), UInt64.fromUint(10)),
            UInt64.fromUint(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(Convert.hexToUint8(proof)).hex(),
            recipientAddress,
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(secretLockTransaction.toJSON()) as SecretLockTransaction;

        expect(transaction.type).to.be.equal(TransactionType.SECRET_LOCK);
        expect(transaction.hashAlgorithm).to.be.equal(LockHashAlgorithm.Op_Sha3_256);
        expect(transaction.mosaic.id.toHex()).to.be.equal(new MosaicId([1, 1]).toHex());
    });

    it('should create SecretProofTransaction', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const secretProofTransaction = SecretProofTransaction.create(
            Deadline.create(),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(Convert.hexToUint8(proof)).hex(),
            account.address,
            proof,
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(secretProofTransaction.toJSON()) as SecretProofTransaction;

        expect(transaction.type).to.be.equal(TransactionType.SECRET_PROOF);
        expect(transaction.hashAlgorithm).to.be.equal(LockHashAlgorithm.Op_Sha3_256);
        expect(transaction.secret).to.be.equal(sha3_256.create().update(Convert.hexToUint8(proof)).hex());
        deepEqual(transaction.recipientAddress, account.address);
        expect(transaction.proof).to.be.equal(proof);
    });

    it('should create SecretProofTransaction - Address alias', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = new NamespaceId('test');
        const secretProofTransaction = SecretProofTransaction.create(
            Deadline.create(),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(Convert.hexToUint8(proof)).hex(),
            recipientAddress,
            proof,
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(secretProofTransaction.toJSON()) as SecretProofTransaction;

        expect(transaction.type).to.be.equal(TransactionType.SECRET_PROOF);
        expect(transaction.hashAlgorithm).to.be.equal(LockHashAlgorithm.Op_Sha3_256);
        expect(transaction.secret).to.be.equal(sha3_256.create().update(Convert.hexToUint8(proof)).hex());
        expect(transaction.proof).to.be.equal(proof);
        expect((transaction.recipientAddress as NamespaceId).id.toHex()).to.be.equal(recipientAddress.toHex());
    });

    it('should create ModifyMultiSigTransaction', () => {
        const modifyMultisigAccountTransaction = MultisigAccountModificationTransaction.create(
            Deadline.create(),
            2,
            1,
            [PublicAccount.createFromPublicKey('B0F93CBEE49EEB9953C6F3985B15A4F238E205584D8F924C621CBE4D7AC6EC24', NetworkType.MIJIN_TEST)],
            [],
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(
            modifyMultisigAccountTransaction.toJSON(),
        ) as MultisigAccountModificationTransaction;

        expect(transaction.type).to.be.equal(TransactionType.MULTISIG_ACCOUNT_MODIFICATION);
        expect(transaction.minApprovalDelta).to.be.equal(2);
        expect(transaction.minRemovalDelta).to.be.equal(1);
    });

    it('should create AggregatedTransaction - Complete', () => {
        const transferTransaction = TransferTransaction.create(
            Deadline.create(),
            Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC'),
            [],
            PlainMessage.create('test-message'),
            NetworkType.MIJIN_TEST,
        );

        const aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(),
            [transferTransaction.toAggregate(account.publicAccount)],
            NetworkType.MIJIN_TEST,
            [],
        );

        const transaction = TransactionMapping.createFromDTO(aggregateTransaction.toJSON()) as AggregateTransaction;

        expect(transaction.type).to.be.equal(TransactionType.AGGREGATE_COMPLETE);
        expect(transaction.innerTransactions.length).to.be.equal(1);
    });

    it('should create AggregatedTransaction - Bonded', () => {
        const transferTransaction = TransferTransaction.create(
            Deadline.create(),
            Address.createFromRawAddress('SBILTA367K2LX2FEXG5TFWAS7GEFYAGY7QLFBYKC'),
            [],
            PlainMessage.create('test-message'),
            NetworkType.MIJIN_TEST,
        );

        const aggregateTransaction = AggregateTransaction.createBonded(
            Deadline.create(),
            [transferTransaction.toAggregate(account.publicAccount)],
            NetworkType.MIJIN_TEST,
            [],
        );

        const transaction = TransactionMapping.createFromDTO(aggregateTransaction.toJSON()) as AggregateTransaction;

        expect(transaction.type).to.be.equal(TransactionType.AGGREGATE_BONDED);
        expect(transaction.innerTransactions.length).to.be.equal(1);
    });

    it('should create LockFundTransaction', () => {
        const aggregateTransaction = AggregateTransaction.createBonded(Deadline.create(), [], NetworkType.MIJIN_TEST, []);
        const signedTransaction = account.sign(aggregateTransaction, generationHash);
        const lockTransaction = LockFundsTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createRelative(10),
            UInt64.fromUint(10),
            signedTransaction,
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(lockTransaction.toJSON()) as LockFundsTransaction;

        expect(transaction.type).to.be.equal(TransactionType.HASH_LOCK);
        expect(transaction.hash).to.be.equal(signedTransaction.hash);
    });

    it('should create NamespaceRegistrationTransaction - Root', () => {
        const registerNamespaceTransaction = NamespaceRegistrationTransaction.createRootNamespace(
            Deadline.create(),
            'root-test-namespace',
            UInt64.fromUint(1000),
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(registerNamespaceTransaction.toJSON()) as NamespaceRegistrationTransaction;

        expect(transaction.type).to.be.equal(TransactionType.NAMESPACE_REGISTRATION);
    });

    it('should create NamespaceRegistrationTransaction - Sub', () => {
        const registerNamespaceTransaction = NamespaceRegistrationTransaction.createSubNamespace(
            Deadline.create(),
            'root-test-namespace',
            'parent-test-namespace',
            NetworkType.MIJIN_TEST,
        );
        const transaction = TransactionMapping.createFromDTO(registerNamespaceTransaction.toJSON()) as NamespaceRegistrationTransaction;

        expect(transaction.type).to.be.equal(TransactionType.NAMESPACE_REGISTRATION);
    });

    it('should create MosaicGlobalRestrictionTransaction', () => {
        const mosaicGlobalRestrictionTransaction = MosaicGlobalRestrictionTransaction.create(
            Deadline.create(),
            new MosaicId(UInt64.fromUint(1).toDTO()),
            UInt64.fromUint(4444),
            UInt64.fromUint(0),
            MosaicRestrictionType.NONE,
            UInt64.fromUint(0),
            MosaicRestrictionType.GE,
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(
            mosaicGlobalRestrictionTransaction.toJSON(),
        ) as MosaicGlobalRestrictionTransaction;

        expect(transaction.type).to.be.equal(TransactionType.MOSAIC_GLOBAL_RESTRICTION);
        expect(transaction.mosaicId.id.compact()).to.be.equal(1);
        expect(transaction.referenceMosaicId.id.compact()).to.be.equal(0);
        expect(transaction.restrictionKey.toHex()).to.be.equal(UInt64.fromUint(4444).toHex());
        expect(transaction.previousRestrictionValue.toHex()).to.be.equal(UInt64.fromUint(0).toHex());
        expect(transaction.previousRestrictionType).to.be.equal(MosaicRestrictionType.NONE);
        expect(transaction.newRestrictionValue.toHex()).to.be.equal(UInt64.fromUint(0).toHex());
        expect(transaction.newRestrictionType).to.be.equal(MosaicRestrictionType.GE);
    });

    it('should create MosaicAddressRestrictionTransaction', () => {
        const mosaicAddressRestrictionTransaction = MosaicAddressRestrictionTransaction.create(
            Deadline.create(),
            new MosaicId(UInt64.fromUint(1).toDTO()),
            UInt64.fromUint(4444),
            account.address,
            UInt64.fromUint(0),
            NetworkType.MIJIN_TEST,
            UInt64.fromUint(0),
        );

        const transaction = TransactionMapping.createFromDTO(
            mosaicAddressRestrictionTransaction.toJSON(),
        ) as MosaicAddressRestrictionTransaction;

        expect(transaction.type).to.be.equal(TransactionType.MOSAIC_ADDRESS_RESTRICTION);
        expect(transaction.mosaicId.id.compact()).to.be.equal(1);
        expect(transaction.restrictionKey.toHex()).to.be.equal(UInt64.fromUint(4444).toHex());
        expect(transaction.targetAddressToString()).to.be.equal(account.address.plain());
        expect(transaction.previousRestrictionValue.toHex()).to.be.equal(UInt64.fromUint(0).toHex());
        expect(transaction.newRestrictionValue.toHex()).to.be.equal(UInt64.fromUint(0).toHex());
    });

    it('should create AddressMetadataTransaction', () => {
        const accountMetadataTransaction = AccountMetadataTransaction.create(
            Deadline.create(),
            account.publicKey,
            UInt64.fromUint(1000),
            1,
            'Test Value',
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(accountMetadataTransaction.toJSON()) as AccountMetadataTransaction;

        expect(transaction.type).to.be.equal(TransactionType.ACCOUNT_METADATA);
        expect(transaction.targetPublicKey).to.be.equal(account.publicKey);
        expect(transaction.scopedMetadataKey.toHex()).to.be.equal(UInt64.fromUint(1000).toHex());
        expect(transaction.valueSizeDelta).to.be.equal(1);
        expect(transaction.value).to.be.equal('Test Value');
    });

    it('should create MosaicMetadataTransaction', () => {
        const mosaicMetadataTransaction = MosaicMetadataTransaction.create(
            Deadline.create(),
            account.publicKey,
            UInt64.fromUint(1000),
            new MosaicId([2262289484, 3405110546]),
            1,
            'Test Value',
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(mosaicMetadataTransaction.toJSON()) as MosaicMetadataTransaction;

        expect(transaction.type).to.be.equal(TransactionType.MOSAIC_METADATA);
        expect(transaction.targetPublicKey).to.be.equal(account.publicKey);
        expect(transaction.scopedMetadataKey.toHex()).to.be.equal(UInt64.fromUint(1000).toHex());
        expect(transaction.valueSizeDelta).to.be.equal(1);
        expect(transaction.targetMosaicId.toHex()).to.be.equal(new MosaicId([2262289484, 3405110546]).toHex());
        expect(transaction.value).to.be.equal('Test Value');
    });

    it('should create NamespaceMetadataTransaction', () => {
        const namespaceMetadataTransaction = NamespaceMetadataTransaction.create(
            Deadline.create(),
            account.publicKey,
            UInt64.fromUint(1000),
            new NamespaceId([2262289484, 3405110546]),
            1,
            'Test Value',
            NetworkType.MIJIN_TEST,
        );

        const transaction = TransactionMapping.createFromDTO(namespaceMetadataTransaction.toJSON()) as NamespaceMetadataTransaction;

        expect(transaction.type).to.be.equal(TransactionType.NAMESPACE_METADATA);
        expect(transaction.targetPublicKey).to.be.equal(account.publicKey);
        expect(transaction.scopedMetadataKey.toString()).to.be.equal(UInt64.fromUint(1000).toString());
        expect(transaction.valueSizeDelta).to.be.equal(1);
        expect(transaction.targetNamespaceId.toHex()).to.be.equal(new NamespaceId([2262289484, 3405110546]).toHex());
        expect(transaction.value).to.be.equal('Test Value');
    });
});
