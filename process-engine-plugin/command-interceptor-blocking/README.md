# Blocking Command Interceptor Plugin

Sometimes you want the process engine to reject all (or some) API calls. The reason for this could be that
you want to process engine to go into a "maintenance" mode so that you can do housekeeping or things like that.

Each API call to the process engine is a `Command`. Commands are executed inside the so called `CommandContex`.
In order to create the `CommandContext`, a chain of `CommandInterceptor`s is used.

This example demonstrates how to create a custom `CommandInterceptor` which can be configured to throw an exception.

## Start Blocking commands

In order to start blocking commands, you need to execute the StartBlockingCmd.

```java 
((ProcessEngineConfigurationImpl)processEngine.getProcessEngineConfiguration()).getCommandExecutorTxRequired()
  .execute(new StartBlockingCmd());
```

After executing this, any further API calls will throw an exception:

processEngine.getTaskService().createTaskQuery().list(); // << This will throw an exception

## End Blocking commands

In order to end blocking commands, you need to execute the EndBlockingCmd.

```java 
((ProcessEngineConfigurationImpl)processEngine.getProcessEngineConfiguration()).getCommandExecutorTxRequired()
  .execute(new EndBlockingCmd());
```

After executing this, all subsequent API calls will work again.

## How to use it?

1. Checkout the project with Git
2. Import the project into your IDE
3. Inspect the sources and run the unit test.

