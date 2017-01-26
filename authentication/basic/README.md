Basic authentication against embedded engine example
======================================================
This example demonstrates how to perform following steps:

* configure embedded engine to run in spring-boot application 
* configure REST API to run in spring-boot application 
* configure basic authentication on REST API in spring-boot
* perform a request towards API protected with Basic Authentication

## Why is this example interesting?

This example illustrates how to start spring boot application with embedded engine and REST API
available as well as basic authentication filter.

## Show me the important parts!

Add basic spring `applicationContext.xml` with your engine configuration.

```xml
  <bean id="processEngineConfiguration"
    class="org.camunda.bpm.engine.spring.SpringProcessEngineConfiguration">
    <property name="processEngineName" value="default" />
    <property name="dataSource" ref="dataSource" />
    <property name="transactionManager" ref="transactionManager" />
    <property name="databaseSchemaUpdate" value="true" />
    <property name="jobExecutorActivate" value="false" />
    <property name="deploymentResources" value="classpath*:*.bpmn" />
    <property name="metricsEnabled" value="false"/>
  </bean>

  <bean id="processEngine" class="org.camunda.bpm.engine.spring.ProcessEngineFactoryBean">
    <property name="processEngineConfiguration" ref="processEngineConfiguration" />
  </bean>

  <bean id="repositoryService" factory-bean="processEngine"
    factory-method="getRepositoryService" />
  <bean id="runtimeService" factory-bean="processEngine"
    factory-method="getRuntimeService" />
  <bean id="taskService" factory-bean="processEngine"
    factory-method="getTaskService" />
  <bean id="historyService" factory-bean="processEngine"
    factory-method="getHistoryService" />
  <bean id="managementService" factory-bean="processEngine"
    factory-method="getManagementService" />
  <bean id="identityService" factory-bean="processEngine"
        factory-method="getIdentityService" />
```

A custom JAX-RS Application class deploys the REST Endpoints:

```java
public class RestProcessEngineDeployment extends Application {

  @Override
  public Set<Class<?>> getClasses() {
    Set<Class<?>> classes = new HashSet<Class<?>>();

    classes.addAll(CamundaRestResources.getResourceClasses());
    classes.addAll(CamundaRestResources.getConfigurationClasses());

    return classes;
  }

}
```

Implement the REST Process Engine Provider SPI (provides the process engine to the REST application):

```java
public class RestProcessEngineProvider implements ProcessEngineProvider {

  public ProcessEngine getDefaultProcessEngine() {
    return ProcessEngines.getDefaultProcessEngine();
  }

  public ProcessEngine getProcessEngine(String name) {
    return ProcessEngines.getProcessEngine(name);
  }

  public Set<String> getProcessEngineNames() {
    return ProcessEngines.getProcessEngines().keySet();
  }

}
```

Add a file named:

    `src/main/resources/META-INF/services/org.camunda.bpm.engine.rest.spi.ProcessEngineProvider`
which contains the name of the provider:

    `org.camunda.bpm.example.authentication.rest.RestProcessEngineProvider`
    
Add maven dependencies: 
```xml
<!-- spring boot -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency>

<dependency>
    <groupId>org.camunda.bpm</groupId>
    <artifactId>camunda-engine</artifactId>
</dependency>

<dependency>
    <groupId>org.camunda.bpm</groupId>
    <artifactId>camunda-engine-spring</artifactId>
</dependency>

<dependency>
    <groupId>org.camunda.bpm</groupId>
    <artifactId>camunda-engine-rest</artifactId>
    <classifier>classes</classifier>
</dependency>

<dependency>
    <groupId>org.jboss.resteasy</groupId>
    <artifactId>resteasy-jaxrs</artifactId>
    <version>3.0.8.Final</version>
</dependency>

<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <version>1.3.171</version>
</dependency>

<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>3.1.0</version>
    <scope>provided</scope>
</dependency>

<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-web</artifactId>
    <version>${spring.version}</version>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-tomcat</artifactId>
</dependency>
```

Configure your spring boot application to instantiate all required filters and import engine 
beans from separate xml based context file.

```java
@SpringBootApplication
@Configuration
@ImportResource("classpath*:applicationContext.xml")
public class CamundaSpringBootExampleApplication extends SpringBootServletInitializer {
	private static final String EMAIL = "demo@camunda.org";

	@Autowired
	private IdentityService identityService;

	@PostConstruct
	public void initDemoUser() {
		User newUser = identityService.newUser("demo");
		newUser.setPassword("demo");
		newUser.setEmail(EMAIL);
		identityService.saveUser(newUser);
	}

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
		return configureApplication(builder);
	}

	public static void main(String[] args) {
		configureApplication(new SpringApplicationBuilder()).run(args);
	}

	private static SpringApplicationBuilder configureApplication(SpringApplicationBuilder builder) {
		return builder.sources(CamundaSpringBootExampleApplication.class).bannerMode(Banner.Mode.OFF);
	}

	@Bean
	public FilterRegistrationBean authenticationFilter() {
		FilterRegistrationBean registration = new FilterRegistrationBean();
		Filter myFilter = new ProcessEngineAuthenticationFilter();
		registration.setFilter(myFilter);
		registration.addUrlPatterns("/*");
		registration.addInitParameter("authentication-provider","org.camunda.bpm.engine.rest.security.auth.impl.HttpBasicAuthenticationProvider");
		registration.setName("camunda-auth");
		registration.setOrder(1);
		return registration;
	}

	@Bean
	public FilterRegistrationBean restEasyFilter() {
		FilterRegistrationBean registration = new FilterRegistrationBean();
		Filter myFilter = new FilterDispatcher();
		registration.setFilter(myFilter);
		registration.addUrlPatterns("/*");
		registration.addInitParameter("javax.ws.rs.Application","org.camunda.bpm.example.authentication.rest.RestProcessEngineDeployment");
		registration.setName("Resteasy");
		registration.setOrder(10);
		return registration;
	}
	
}
```
    
## How to use it?

You can either build it with maven and see that tests are executed successfully, or you
can run `CamundaSpringBootExampleApplication` class as a Java application, and try to open
following url in your browser [http://localhost:8080/engine/default/user][1]. Which will request
username and password from you. If you use `demo\demo` as your authentication data, you should
see information of demo user in JSON format printed to your screen. 

[1]:http://localhost:8080/engine/default/user