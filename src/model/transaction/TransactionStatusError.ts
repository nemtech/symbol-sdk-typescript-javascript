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

import {Deadline} from './Deadline';
import {Address} from "../account/Address";

/**
 * Transaction status error model returned by listeners
 */
export class TransactionStatusError {

    /**
     * @internal
     * @param address
     * @param hash
     * @param status
     * @param deadline
     */
    constructor(
                /**
                 *  The address of the account that signed the invalid transaction.
                 *  It's the address listened when calling Lister.status.
                 */
                public readonly address: Address,
                /**
                 * The transaction hash.
                 */
                public readonly hash: string,
                /**
                 * The status error message.
                 */
                public readonly status: string,
                /**
                 * The transaction deadline.
                 */
                public readonly deadline: Deadline) {

    }
}
