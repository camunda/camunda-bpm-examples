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

import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import scss from "rollup-plugin-scss";

export default {
  input: "src/plugin.js",
  output: {
    file: "dist/plugin.js"
  },
  plugins: [
    resolve(),
    babel({
      babelHelpers: "runtime",
      skipPreflightCheck: true,
      compact: true
    }),
    commonjs({
      include: "node_modules/**"
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production")
    }),
    scss({
      failOnError: true
    })
  ]
};
