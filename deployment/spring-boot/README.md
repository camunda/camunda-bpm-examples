# Camunda Process Engine and Spring Boot

This example demonstrates how to bootstrap the Camunda process engine with [Spring Boot](http://projects.spring.io/spring-boot/). You learn

* How to create a POM with the required dependencies,
* How to configure the process engine via Java Config,
* How to create the application class and start a process instance on startup

The example process looks like:

![Example Process](docs/loanRequest.png)


## How to use it?

1. Checkout the project with Git
2. Import the project into your IDE
3. Build it with Maven `clean install`
4. Execute the JAR `java -jar target/camunda-spring-boot-example-1.0.0-SNAPSHOT.jar`
5. Check the console if you can find the line `calculating interest`

### Run it as JUnit Test  

The JUnit test [CamundaSpringBootExampleApplicationTest](src/test/java/org/camunda/bpm/example/CamundaSpringBootExampleApplicationTest.java) starts the application and verify that it starts a process instance.

## How it works

Follow steps to create a basic setup for your Spring Boot application which embeds the Camunda process engine.

Note that you can generate your project skeleton using the [Spring Initializr](https://start.spring.io/).

### Add required dependencies to POM

Create a basic `pom.xml` for your project and add the following dependencies for the process engine and Spring Boot.

```xml
<dependencies>

  <!-- spring boot -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jdbc</artifactId>
  </dependency>
  
  <!-- camunda -->
  <dependency>
    <groupId>org.camunda.bpm</groupId>
    <artifactId>camunda-engine-spring</artifactId>
  </dependency>
  
  <!-- database (e.g. h2) -->
  <dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
  </dependency>
  
  <!-- test (e.g. spring-test, junit, mockito etc.) -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
  </dependency>

</dependencies>
```

Also add the following Spring Boot plugin to build the JAR.

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
    </plugin>
  </plugins>
</build>
```

### Configure the Process Engine

Create the following Java Config class to bootstrap and configure the process engine.

```java
@Configuration
@Import( SpringProcessEngineServicesConfiguration.class )
public class CamundaProcessEngineConfiguration {

  @Value("${camunda.bpm.history-level:none}")
  private String historyLevel;

  // add more configuration here
  // ---------------------------

  // configure data source via application.properties
  @Autowired
  private DataSource dataSource;

  @Autowired
  private ResourcePatternResolver resourceLoader;

  @Bean
  public SpringProcessEngineConfiguration processEngineConfiguration() throws IOException {
    SpringProcessEngineConfiguration config = new SpringProcessEngineConfiguration();

    config.setDataSource(dataSource);
    config.setDatabaseSchemaUpdate("true");

    config.setTransactionManager(transactionManager());

    config.setHistory(historyLevel);

    config.setJobExecutorActivate(true);
    config.setMetricsEnabled(false);

    // deploy all processes from folder 'processes'
    Resource[] resources = resourceLoader.getResources("classpath:/processes/*.bpmn");
    config.setDeploymentResources(resources);

    return config;
  }

  @Bean
  public PlatformTransactionManager transactionManager() {
    return new DataSourceTransactionManager(dataSource);
  }

  @Bean
  public ProcessEngineFactoryBean processEngine() throws IOException {
    ProcessEngineFactoryBean factoryBean = new ProcessEngineFactoryBean();
    factoryBean.setProcessEngineConfiguration(processEngineConfiguration());
    return factoryBean;
  }

}
```

In this configuration the data source and the history level of the process engine are configured by the `application.properties`. Add the following lines to use an In-Memory H2 database and `audit` history level.

```properties
# data source config
spring.datasource.url=jdbc:h2:mem:camunda
spring.datasource.username=sa
spring.datasource.password=sa
spring.datasource.driverClassName=org.h2.Driver
# logging config
logging.level.org.camunda.bpm.example=DEBUG
logging.level.org.camunda.bpm=INFO
logging.level.org.springframework=INFO
# camunda config
camunda.bpm.history-level=audit
```

Note that you can add even more configuration (e.g. for logging).

### Create an Application Class

Create an application class which is annotated with `SpringBootApplication` and implement the main method as follow:

```java
@SpringBootApplication
public class CamundaSpringBootExampleApplication {

  @Autowired
  private RuntimeService runtimeService;

  public static void main(String[] args) {
    SpringApplication.run(CamundaSpringBootExampleApplication.class, args);
  }

  @PostConstruct
  public void startProcess() {
    runtimeService.startProcessInstanceByKey("loanRequest");
  }

}
```

On startup, the application loads the configuration and initialize all beans. After initialization, it creates an instance of the process with id 'loanRequest'.

