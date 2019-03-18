/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
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

window.camTasklistConf = {
  // // custom libraries and scripts loading and initialization,
  // // see: http://docs.camunda.org/guides/user-guide/#tasklist-customizing-custom-scripts
  customScripts: {
    ngDeps: [],
    // RequireJS configuration for a complete configuration documentation see:
    // http://requirejs.org/docs/api.html#config
    deps: ['loadReact', 'react', 'react-dom'],
    paths: {
      'loadReact': 'scripts/react/loadReact',
      'react': 'scripts/react/react.development',
      'react-dom': 'scripts/react/react-dom.development'
    }
  }
};
