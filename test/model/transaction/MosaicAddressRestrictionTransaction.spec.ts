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
import { Convert } from '../../../src/core/format';
import { Account } from '../../../src/model/account/Account';
import { Address } from '../../../src/model/account/Address';
import { MosaicId } from '../../../src/model/mosaic/MosaicId';
import { NamespaceId } from '../../../src/model/namespace/NamespaceId';
import { NetworkType } from '../../../src/model/network/NetworkType';
import { ReceiptSource } from '../../../src/model/receipt/ReceiptSource';
import { ResolutionEntry } from '../../../src/model/receipt/ResolutionEntry';
import { ResolutionStatement } from '../../../src/model/receipt/ResolutionStatement';
import { ResolutionType } from '../../../src/model/receipt/ResolutionType';
import { Statement } from '../../../src/model/receipt/Statement';
import { Deadline } from '../../../src/model/transaction/Deadline';
import { MosaicAddressRestrictionTransaction } from '../../../src/model/transaction/MosaicAddressRestrictionTransaction';
import { TransactionInfo } from '../../../src/model/transaction/TransactionInfo';
import { TestingAccount } from '../../conf/conf.spec';

describe('MosaicAddressRestrictionTransaction', () => {
    let account: Account;
    const generationHash = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6';
    let statement: Statement;
    const unresolvedAddress = new NamespaceId('address');
    const unresolvedMosaicId = new NamespaceId('mosaic');
    const resolvedMosaicId = new MosaicId('0DC67FBE1CAD29E5');
    before(() => {
        account = TestingAccount;
        statement = new Statement(
            [],
            [
                new ResolutionStatement(ResolutionType.Address, BigInt(2), unresolvedAddress, [
                    new ResolutionEntry(account.address, new ReceiptSource(1, 0)),
                ]),
            ],
            [
                new ResolutionStatement(ResolutionType.Mosaic, BigInt(2), unresolvedMosaicId, [
                    new ResolutionEntry(resolvedMosaicId, new ReceiptSource(1, 0)),
                ]),
            ],
        );
    });

    it('should createComplete an MosaicAddressRestrictionTransaction object and sign', () => {
        const mosaicId = new MosaicId(BigInt(1));
        const mosaicAddressRestrictionTransaction = MosaicAddressRestrictionTransaction.create(
            Deadline.create(),
            mosaicId,
            BigInt(1),
            account.address,
            BigInt(8),
            NetworkType.MIJIN_TEST,
            BigInt(9),
        );
        expect(mosaicAddressRestrictionTransaction.mosaicId.toHex()).to.be.equal(mosaicId.toHex());
        expect(mosaicAddressRestrictionTransaction.restrictionKey).to.be.equal(BigInt(1));
        expect(mosaicAddressRestrictionTransaction.previousRestrictionValue).to.be.equal(BigInt(9));
        expect(mosaicAddressRestrictionTransaction.newRestrictionValue).to.be.equal(BigInt(8));
        expect(mosaicAddressRestrictionTransaction.targetAddressToString()).to.be.equal(account.address.plain());

        const signedTransaction = mosaicAddressRestrictionTransaction.signWith(account, generationHash);

        expect(signedTransaction.payload.substring(256, signedTransaction.payload.length)).to.be.equal(
            '010000000000000001000000000000000900000000000000080' + '000000000000090D66C33420E5411995BACFCA2B28CF1C9F5DD7AB1204EA451',
        );
    });

    it('should createComplete an MosaicAddressRestrictionTransaction use mosaic alias', () => {
        const namespacId = NamespaceId.createFromEncoded('9550CA3FC9B41FC5');
        const mosaicAddressRestrictionTransaction = MosaicAddressRestrictionTransaction.create(
            Deadline.create(),
            namespacId,
            BigInt(1),
            account.address,
            BigInt(8),
            NetworkType.MIJIN_TEST,
            BigInt(9),
        );
        expect(mosaicAddressRestrictionTransaction.mosaicId.toHex()).to.be.equal(namespacId.toHex());
        expect(mosaicAddressRestrictionTransaction.restrictionKey).to.be.equal(BigInt(1));
        expect(mosaicAddressRestrictionTransaction.previousRestrictionValue).to.be.equal(BigInt(9));
        expect(mosaicAddressRestrictionTransaction.newRestrictionValue).to.be.equal(BigInt(8));
        expect(mosaicAddressRestrictionTransaction.targetAddressToString()).to.be.equal(account.address.plain());

        const signedTransaction = mosaicAddressRestrictionTransaction.signWith(account, generationHash);

        expect(signedTransaction.payload.substring(256, signedTransaction.payload.length)).to.be.equal(
            'C51FB4C93FCA509501000000000000000900000000000000080000000000' + '000090D66C33420E5411995BACFCA2B28CF1C9F5DD7AB1204EA451',
        );
    });

    it('should createComplete an MosaicAddressRestrictionTransaction use address alias', () => {
        const mosaicId = new MosaicId(BigInt(1));
        const namespacId = NamespaceId.createFromEncoded('9550CA3FC9B41FC5');
        const mosaicAddressRestrictionTransaction = MosaicAddressRestrictionTransaction.create(
            Deadline.create(),
            mosaicId,
            BigInt(1),
            namespacId,
            BigInt(8),
            NetworkType.MIJIN_TEST,
            BigInt(9),
        );
        expect(mosaicAddressRestrictionTransaction.mosaicId.toHex()).to.be.equal(mosaicId.toHex());
        expect(mosaicAddressRestrictionTransaction.restrictionKey).to.be.equal(BigInt(1));
        expect(mosaicAddressRestrictionTransaction.previousRestrictionValue).to.be.equal(BigInt(9));
        expect(mosaicAddressRestrictionTransaction.newRestrictionValue).to.be.equal(BigInt(8));
        expect(mosaicAddressRestrictionTransaction.targetAddressToString()).to.be.equal(namespacId.toHex());

        const signedTransaction = mosaicAddressRestrictionTransaction.signWith(account, generationHash);

        expect(signedTransaction.payload.substring(256, signedTransaction.payload.length)).to.be.equal(
            '01000000000000000100000000000000090000000000000008000000000' + '0000091C51FB4C93FCA509500000000000000000000000000000000',
        );
    });

    it('should format targetAddress payload with 8 bytes binary namespaceId - targetAddressToString', () => {
        const transaction = MosaicAddressRestrictionTransaction.create(
            Deadline.create(),
            new MosaicId(BigInt(1)),
            BigInt(1),
            new NamespaceId('nem.owner'),
            BigInt(8),
            NetworkType.MIJIN_TEST,
            BigInt(9),
        );

        // test targetAddressToString with NamespaceId recipient
        expect(transaction.targetAddressToString()).to.be.equal('D85742D268617751');

        const signedTransaction = transaction.signWith(account, generationHash);

        expect(signedTransaction.payload.substring(256, 304)).to.be.equal('010000000000000001000000000000000900000000000000');

        expect(Convert.hexToUint8(transaction.serialize()).length).to.be.equal(transaction.size);
    });

    it('Test set maxFee using multiplier', () => {
        const transaction = MosaicAddressRestrictionTransaction.create(
            Deadline.create(),
            new MosaicId(BigInt(1)),
            BigInt(1),
            new NamespaceId('nem.owner'),
            BigInt(8),
            NetworkType.MIJIN_TEST,
            BigInt(9),
        ).setMaxFee(2);
        expect(transaction.maxFee).to.be.equal(BigInt(370));

        const signedTransaction = transaction.signWith(account, generationHash);
        expect(signedTransaction.hash).not.to.be.undefined;
    });

    it('Test resolveAlias can resolve', () => {
        const transaction = new MosaicAddressRestrictionTransaction(
            NetworkType.MIJIN_TEST,
            1,
            Deadline.createFromDTO('1'),
            BigInt(0),
            unresolvedMosaicId,
            BigInt(8),
            unresolvedAddress,
            BigInt(8),
            BigInt(9),
            '',
            account.publicAccount,
            new TransactionInfo(BigInt(2), 0, ''),
        ).resolveAliases(statement);
        expect(transaction.targetAddress instanceof Address).to.be.true;
        expect(transaction.mosaicId instanceof MosaicId).to.be.true;
        expect((transaction.targetAddress as Address).equals(account.address)).to.be.true;
        expect((transaction.mosaicId as MosaicId).equals(resolvedMosaicId)).to.be.true;

        const signedTransaction = transaction.signWith(account, generationHash);
        expect(signedTransaction.hash).not.to.be.undefined;
    });
});
