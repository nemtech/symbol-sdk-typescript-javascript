/*
 * Copyright 2020 NEM
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

import { MultisigAccountGraphInfo } from '../../model/account/MultisigAccountGraphInfo';
import { MultisigAccountInfo } from '../../model/account/MultisigAccountInfo';

/**
 * Hash utilities for SecretLock hashing
 */
export class MultisigGraphUtils {
    public static parseObjectProperties(obj, parse): any {
        for (const k in obj) {
            if (typeof obj[k] === 'object' && obj[k] !== null) {
                this.parseObjectProperties(obj[k], parse);
            } else if (Object.prototype.hasOwnProperty.call(obj, k)) {
                parse(k, obj[k]);
            }
        }
    }
    public static getMultisigChildren(
        multisigAccountGraphInfoMapped: MultisigAccountInfo[][],
    ): Array<{ address: string; children: string[] }> {
        if (multisigAccountGraphInfoMapped && !!multisigAccountGraphInfoMapped.length) {
            const mappedTree: Array<{ address: string; children: string[] }> = [];
            multisigAccountGraphInfoMapped.map((level: MultisigAccountInfo[]) => {
                level.map((entry: MultisigAccountInfo) => {
                    mappedTree.push({
                        address: entry.accountAddress.plain(),
                        children: [],
                    });

                    // find the entry matching with address matching cosignatory address and update his children
                    const updateRecursively = (address, object) => (obj): any => {
                        if (obj.address === address) {
                            obj.children.push(object);
                        } else if (obj.children) {
                            obj.children.forEach(updateRecursively(address, object));
                        }
                    };

                    entry.cosignatoryAddresses.forEach((addressVal) => {
                        mappedTree.forEach(
                            updateRecursively(addressVal['address'], {
                                address: entry.accountAddress.plain(),
                                children: [],
                            }),
                        );
                    });
                });
            });
            return mappedTree;
        }
        return [];
    }
    public static getMultisigGraphArraySorted(multisigEntries: Map<number, MultisigAccountInfo[]>): MultisigAccountInfo[][] {
        return [...multisigEntries.keys()]
            .sort((a, b) => b - a) // Get addresses from top to bottom
            .map((key) => multisigEntries.get(key) || [])
            .filter((x) => x.length > 0);
    }
    public static getMultisigInfoFromMultisigGraphInfo(graphInfo: MultisigAccountGraphInfo): MultisigAccountInfo[][] {
        const { multisigEntries } = graphInfo;
        return [...this.getMultisigGraphArraySorted(multisigEntries)].map((item) => item);
    }
}
