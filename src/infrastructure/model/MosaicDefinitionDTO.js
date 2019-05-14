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
/**
 * Catapult REST API Reference
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: 1.0.12
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */


import ApiClient from '../ApiClient';
import MosaicPropertiesDTO from './MosaicPropertiesDTO';
import UInt64DTO from './UInt64DTO';





/**
* The MosaicDefinitionDTO model module.
* @module model/MosaicDefinitionDTO
* @version 1.0.12
*/
export default class MosaicDefinitionDTO {
    /**
    * Constructs a new <code>MosaicDefinitionDTO</code>.
    * @alias module:model/MosaicDefinitionDTO
    * @class
    * @param mosaicId {module:model/UInt64DTO} 
    * @param supply {module:model/UInt64DTO} 
    * @param height {module:model/UInt64DTO} 
    * @param owner {String} 
    * @param revision {Number} 
    * @param properties {module:model/MosaicPropertiesDTO} 
    * @param levy {Object} 
    */

    constructor(mosaicId, supply, height, owner, revision, properties, levy) {
        

        
        

        this['mosaicId'] = mosaicId;this['supply'] = supply;this['height'] = height;this['owner'] = owner;this['revision'] = revision;this['properties'] = properties;this['levy'] = levy;

        
    }

    /**
    * Constructs a <code>MosaicDefinitionDTO</code> from a plain JavaScript object, optionally creating a new instance.
    * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
    * @param {Object} data The plain JavaScript object bearing properties of interest.
    * @param {module:model/MosaicDefinitionDTO} obj Optional instance to populate.
    * @return {module:model/MosaicDefinitionDTO} The populated <code>MosaicDefinitionDTO</code> instance.
    */
    static constructFromObject(data, obj) {
        if (data) {
            obj = obj || new MosaicDefinitionDTO();

            
            
            

            if (data.hasOwnProperty('mosaicId')) {
                obj['mosaicId'] = UInt64DTO.constructFromObject(data['mosaicId']);
            }
            if (data.hasOwnProperty('supply')) {
                obj['supply'] = UInt64DTO.constructFromObject(data['supply']);
            }
            if (data.hasOwnProperty('height')) {
                obj['height'] = UInt64DTO.constructFromObject(data['height']);
            }
            if (data.hasOwnProperty('owner')) {
                obj['owner'] = ApiClient.convertToType(data['owner'], 'String');
            }
            if (data.hasOwnProperty('revision')) {
                obj['revision'] = ApiClient.convertToType(data['revision'], 'Number');
            }
            if (data.hasOwnProperty('properties')) {
                obj['properties'] = MosaicPropertiesDTO.constructFromObject(data['properties']);
            }
            if (data.hasOwnProperty('levy')) {
                obj['levy'] = ApiClient.convertToType(data['levy'], Object);
            }
        }
        return obj;
    }

    /**
    * @member {module:model/UInt64DTO} mosaicId
    */
    mosaicId = undefined;
    /**
    * @member {module:model/UInt64DTO} supply
    */
    supply = undefined;
    /**
    * @member {module:model/UInt64DTO} height
    */
    height = undefined;
    /**
    * @member {String} owner
    */
    owner = undefined;
    /**
    * @member {Number} revision
    */
    revision = undefined;
    /**
    * @member {module:model/MosaicPropertiesDTO} properties
    */
    properties = undefined;
    /**
    * @member {Object} levy
    */
    levy = undefined;








}

