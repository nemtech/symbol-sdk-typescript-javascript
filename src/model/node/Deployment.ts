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
 * The deployment information that helps tracking how the node was created.
 */
export class Deployment {
    /**
     * @param deploymentTool The tool used to create, maintain and deploy the node. Examples: symbol-bootstrap, manual.
     * @param deploymentToolVersion The version of the tool used to create, maintain and deploy the node.
     * @param lastUpdatedDate When was the node upgraded.
     */
    constructor(
        /**
         * deploymentTool The tool used to create, maintain and deploy the node. Examples: symbol-bootstrap, manual.
         */
        public readonly deploymentTool: string,
        /**
         * deploymentToolVersion The version of the tool used to create, maintain and deploy the node.
         */
        public readonly deploymentToolVersion: string,
        /**
         * lastUpdatedDate When was the node last upgraded.
         */
        public readonly lastUpdatedDate: string,
    ) {}
}
