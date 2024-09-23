function forGetItems(message) {
  let body = message.getBody(java.lang.String);
  //Headers
  var headers = message.getHeaders();

  if (isNotEmptyString(body)) {
    body = JSON.parse(body);

    headers.put("CamelHttpPath", "MaterialBOMItem");
    headers.put(
      "CamelHttpQuery",
      `$filter=${encodeURIComponent(`BillOfMaterial eq '${body.BillOfMaterial}' and BillOfMaterialCategory eq '${body.BillOfMaterialCategory}' and BillOfMaterialVariant eq '${body.BillOfMaterialVariant}' and BillOfMaterialVersion eq '${body.BillOfMaterialVersion}' and Material eq '${body.Material}' and Plant eq '${body.Plant}'`)}`
    );
    headers.put("CamelHttpMethod", "GET");
  }

  return message;
}

function forSplitItems(message) {
    let body = message.getBody(java.lang.String);
    //Headers
    var headers = message.getHeaders();
  
    if (isNotEmptyString(body)) {
      body = JSON.parse(body);
      message.setBody(body.d.results.map((item) => JSON.stringify(item)).join('\n'));
    }
  
    return message;
}

function forDeleteItem(message) {
    let body = message.getBody(java.lang.String);
    //Headers
    var headers = message.getHeaders();
  
    if (isNotEmptyString(body)) {
      body = JSON.parse(body);
      
      headers.put("CamelHttpPath", `MaterialBOMItem(BillOfMaterial='${body.BillOfMaterial}',BillOfMaterialCategory='${body.BillOfMaterialCategory}',BillOfMaterialVariant='${body.BillOfMaterialVariant}',BillOfMaterialVersion='${body.BillOfMaterialVersion}',BillOfMaterialItemNodeNumber='${body.BillOfMaterialItemNodeNumber}',HeaderChangeDocument='${body.HeaderChangeDocument}',Material='${body.Material}',Plant='${body.Plant}')`);
      headers.put(
        "CamelHttpQuery", ''
      );
      headers.put("CamelHttpMethod", "DELETE");
    }
  
    return message;
}

function forCreateItem(message) {
    let body = message.getBody(java.lang.String);
    //Headers
    var headers = message.getHeaders();
  
    if (isNotEmptyString(body)) {
      body = JSON.parse(body);

      message.setBody(body.to_BillOfMaterialItem.results.map((item) => JSON.stringify(item)).join('\n'));
      
      headers.put("CamelHttpPath", `MaterialBOMItem`);
      headers.put("CamelHttpQuery", '');
      headers.put("CamelHttpMethod", "POST");
    }
  
    return message;
}

function isNotEmptyString(str) {
  return isString(str) && str.trim().length() > 0;
}

function isString(value) {
  return typeof value == "string" || value instanceof java.lang.String;
}

function isPrimitiveString(value) {
  return typeof value == "string";
}

function isStringObject(value) {
  return value instanceof java.lang.String;
}
