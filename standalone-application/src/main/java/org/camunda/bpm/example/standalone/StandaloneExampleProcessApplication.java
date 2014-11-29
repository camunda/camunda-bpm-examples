package org.camunda.bpm.example.standalone;

import org.camunda.bpm.application.ProcessApplication;
import org.camunda.bpm.application.impl.EmbeddedProcessApplication;
import org.camunda.bpm.engine.ProcessEngines;
import org.camunda.bpm.engine.impl.cfg.StandaloneInMemProcessEngineConfiguration;

@ProcessApplication("foo")
public class StandaloneExampleProcessApplication extends EmbeddedProcessApplication{

    public static void main(String... args) {
        new StandaloneInMemProcessEngineConfiguration().buildProcessEngine();

        new StandaloneExampleProcessApplication().deploy();

        System.out.println("deployed:" + ProcessEngines.getDefaultProcessEngine().getRepositoryService().createProcessDefinitionQuery().list());
    }
}
