/* Refer the link below to learn more about the use cases of script.
https://help.sap.com/viewer/368c481cd6954bdfa5d0435479fd4eaf/Cloud/en-US/148851bf8192412cba1f9d2c17f4bd25.html

If you want to know more about the SCRIPT APIs, refer the link below
https://help.sap.com/doc/a56f52e1a58e4e2bac7f7adbf45b2e26/Cloud/en-US/index.html */
importClass(com.sap.gateway.ip.core.customdev.util.Message);
importClass(java.util.HashMap);

function processData(message) {
    //Headers
    var headers = message.getHeaders();
    var reqHttpUrl = headers.get("CamelHttpUrl");
    var reqHttpMethod = headers.get("CamelHttpMethod");
    var reqHttpPath = headers.get("CamelHttpPath");
    // Get the query parameters from the request
    var queryString = headers.get("CamelHttpQuery");

    if (reqHttpMethod == 'GET') {
        // Use URLSearchParams to parse the query string
        const params = parseQueryString(queryString);
        var startDate = params.CreationDate

        const messageLog= messageLogFactory.getMessageLog(message);
        if (messageLog != null) {
            messageLog.setStringProperty("JS Logger", "Logger");
            messageLog.addAttachmentAsString("Request Query Params", startDate, "text/plain");
        }
        
        headers.put("CamelHttpQuery", `$filter=${encodeURIComponent(`CreationDate ge datetime'${startDate}'`)}`);
    }

    return message;
}

function parseQueryString(queryString) {
    const params = {};
    const queries = queryString.split('&');
    
    queries.forEach(query => {
        const [key, value] = query.split('=');
        params[key] = value || '';
    });

    return params;
}