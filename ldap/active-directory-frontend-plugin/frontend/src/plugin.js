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

const template = `
<div class="reset-password" style="display: none">
  <div class="alert alert-info">
    <div class="status"><strong>Password change required!</strong></div><br>
    <div class="message">The company's password policy requires a password change. <br><br>Please reset your password here: <a href="https://example.com">Reset Password</a></div>
  </div>
</div>`;

export default {
  id: 'active-directory-change-password',
  pluginPoint: 'login',
  priority: 0,
  errorCallback: error => {
    const signinForm = angular.element("[name='signinForm']");
    const resetPw = angular.element('.reset-password');

    if (
      error.status === 500 &&
      error.data.type === 'LdapAuthenticationException' &&
      error.data.code === 22222
    ) {
      signinForm.hide();
      resetPw.show();
    }
  },
  render: container => {
    container.innerHTML = template;
  }
};