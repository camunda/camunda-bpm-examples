import org.camunda.commons.utils.IoUtil

xmlData = IoUtil.fileAsString('org/camunda/bpm/example/xsltexample/example.xml')
execution.setVariable('customers', xmlData)

println 'Input XML:'
println xmlData
