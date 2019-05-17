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

import {deepEqual} from 'assert';
import {Address} from '../../../src/model/account/Address';
import {AccountPropertiesInfo, PropertyModificationType, PropertyType } from '../../../src/model/model';

describe('AccountPropertiesInfo', () => {

    it('should createComplete an AccountPropertiesInfo object', () => {

        const accountPropertiesInfoDTO = {
            meta: {id: '12345'},
            accountProperties: [{
                address: Address.createFromEncoded('9050B9837EFAB4BBE8A4B9BB32D812F9885C00D8FC1650E142'),
                properties: [{
                    propertyType: PropertyType.AllowAddress,
                    values: [{modificationType: PropertyModificationType.Add,
                              value: 'SDUP5PLHDXKBX3UU5Q52LAY4WYEKGEWC6IB3VBFM',
                             }],
                }],
            }],
        };

        const accountPropertiesInfo = new AccountPropertiesInfo(
            accountPropertiesInfoDTO.meta,
            accountPropertiesInfoDTO.accountProperties,
        );

        deepEqual(accountPropertiesInfo.meta.id, accountPropertiesInfoDTO.meta.id);
        deepEqual(accountPropertiesInfo.accountProperties.length, accountPropertiesInfoDTO.accountProperties.length);
        deepEqual(accountPropertiesInfo.accountProperties[0].address, accountPropertiesInfoDTO.accountProperties[0].address);
        deepEqual(accountPropertiesInfo.accountProperties[0].properties.length,
            accountPropertiesInfoDTO.accountProperties[0].properties.length);
        deepEqual(accountPropertiesInfo.accountProperties[0].properties[0].values[0],
            accountPropertiesInfoDTO.accountProperties[0].properties[0].values[0]);
    });
});
