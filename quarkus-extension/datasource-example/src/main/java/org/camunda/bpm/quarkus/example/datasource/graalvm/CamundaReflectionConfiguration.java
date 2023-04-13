package org.camunda.bpm.quarkus.example.datasource.graalvm;

import org.camunda.bpm.engine.exception.NullValueException;
import org.camunda.bpm.engine.impl.el.CommandContextFunctions;
import org.camunda.bpm.engine.impl.el.DateTimeFunctions;
import org.camunda.bpm.engine.impl.persistence.entity.MeterLogEntity;
import org.camunda.bpm.engine.impl.persistence.entity.MeterLogManager;
import org.camunda.bpm.quarkus.engine.extension.QuarkusProcessEngineConfiguration;
import org.camunda.connect.httpclient.impl.HttpConnectorProviderImpl;
import org.camunda.connect.httpclient.soap.impl.SoapHttpConnectorProviderImpl;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection(targets={
    // engine configuration
    QuarkusProcessEngineConfiguration.class,
    CommandContextFunctions.class,
    DateTimeFunctions.class,

    // engine entity
    MeterLogManager.class,
    MeterLogEntity.class,

    // exceptions
    NullValueException.class,

    // Connect (SPI lookup)
    HttpConnectorProviderImpl.class,
    SoapHttpConnectorProviderImpl.class
    })
public class CamundaReflectionConfiguration {

}
