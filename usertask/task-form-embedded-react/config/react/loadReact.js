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

const react = document.createElement('script');
react.crossOrigin = true;
react.src = 'https://unpkg.com/react@18.2.0/umd/react.development.js'

const reactDom = document.createElement('script');
reactDom.crossOrigin = true;
reactDom.src = 'https://unpkg.com/react-dom@18.2.0/umd/react-dom.development.js'

document.body.append(react);
document.body.append(reactDom);