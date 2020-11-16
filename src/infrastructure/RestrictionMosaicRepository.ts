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

import { Observable } from 'rxjs/internal/Observable';
import { MerkleStateInfo } from '../model/blockchain';
import { MosaicAddressRestriction } from '../model/restriction/MosaicAddressRestriction';
import { MosaicGlobalRestriction } from '../model/restriction/MosaicGlobalRestriction';
import { Searcher } from './paginationStreamer';
import { RestrictionMosaicSearchCriteria } from './searchCriteria/RestrictionMosaicSearchCriteria';

export interface RestrictionMosaicRepository
    extends Searcher<MosaicAddressRestriction | MosaicGlobalRestriction, RestrictionMosaicSearchCriteria> {
    /**
     * Returns mosaic restrictions by composite hash
     *
     * @param compositeHash the composite hash
     * @return Observable<MosaicAddressRestriction | MosaicGlobalRestriction>
     */
    getMosaicRestrictions(compositeHash: string): Observable<MosaicAddressRestriction | MosaicGlobalRestriction>;

    /**
     * Returns mosaic restrictions by composite hash
     *
     * @param compositeHash the composite hash
     * @return Observable<MosaicAddressRestriction | MosaicGlobalRestriction>
     */
    getMosaicRestrictionsMerkle(compositeHash: string): Observable<MerkleStateInfo>;
}
