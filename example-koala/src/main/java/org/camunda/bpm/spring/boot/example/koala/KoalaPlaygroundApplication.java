package org.camunda.bpm.spring.boot.example.koala;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.spring.boot.starter.annotation.EnableProcessApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableProcessApplication
public class KoalaPlaygroundApplication {

    /**
     * @Autowired dependency notwendig, da es ansonsten beim Start zu einem Circular dependency Problem kommt:
     * <p>
     * ***************************
     * APPLICATION FAILED TO START
     * **************************
     * <p>
     * Description:
     * <p>
     * There is a circular dependency between 5 beans in the application context:
     * - dataSource defined in class path resource [org/springframework/boot/autoconfigure/jdbc/DataSourceConfiguration$Dbcp.class]
     * - processEngineFactoryBean defined in class path resource [org/camunda/bpm/spring/boot/starter/CamundaBpmAutoConfiguration.class]
     * - processEngineConfigurationImpl defined in class path resource [org/camunda/bpm/spring/boot/starter/CamundaBpmConfiguration.class]
     * - camundaDatasourceConfiguration (field protected org.springframework.transaction.PlatformTransactionManager org.camunda.bpm.spring.boot.starter.configuration.impl.DefaultDatasourceConfiguration.transactionManager)
     * - org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration$DataSourceTransactionManagerConfiguration
     * - dataSource
     */
    // @Autowired
    RuntimeService runtimeService;

    public static void main(final String... args) throws Exception {
        SpringApplication.run(KoalaPlaygroundApplication.class, args);
    }

}
