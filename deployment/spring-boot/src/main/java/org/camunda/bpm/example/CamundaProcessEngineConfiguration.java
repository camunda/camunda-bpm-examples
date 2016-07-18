/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.bpm.example;

import java.io.IOException;

import javax.sql.DataSource;

import org.camunda.bpm.engine.spring.ProcessEngineFactoryBean;
import org.camunda.bpm.engine.spring.SpringProcessEngineConfiguration;
import org.camunda.bpm.engine.spring.SpringProcessEngineServicesConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

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
