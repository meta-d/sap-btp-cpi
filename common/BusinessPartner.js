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
