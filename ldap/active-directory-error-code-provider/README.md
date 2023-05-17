# active-directory-error-code-provider plugin

## Example config

```yml
camunda.bpm:
  run:
    ldap:
      enabled: true
      serverUrl: ldap://<ip>
      managerDn: <user>
      managerPassword: <password>
    process-engine-plugins:
      - plugin-class: org.camunda.bpm.plugin.activedirectory.ActiveDirectoryErrorCodeProviderPlugin
        plugin-parameters:
          ldapErrorCode: 49
          activeDirectoryErrorCode: 773
          camundaCustomExceptionCode: 22222
          exceptionType: javax.naming.AuthenticationException
```
