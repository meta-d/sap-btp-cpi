/* Refer the link below to learn more about the use cases of script.
https://help.sap.com/viewer/368c481cd6954bdfa5d0435479fd4eaf/Cloud/en-US/148851bf8192412cba1f9d2c17f4bd25.html

If you want to know more about the SCRIPT APIs, refer the link below
https://help.sap.com/doc/a56f52e1a58e4e2bac7f7adbf45b2e26/Cloud/en-US/index.html */
importClass(com.sap.gateway.ip.core.customdev.util.Message);
importClass(java.util.HashMap);

function getSalesPriceCondition(message) {
    //Headers
    var headers = message.getHeaders();
    var reqHttpUrl = headers.get("CamelHttpUrl");
    var reqHttpMethod = headers.get("CamelHttpMethod");
    var reqHttpPath = headers.get("CamelHttpPath");
    // Get the query parameters from the request
    var queryString = headers.get("CamelHttpQuery");

    //Properties
    message.setProperty("sales_condition", message.getBody(java.lang.String));

    let body = JSON.parse(message.getBody());

    headers.put("CamelHttpPath", reqHttpPath + `('${body.ConditionRecord}')`);
    headers.put("CamelHttpQuery", "$expand=to_SlsPrcgCndnRecdValidity");
    headers.put("CamelHttpMethod", "GET");

    return message;
}

function patchRecdValidity(message) {
    //Headers
    var headers = message.getHeaders();

    let body = JSON.parse(message.getBody());
    let oldRecdValidity = body.d["to_SlsPrcgCndnRecdValidity"].results[0];
    //Properties
    var properties = message.getProperties();
    body = JSON.parse(properties.get("sales_condition"));

    headers.put("CamelHttpPath", `A_SlsPrcgCndnRecdValidity(ConditionRecord='${body.ConditionRecord}',ConditionValidityEndDate=datetime'${timestampToDatetime(oldRecdValidity.ConditionValidityEndDate)}')`);
    headers.put("CamelHttpMethod", "PATCH");
    message.setBody(JSON.stringify(body["to_SlsPrcgCndnRecdValidity"].results[0]));

    return message;
}

function timestampToDatetime(odataDate) {
    let zone = 8;
    // 正则匹配 "/Date(数字)/" 格式
    var match = odataDate.match(/\/Date\((\d+)([+-]\d+)?\)\//);
    if (match) {
        var timestamp = parseInt(match[1], 10);  // 提取时间戳
        var date = new Date(timestamp + zone * 60 * 60 * 1000);  // 转换为日期对象 e.g. UTC+8

        // 格式化为 yyyy-MM-dd
        var year = date.getUTCFullYear();
        var month = ('0' + (date.getUTCMonth() + 1)).slice(-2);  // 月份从0开始
        var day = ('0' + date.getUTCDate()).slice(-2);

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds;
    }
    return ''
}