function updateFlag(message) {
  //Headers
  var headers = message.getHeaders();
  let body = message.getBody(java.lang.String);

  if (body) {
    body = JSON.parse(body);

    if (body.UpdateFlag == "1") {
      headers.put("CamelHttpMethod", "PATCH");
    } else if (body.UpdateFlag == "0") {
      headers.put("CamelHttpMethod", "POST");
    }
    delete body["UpdateFlag"];
    message.setBody(JSON.stringify(body));
  }

  return message;
}
