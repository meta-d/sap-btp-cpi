function refetchDetail(message) {
  //Headers
  var headers = message.getHeaders();

  if (headers.get("CamelHttpResponseCode") == "201") {
    let body = message.getBody(java.lang.String);
    body = JSON.parse(body);
    if (body.d && body.d.PurchasingInfoRecord) {
      headers.put(
        "CamelHttpPath",
        `A_PurchasingInfoRecord('${body.d.PurchasingInfoRecord}')`
      );
      headers.put("CamelHttpMethod", "GET");
      headers.put(
        "CamelHttpQuery",
        "$expand=to_PurgInfoRecdOrgPlantData,to_PurgInfoRecdOrgPlantData/to_PurInfoRecdPrcgCndnValidity,to_PurgInfoRecdOrgPlantData/to_PurInfoRecdPrcgCndnValidity/to_PurInfoRecdPrcgCndn"
      );
    }
  }

  return message;
}
