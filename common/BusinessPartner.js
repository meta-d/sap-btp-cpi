function patchSupplierOrCustomer(message) {
  let body = message.getBody(java.lang.String);

  if (body) {
    body = JSON.parse(body);

    if (body.BusinessPartner) {
      if (body.to_Supplier) {
        body.Supplier = body.BusinessPartner;
      }
      if (body.to_Customer) {
        body.Customer = body.BusinessPartner;
      }

      message.setBody(JSON.stringify(body));
    }
  }

  return message;
}

function extractAddressID(message) {
  //Headers
  var headers = message.getHeaders();
  var reqHttpMethod = headers.get("CamelHttpMethod");

  if (reqHttpMethod == 'POST') {
    var body = message.getBody(java.lang.String);
    var jsonBody = JSON.parse(body);

    if (jsonBody.d && jsonBody.d.to_BusinessPartnerAddress &&
      jsonBody.d.to_BusinessPartnerAddress.results &&
      jsonBody.d.to_BusinessPartnerAddress.results[0]
    ) {
      jsonBody.d.AddressID = jsonBody.d.to_BusinessPartnerAddress.results[0].AddressID;
      message.setBody(JSON.stringify(jsonBody));
    }
  }

  return message;
}