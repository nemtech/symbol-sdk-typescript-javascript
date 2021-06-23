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

import { expect } from 'chai';
import { sha3_256 } from 'js-sha3';
import { Crypto } from '../../src/core/crypto';
import { Convert as convert, Convert } from '../../src/core/format';
import { TransactionMapping } from '../../src/core/utils';
import { Transaction, TransactionVersion, UInt64 } from '../../src/model';
import { Account, Address } from '../../src/model/account';
import { LockHashAlgorithm } from '../../src/model/lock';
import { PlainMessage } from '../../src/model/message';
import { MosaicFlags, MosaicId, MosaicNonce, MosaicSupplyChangeAction } from '../../src/model/mosaic';
import { AliasAction, NamespaceId } from '../../src/model/namespace';
import { NetworkType } from '../../src/model/network';
import { AddressRestrictionFlag, MosaicRestrictionFlag, OperationRestrictionFlag } from '../../src/model/restriction';
import {
    AccountKeyLinkTransaction,
    AccountRestrictionTransaction,
    AddressAliasTransaction,
    AggregateTransaction,
    Deadline,
    LinkAction,
    LockFundsTransaction,
    MosaicAliasTransaction,
    MosaicDefinitionTransaction,
    MosaicSupplyChangeTransaction,
    MultisigAccountModificationTransaction,
    NamespaceRegistrationTransaction,
    NodeKeyLinkTransaction,
    SecretLockTransaction,
    SecretProofTransaction,
    TransactionType,
    TransferTransaction,
    VotingKeyLinkTransaction,
    VrfKeyLinkTransaction,
} from '../../src/model/transaction';
import { TestingAccount } from '../conf/conf.spec';
import { NetworkCurrencyLocal } from '../model/mosaic/Currency.spec';

describe('SerializeTransactionToJSON', () => {
    let account: Account;
    const epochAdjustment = 1573430400;
    before(() => {
        account = TestingAccount;
    });

    const validateToFromJson = <T extends Transaction>(expectedTransaction: T): any => {
        const json = expectedTransaction.toJSON();
        const transaction = TransactionMapping.createFromDTO(json);
        expect(transaction).deep.eq(expectedTransaction);
        expect(transaction.toJSON()).deep.eq(json);
        return json;
    };

    it('should create AccountKeyLinkTransaction', () => {
        const accountLinkTransaction = AccountKeyLinkTransaction.create(
            Deadline.create(epochAdjustment),
            account.publicKey,
            LinkAction.Link,
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(accountLinkTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.linkedPublicKey).to.be.equal(account.publicKey);
        expect(json.transaction.linkAction).to.be.equal(LinkAction.Link);
    });

    it('should create AccountRestrictionAddressTransaction', () => {
        const address = Address.createFromRawAddress('VATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA35C4KNQ');
        const addressRestrictionTransaction = AccountRestrictionTransaction.createAddressRestrictionModificationTransaction(
            Deadline.create(epochAdjustment),
            AddressRestrictionFlag.AllowIncomingAddress,
            [address],
            [],
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(addressRestrictionTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.ACCOUNT_ADDRESS_RESTRICTION);
        expect(json.transaction.restrictionFlags).to.be.equal(AddressRestrictionFlag.AllowIncomingAddress);
        expect(json.transaction.restrictionAdditions.length).to.be.equal(1);
    });

    it('should create AccountRestrictionMosaicTransaction', () => {
        const mosaicId = new MosaicId([2262289484, 3405110546]);
        const mosaicRestrictionTransaction = AccountRestrictionTransaction.createMosaicRestrictionModificationTransaction(
            Deadline.create(epochAdjustment),
            MosaicRestrictionFlag.AllowMosaic,
            [mosaicId],
            [],
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(mosaicRestrictionTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.ACCOUNT_MOSAIC_RESTRICTION);
        expect(json.transaction.restrictionFlags).to.be.equal(MosaicRestrictionFlag.AllowMosaic);
        expect(json.transaction.restrictionAdditions.length).to.be.equal(1);
    });

    it('should create AccountRestrictionOperationTransaction', () => {
        const operation = TransactionType.ADDRESS_ALIAS;
        const operationRestrictionTransaction = AccountRestrictionTransaction.createOperationRestrictionModificationTransaction(
            Deadline.create(epochAdjustment),
            OperationRestrictionFlag.AllowOutgoingTransactionType,
            [operation],
            [],
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(operationRestrictionTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.ACCOUNT_OPERATION_RESTRICTION);
        expect(json.transaction.restrictionFlags).to.be.equal(OperationRestrictionFlag.AllowOutgoingTransactionType);
        expect(json.transaction.restrictionAdditions.length).to.be.equal(1);
    });

    it('should create AddressAliasTransaction', () => {
        const namespaceId = new NamespaceId([33347626, 3779697293]);
        const address = Address.createFromRawAddress('VATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA35C4KNQ');
        const addressAliasTransaction = AddressAliasTransaction.create(
            Deadline.create(epochAdjustment),
            AliasAction.Link,
            namespaceId,
            address,
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(addressAliasTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.ADDRESS_ALIAS);
        expect(json.transaction.aliasAction).to.be.equal(AliasAction.Link);
    });

    it('should create MosaicAliasTransaction', () => {
        const namespaceId = new NamespaceId([33347626, 3779697293]);
        const mosaicId = new MosaicId([2262289484, 3405110546]);
        const mosaicAliasTransaction = MosaicAliasTransaction.create(
            Deadline.create(epochAdjustment),
            AliasAction.Link,
            namespaceId,
            mosaicId,
            NetworkType.PRIVATE_TEST,
        );
        const json = validateToFromJson(mosaicAliasTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.MOSAIC_ALIAS);
        expect(json.transaction.aliasAction).to.be.equal(AliasAction.Link);
    });

    it('should create MosaicDefinitionTransaction', () => {
        const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(epochAdjustment),
            MosaicNonce.createFromUint8Array(new Uint8Array([0xe6, 0xde, 0x84, 0xb8])), // nonce
            new MosaicId(UInt64.fromUint(1).toDTO()), // ID
            MosaicFlags.create(true, true, true),
            5,
            UInt64.fromUint(1000),
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(mosaicDefinitionTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.MOSAIC_DEFINITION);
        expect(json.transaction.flags).to.be.equal(7);
        expect(json.transaction.divisibility).to.be.equal(5);
        expect(json.transaction.duration).to.be.equal('1000');
    });

    it('should create MosaicDefinitionTransaction without duration', () => {
        const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(epochAdjustment),
            MosaicNonce.createFromUint8Array(new Uint8Array([0xe6, 0xde, 0x84, 0xb8])), // nonce
            new MosaicId(UInt64.fromUint(1).toDTO()), // ID
            MosaicFlags.create(true, false),
            3,
            UInt64.fromUint(0),
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(mosaicDefinitionTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.MOSAIC_DEFINITION);
        expect(json.transaction.divisibility).to.be.equal(3);
        expect(json.transaction.flags).to.be.equal(1);
    });

    it('should create MosaicSupplyChangeTransaction', () => {
        const mosaicId = new MosaicId([2262289484, 3405110546]);
        const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
            Deadline.create(epochAdjustment),
            mosaicId,
            MosaicSupplyChangeAction.Increase,
            UInt64.fromUint(10),
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(mosaicSupplyChangeTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.MOSAIC_SUPPLY_CHANGE);
        expect(json.transaction.action).to.be.equal(MosaicSupplyChangeAction.Increase);
    });

    it('should create TransferTransaction', () => {
        const mosaic = NetworkCurrencyLocal.createRelative(100);
        const transferTransaction = TransferTransaction.create(
            Deadline.create(epochAdjustment),
            Address.createFromRawAddress('VATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA35C4KNQ'),
            [mosaic],
            PlainMessage.create('test-message'),
            NetworkType.PRIVATE_TEST,
        );
        // So deep equals works!
        delete transferTransaction.mosaics[0].id['fullName'];

        const json = validateToFromJson(transferTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.TRANSFER);
        expect(json.transaction.message).to.be.equal('00746573742D6D657373616765');
    });

    it('should create SecretLockTransaction', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = Address.createFromRawAddress('VATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA35C4KNQ');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(epochAdjustment),
            NetworkCurrencyLocal.createAbsolute(10),
            UInt64.fromUint(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(convert.hexToUint8(proof)).hex(),
            recipientAddress,
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(secretLockTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.SECRET_LOCK);
        expect(json.transaction.hashAlgorithm).to.be.equal(LockHashAlgorithm.Op_Sha3_256);
    });

    it('should create SecretProofTransaction', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const secretProofTransaction = SecretProofTransaction.create(
            Deadline.create(epochAdjustment),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(convert.hexToUint8(proof)).hex(),
            account.address,
            proof,
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(secretProofTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.SECRET_PROOF);
        expect(json.transaction.hashAlgorithm).to.be.equal(LockHashAlgorithm.Op_Sha3_256);
        expect(json.transaction.secret).to.be.equal(sha3_256.create().update(convert.hexToUint8(proof)).hex());
        expect(json.transaction.proof).to.be.equal(proof);
    });

    it('should create ModifyMultiSigTransaction', () => {
        const modifyMultisigAccountTransaction = MultisigAccountModificationTransaction.create(
            Deadline.create(epochAdjustment),
            2,
            1,
            [Address.createFromPublicKey('B0F93CBEE49EEB9953C6F3985B15A4F238E205584D8F924C621CBE4D7AC6EC24', NetworkType.PRIVATE_TEST)],
            [],
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(modifyMultisigAccountTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.MULTISIG_ACCOUNT_MODIFICATION);
        expect(json.transaction.minApprovalDelta).to.be.equal(2);
        expect(json.transaction.minRemovalDelta).to.be.equal(1);
    });

    it('should create AggregatedTransaction - Complete', () => {
        const deadline = Deadline.create(epochAdjustment);
        const transferTransaction = TransferTransaction.create(
            deadline,
            Address.createFromRawAddress('VATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA35C4KNQ'),
            [],
            PlainMessage.create('test-message'),
            NetworkType.PRIVATE_TEST,
        );

        const aggregateTransaction = AggregateTransaction.createComplete(
            deadline,
            [transferTransaction.toAggregate(account.publicAccount)],
            NetworkType.PRIVATE_TEST,
            [],
        );

        const json = validateToFromJson(aggregateTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.AGGREGATE_COMPLETE);
        expect(json.transaction.transactions.length).to.be.equal(1);
    });

    it('should create AggregatedTransaction - Bonded', () => {
        const deadline = Deadline.create(epochAdjustment);
        const transferTransaction = TransferTransaction.create(
            deadline,
            Address.createFromRawAddress('VATNE7Q5BITMUTRRN6IB4I7FLSDRDWZA35C4KNQ'),
            [],
            PlainMessage.create('test-message'),
            NetworkType.PRIVATE_TEST,
        );

        const aggregateTransaction = AggregateTransaction.createBonded(
            deadline,
            [transferTransaction.toAggregate(account.publicAccount)],
            NetworkType.PRIVATE_TEST,
            [],
        );

        const json = validateToFromJson(aggregateTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.AGGREGATE_BONDED);
        expect(json.transaction.transactions.length).to.be.equal(1);
    });

    it('should create LockFundTransaction', () => {
        const generationHash = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6';
        const aggregateTransaction = AggregateTransaction.createBonded(Deadline.create(epochAdjustment), [], NetworkType.PRIVATE_TEST, []);
        const signedTransaction = account.sign(aggregateTransaction, generationHash);
        const lockTransaction = LockFundsTransaction.create(
            Deadline.create(epochAdjustment),
            NetworkCurrencyLocal.createRelative(10),
            UInt64.fromUint(10),
            signedTransaction,
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(lockTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.HASH_LOCK);
        expect(json.transaction.hash).to.be.equal(signedTransaction.hash);
    });

    it('should create NamespaceRegistrationTransaction - Root', () => {
        const registerNamespaceTransaction = NamespaceRegistrationTransaction.createRootNamespace(
            Deadline.create(epochAdjustment),
            'root-test-namespace',
            UInt64.fromUint(1000),
            NetworkType.PRIVATE_TEST,
        );
        // So deep equals works!
        delete (registerNamespaceTransaction.namespaceId as any).fullName;
        const json = validateToFromJson(registerNamespaceTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.NAMESPACE_REGISTRATION);
    });

    it('should create NamespaceRegistrationTransaction - Sub', () => {
        const registerNamespaceTransaction = NamespaceRegistrationTransaction.createSubNamespace(
            Deadline.create(epochAdjustment),
            'root-test-namespace',
            'parent-test-namespace',
            NetworkType.PRIVATE_TEST,
        );

        const json = validateToFromJson(registerNamespaceTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.type).to.be.equal(TransactionType.NAMESPACE_REGISTRATION);
    });

    it('should create VrfKeyLinkTransaction', () => {
        const vrfKeyLinkTransaction = VrfKeyLinkTransaction.create(
            Deadline.create(epochAdjustment),
            account.publicKey,
            LinkAction.Link,
            NetworkType.PRIVATE_TEST,
        );
        const json = validateToFromJson(vrfKeyLinkTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.linkedPublicKey).to.be.equal(account.publicKey);
        expect(json.transaction.linkAction).to.be.equal(LinkAction.Link);
    });

    it('should create NodeKeyLinkTransaction', () => {
        const nodeKeyLinkTransaction = NodeKeyLinkTransaction.create(
            Deadline.create(epochAdjustment),
            account.publicKey,
            LinkAction.Link,
            NetworkType.PRIVATE_TEST,
        );
        const json = validateToFromJson(nodeKeyLinkTransaction);
        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.linkedPublicKey).to.be.equal(account.publicKey);
        expect(json.transaction.linkAction).to.be.equal(LinkAction.Link);
    });

    it('should create VotingKeyLinkTransaction', () => {
        const votingKey = Convert.uint8ToHex(Crypto.randomBytes(32));
        const votingKeyLinkTransaction = VotingKeyLinkTransaction.create(
            Deadline.create(epochAdjustment),
            votingKey,
            1,
            3,
            LinkAction.Link,
            NetworkType.PRIVATE_TEST,
            TransactionVersion.VOTING_KEY_LINK,
        );

        const json = validateToFromJson(votingKeyLinkTransaction);

        expect(json.transaction.version).to.be.equal(1);
        expect(json.transaction.linkedPublicKey).to.be.equal(votingKey);
        expect(json.transaction.startEpoch).to.be.equal(1);
        expect(json.transaction.endEpoch).to.be.equal(3);
        expect(json.transaction.linkAction).to.be.equal(LinkAction.Link);
    });
});
