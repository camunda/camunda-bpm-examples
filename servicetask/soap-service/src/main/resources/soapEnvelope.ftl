<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:web="http://www.webserviceX.NET">
  <soap:Header/>
  <soap:Body>
    <web:GetWeather>
      <!--Optional:-->
      <web:CityName>${city}</web:CityName>
      <!--Optional:-->
      <web:CountryName>${country}</web:CountryName>
    </web:GetWeather>
  </soap:Body>
</soap:Envelope>
