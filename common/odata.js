/* Refer the link below to learn more about the use cases of script.
https://help.sap.com/viewer/368c481cd6954bdfa5d0435479fd4eaf/Cloud/en-US/148851bf8192412cba1f9d2c17f4bd25.html

If you want to know more about the SCRIPT APIs, refer the link below
https://help.sap.com/doc/a56f52e1a58e4e2bac7f7adbf45b2e26/Cloud/en-US/index.html */
importClass(com.sap.gateway.ip.core.customdev.util.Message);
importClass(java.util.HashMap);

function processData(message) {
    //Body
    var body = message.getBody(java.lang.String);

    //Headers
    var headers = message.getHeaders();
    var reqHttpUrl = headers.get("CamelHttpUrl");
    var reqHttpMethod = headers.get("CamelHttpMethod");
    var reqHttpPath = headers.get("CamelHttpPath");

    //Properties
    var properties = message.getProperties();
    
    var username = properties.get("username");
    var password = properties.get("password");
    // 设置 OData 服务的 URL
    var odataUrl = properties.get("url");
    var odataName = properties.get("odata");
    
    const messageLog= messageLogFactory.getMessageLog(message);
    if (messageLog != null) {
        messageLog.setStringProperty("JS Logger", "Logger");
        messageLog.addAttachmentAsString("JavaScript Message Body", reqHttpPath + '\n' + reqHttpMethod + ': ' + reqHttpUrl + '\n' + odataUrl + '\n' +  body, "text/plain");
    }
    
    // 导入 Java 类
    var HttpClient = Packages.org.apache.http.impl.client.HttpClients;
    var StringEntity = Packages.org.apache.http.entity.StringEntity;
    var HttpGet = Packages.org.apache.http.client.methods.HttpGet;
    var HttpPost = Packages.org.apache.http.client.methods.HttpPost;
    var IOUtils = Packages.org.apache.commons.io.IOUtils;
    var Base64 = Packages.java.util.Base64;
    var String = Packages.java.lang.String;
    
    // 创建 HttpClient 实例
    var client = HttpClient.createDefault();
    
     // 设置 Basic Authentication 头
    var authHeader = "Basic " + java.util.Base64.getEncoder().encodeToString(
        new java.lang.String(username + ":" + password).getBytes("utf-8")
    );
    
    var odataServicePath = "/sap/opu/odata/sap/" + odataName + "/"
    
    if (reqHttpMethod == 'GET') {
        var httpGet = new HttpGet(odataUrl + odataServicePath + reqHttpPath );
        httpGet.setHeader("Authorization", authHeader);
        httpGet.setHeader("Accept", "application/json");
        var response = client.execute(httpGet);
        var entity = response.getEntity();
        // 读取响应内容
        if (entity !== null) {
            var inputStream = entity.getContent();
            var responseString = IOUtils.toString(inputStream, "UTF-8");
            inputStream.close();
        
            // 处理或打印响应
            message.setBody(responseString);
            // 设置响应头的 Content-Type 为 application/json
            message.setHeader("Content-Type", "application/json");
            
            messageLog.addAttachmentAsString("Response GET Body", responseString, "text/plain");
        }
    }
    
    if (reqHttpMethod == 'POST' || reqHttpMethod == 'PUT' || reqHttpMethod == 'PATCH') {
        var csrfToken = null
        // Fetch token
        var httpGet = new HttpGet(odataUrl + odataServicePath );
        httpGet.setHeader("Authorization", authHeader);
        // 添加获取 CSRF Token 所需的 Header
        httpGet.setHeader("X-CSRF-Token", "Fetch");
        // 发送 GET 请求以获取 CSRF Token
        var response = client.execute(httpGet);
        var entity = response.getEntity();
        // 从响应头中获取 CSRF Token
        csrfToken = response.getFirstHeader("X-CSRF-Token").getValue();
        // 打印或存储 CSRF Token，用于后续 POST 请求
        message.setProperty("csrfToken", csrfToken);
        
        if (reqHttpMethod == 'POST') {
            // Create Entity
            var httpPost = new HttpPost(odataUrl + odataServicePath + reqHttpPath);
            
            // 设置 Basic Authentication 头
            httpPost.setHeader("Authorization", authHeader);
            if (csrfToken) {
                httpPost.setHeader("X-CSRF-Token", csrfToken);
            }
        
            // Set the request entity (body)
            httpPost.setEntity(new StringEntity(body, "UTF-8"));
            
            // Set headers (for example, Content-Type and Authorization)
            httpPost.setHeader("Content-Type", "application/json");
            httpPost.setHeader("Accept", "application/json");
            
            // 发送请求并获取响应
            var response = client.execute(httpPost);
            var entity = response.getEntity();
            
            // 读取响应内容
            if (entity !== null) {
                var inputStream = entity.getContent();
                var responseString = IOUtils.toString(inputStream, "UTF-8");
                inputStream.close();
            
                // 处理或打印响应
                message.setBody(responseString);
                // 设置响应头的 Content-Type 为 application/json
                message.setHeader("Content-Type", "application/json");
                
                messageLog.addAttachmentAsString("Response POST Body", responseString, "text/plain");
            }
        }
    }
    
    // 关闭 HttpClient
    client.close();

    return message;
}