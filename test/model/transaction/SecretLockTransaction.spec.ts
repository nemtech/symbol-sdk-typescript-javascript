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
import { deepEqual } from 'assert';
import { expect } from 'chai';
import * as CryptoJS from 'crypto-js';
import { sha3_256 } from 'js-sha3';
import { Convert, Convert as convert } from '../../../src/core/format';
import { Account } from '../../../src/model/account/Account';
import { Address } from '../../../src/model/account/Address';
import { Mosaic } from '../../../src/model/mosaic/Mosaic';
import { MosaicId } from '../../../src/model/mosaic/MosaicId';
import { NetworkCurrencyLocal } from '../../../src/model/mosaic/NetworkCurrencyLocal';
import { NamespaceId } from '../../../src/model/namespace/NamespaceId';
import { NetworkType } from '../../../src/model/network/NetworkType';
import { ReceiptSource } from '../../../src/model/receipt/ReceiptSource';
import { ResolutionEntry } from '../../../src/model/receipt/ResolutionEntry';
import { ResolutionStatement } from '../../../src/model/receipt/ResolutionStatement';
import { ResolutionType } from '../../../src/model/receipt/ResolutionType';
import { Statement } from '../../../src/model/receipt/Statement';
import { Deadline } from '../../../src/model/transaction/Deadline';
import { LockHashAlgorithm } from '../../../src/model/transaction/LockHashAlgorithm';
import { SecretLockTransaction } from '../../../src/model/transaction/SecretLockTransaction';
import { TransactionInfo } from '../../../src/model/transaction/TransactionInfo';
import { TestingAccount } from '../../conf/conf.spec';

describe('SecretLockTransaction', () => {
    let account: Account;
    let statement: Statement;
    const unresolvedAddress = new NamespaceId('address');
    const unresolvedMosaicId = new NamespaceId('mosaic');
    const mosaicId = new MosaicId('0DC67FBE1CAD29E5');
    const generationHash = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6';
    before(() => {
        account = TestingAccount;
        statement = new Statement([],
            [new ResolutionStatement(ResolutionType.Address, BigInt(2), unresolvedAddress,
                [new ResolutionEntry(account.address, new ReceiptSource(1, 0))])],
            [new ResolutionStatement(ResolutionType.Mosaic, BigInt(2), unresolvedMosaicId,
                [new ResolutionEntry(mosaicId, new ReceiptSource(1, 0))])],
        );
    });

    it('should default maxFee field be set to 0', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createAbsolute(10),
            BigInt(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(convert.hexToUint8(proof)).hex(),
            recipientAddress,
            NetworkType.MIJIN_TEST,
        );

        expect(secretLockTransaction.maxFee).to.be.equal(BigInt(0));
    });

    it('should filled maxFee override transaction maxFee', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createAbsolute(10),
            BigInt(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(convert.hexToUint8(proof)).hex(),
            recipientAddress,
            NetworkType.MIJIN_TEST,
            BigInt(1),
        );

        expect(secretLockTransaction.maxFee).to.be.equal(BigInt(1));
    });

    it('should be created with LockHashAlgorithm: Op_Sha3_256 secret', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createAbsolute(10),
            BigInt(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(convert.hexToUint8(proof)).hex(),
            recipientAddress,
            NetworkType.MIJIN_TEST,
        );
        deepEqual(secretLockTransaction.mosaic.id.id, NetworkCurrencyLocal.NAMESPACE_ID.id);
        expect(secretLockTransaction.mosaic.amount === BigInt(10)).to.be.equal(true);
        expect(secretLockTransaction.duration === BigInt(100)).to.be.equal(true);
        expect(secretLockTransaction.hashAlgorithm).to.be.equal(0);
        expect(secretLockTransaction.secret).to.be.equal('9b3155b37159da50aa52d5967c509b410f5a36a3b1e31ecb5ac76675d79b4a5e');
        expect(secretLockTransaction.recipientAddress).to.be.equal(recipientAddress);
    });

    it('should be created and sign SecretLock Transaction', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createAbsolute(10),
            BigInt(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(convert.hexToUint8(proof)).hex(),
            recipientAddress,
            NetworkType.MIJIN_TEST,
        );
        const signedTx = secretLockTransaction.signWith(account, generationHash);
        expect(signedTx.payload.substring(
            256,
            signedTx.payload.length,
        )).to.be.equal(
            '9B3155B37159DA50AA52D5967C509B410F5A36A3B1E31ECB5AC76675D79B4A5E44B262C46CEABB850A' +
            '0000000000000064000000000000000090C2337113E6D8F15B56E0821149299F340C01706FC1CAD6CB');
    });

    it('should throw exception when the input is not related to HashTyp: Op_Sha3_256', () => {
        expect(() => {
            const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
            const secretLockTransaction = SecretLockTransaction.create(
                Deadline.create(),
                NetworkCurrencyLocal.createAbsolute(10),
                BigInt(100),
                LockHashAlgorithm.Op_Sha3_256,
                'non valid hash',
                recipientAddress,
                NetworkType.MIJIN_TEST,
            );
        }).to.throw(Error);
    });


    it('should be created with LockHashAlgorithm: Op_Hash_160 secret', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9';
        const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createAbsolute(10),
            BigInt(100),
            LockHashAlgorithm.Op_Hash_160,
            CryptoJS.RIPEMD160(CryptoJS.SHA256(proof).toString(CryptoJS.enc.Hex)).toString(CryptoJS.enc.Hex),
            recipientAddress,
            NetworkType.MIJIN_TEST,
        );
        deepEqual(secretLockTransaction.mosaic.id.id, NetworkCurrencyLocal.NAMESPACE_ID.id);
        expect(secretLockTransaction.mosaic.amount === BigInt(10)).to.be.equal(true);
        expect(secretLockTransaction.duration === BigInt(100)).to.be.equal(true);
        expect(secretLockTransaction.hashAlgorithm).to.be.equal(LockHashAlgorithm.Op_Hash_160);
        expect(secretLockTransaction.secret).to.be.equal('3fc43d717d824302e3821de8129ea2f7786912e5');
        expect(secretLockTransaction.recipientAddress).to.be.equal(recipientAddress);
    });

    it('should throw exception when the input is not related to HashTyp: Op_Hash_160', () => {
        expect(() => {
            const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
            const secretLockTransaction = SecretLockTransaction.create(
                Deadline.create(),
                NetworkCurrencyLocal.createAbsolute(10),
                BigInt(100),
                LockHashAlgorithm.Op_Hash_160,
                'non valid hash',
                recipientAddress,
                NetworkType.MIJIN_TEST,
            );
        }).to.throw(Error);
    });
    it('should be created with LockHashAlgorithm: Op_Hash_256 secret', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createAbsolute(10),
            BigInt(100),
            LockHashAlgorithm.Op_Hash_256,
            CryptoJS.SHA256(CryptoJS.SHA256(proof).toString(CryptoJS.enc.Hex)).toString(CryptoJS.enc.Hex),
            recipientAddress,
            NetworkType.MIJIN_TEST,
        );
        deepEqual(secretLockTransaction.mosaic.id.id, NetworkCurrencyLocal.NAMESPACE_ID.id);
        expect(secretLockTransaction.mosaic.amount === BigInt(10)).to.be.equal(true);
        expect(secretLockTransaction.duration === BigInt(100)).to.be.equal(true);
        expect(secretLockTransaction.hashAlgorithm).to.be.equal(LockHashAlgorithm.Op_Hash_256);
        expect(secretLockTransaction.secret).to.be.equal('c346f5ecf5bcfa54ab14fad815c8239bdeb051df8835d212dba2af59f688a00e');
        expect(secretLockTransaction.recipientAddress).to.be.equal(recipientAddress);
    });

    it('should throw exception when the input is not related to HashTyp: Op_Hash_256', () => {
        expect(() => {
            const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
            const secretLockTransaction = SecretLockTransaction.create(
                Deadline.create(),
                NetworkCurrencyLocal.createAbsolute(10),
                BigInt(100),
                LockHashAlgorithm.Op_Hash_256,
                'non valid hash',
                recipientAddress,
                NetworkType.MIJIN_TEST,
            );
        }).to.throw(Error);
    });

    describe('size', () => {
        it('should return 210 for SecretLockTransaction with proof of 32 bytes', () => {
            const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
            const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
            const secretLockTransaction = SecretLockTransaction.create(
                Deadline.create(),
                NetworkCurrencyLocal.createAbsolute(10),
                BigInt(100),
                LockHashAlgorithm.Op_Hash_256,
                CryptoJS.SHA256(CryptoJS.SHA256(proof).toString(CryptoJS.enc.Hex)).toString(CryptoJS.enc.Hex),
                recipientAddress,
                NetworkType.MIJIN_TEST,
            );
            expect(secretLockTransaction.size).to.be.equal(210);
            expect(Convert.hexToUint8(secretLockTransaction.serialize()).length).to.be.equal(secretLockTransaction.size);
        });
    });

    it('should be created with alias address', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = new NamespaceId('test');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createAbsolute(10),
            BigInt(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(convert.hexToUint8(proof)).hex(),
            recipientAddress,
            NetworkType.MIJIN_TEST,
        );
        deepEqual(secretLockTransaction.mosaic.id.id, NetworkCurrencyLocal.NAMESPACE_ID.id);
        expect(secretLockTransaction.mosaic.amount === BigInt(10)).to.be.equal(true);
        expect(secretLockTransaction.duration === BigInt(100)).to.be.equal(true);
        expect(secretLockTransaction.hashAlgorithm).to.be.equal(0);
        expect(secretLockTransaction.secret).to.be.equal('9b3155b37159da50aa52d5967c509b410f5a36a3b1e31ecb5ac76675d79b4a5e');
        expect(secretLockTransaction.recipientAddress).to.be.equal(recipientAddress);
    });

    it('Test set maxFee using multiplier', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const recipientAddress = Address.createFromRawAddress('SDBDG4IT43MPCW2W4CBBCSJJT42AYALQN7A4VVWL');
        const secretLockTransaction = SecretLockTransaction.create(
            Deadline.create(),
            NetworkCurrencyLocal.createAbsolute(10),
            BigInt(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(convert.hexToUint8(proof)).hex(),
            recipientAddress,
            NetworkType.MIJIN_TEST,
        ).setMaxFee(2);
​
        expect(secretLockTransaction.maxFee).to.be.equal(BigInt(420));
        const signedTransaction = secretLockTransaction.signWith(account, generationHash);
        expect(signedTransaction.hash).not.to.be.undefined;
    });

    it('Test resolveAlias can resolve', () => {
        const proof = 'B778A39A3663719DFC5E48C9D78431B1E45C2AF9DF538782BF199C189DABEAC7';
        const secretLockTransaction = new SecretLockTransaction(
            NetworkType.MIJIN_TEST,
            1,
            Deadline.createFromDTO('1'),
            BigInt(0),
            new Mosaic(unresolvedMosaicId, BigInt(1)),
            BigInt(100),
            LockHashAlgorithm.Op_Sha3_256,
            sha3_256.create().update(convert.hexToUint8(proof)).hex(),
            unresolvedAddress,
            '',
            account.publicAccount,
            new TransactionInfo(BigInt(2), 0, '')).resolveAliases(statement);
​
        expect(secretLockTransaction.recipientAddress instanceof Address).to.be.true;
        expect(secretLockTransaction.mosaic.id instanceof MosaicId).to.be.true;
        expect((secretLockTransaction.recipientAddress as Address).equals(account.address)).to.be.true;
        expect((secretLockTransaction.mosaic.id as MosaicId).equals(mosaicId)).to.be.true;

        const signedTransaction = secretLockTransaction.signWith(account, generationHash);
        expect(signedTransaction.hash).not.to.be.undefined;
    });
});
