/* Refer the link below to learn more about the use cases of script.
https://help.sap.com/viewer/368c481cd6954bdfa5d0435479fd4eaf/Cloud/en-US/148851bf8192412cba1f9d2c17f4bd25.html

If you want to know more about the SCRIPT APIs, refer the link below
https://help.sap.com/doc/a56f52e1a58e4e2bac7f7adbf45b2e26/Cloud/en-US/index.html */
importClass(com.sap.gateway.ip.core.customdev.util.Message);
importClass(java.util.HashMap);

function logMessageBody(message) {
  // Import necessary classes for logging
  var messageLog = messageLogFactory.getMessageLog(message);

  // Check if message log is available
  if (messageLog !== null) {
      // Get the message body as a string
      var body = message.getBody(java.lang.String);

      // Log the body content
      messageLog.setStringProperty("MessageBodyLog", "Logging message body");
      messageLog.addAttachmentAsString("Message Body", body, "text/plain");
  }

  // Return the message after logging
  return message;
}

function restoreNestedBody(message) {
  let body = message.getBody(java.lang.String);
  
  if (isNotEmptyString(body)) {
    body = JSON.parse(body);

    body = restoreNestedObject(body);

    const messageLog= messageLogFactory.getMessageLog(message);
    if (messageLog != null) {
        messageLog.setStringProperty("JS Logger", "Logger");
        messageLog.addAttachmentAsString("JavaScript Message Body", JSON.stringify(body), "text/plain");
    }

    // 将处理后的 JSON 对象转换回字符串并写回消息体
    message.setBody(JSON.stringify(body));
  }

  return message;
}

function dateToTimestamp(message) {
  let body = message.getBody(java.lang.String);
  
  if (isNotEmptyString(body)) {
    body = JSON.parse(body);

    body = convertDatesInJson(body);

    // 将处理后的 JSON 对象转换回字符串并写回消息体
    message.setBody(JSON.stringify(body));
  }

  return message;
}

function omitBodyNavigation(message) {
  var body = message.getBody(java.lang.String);
  
  //Headers
  var headers = message.getHeaders();
  var reqHttpMethod = headers.get("CamelHttpMethod");

  if ((reqHttpMethod == 'PATCH' || reqHttpMethod == 'POST') && body) {
    message.setBody(JSON.stringify(omitNavigation(JSON.parse(body))))
  }
  
  return message;
}

/**
 * - primaryKey:
 * - keys:
 */
function isPatchMethod(message) {
  var body = message.getBody(java.lang.String);
  
  //Headers
  var headers = message.getHeaders();
  var reqHttpMethod = headers.get("CamelHttpMethod");

  //Properties
  var properties = message.getProperties();

  if (reqHttpMethod == 'POST' && body) {
    var key = properties.get("primaryKey");
    body = JSON.parse(body)
    if (body[key]) {
      headers.put("CamelHttpMethod", 'PATCH');
    }
  }
  
  return message;
}

/**
 * - primaryKey:
 * - keys:
 */
function toPatchMethod(message) {
  var body = message.getBody(java.lang.String);
  
  //Headers
  var headers = message.getHeaders();
  var reqHttpMethod = headers.get("CamelHttpMethod");
  var reqHttpPath = headers.get("CamelHttpPath");

  //Properties
  var properties = message.getProperties();

  if ((reqHttpMethod == 'PATCH' || reqHttpMethod == 'POST') && body) {
    var key = properties.get("primaryKey");
    var keys = properties.get("keys");
    body = JSON.parse(body)
    if (!isNotEmptyString(key) || body[key]) {
      if (keys) {
        keys = keys.split(',');
        reqHttpPath = reqHttpPath + `(` + keys.map((key) => {
          key = key.trim();
          return `${key}='${body[key] || ''}'`
        }).join(',') + `)`;

        // Remove keys from body
        keys.forEach((key) => {
          delete body[key];
        })
        message.setBody(JSON.stringify(body));

        // Set new headers
        headers.put("CamelHttpPath", reqHttpPath);
        headers.put("CamelHttpMethod", 'PATCH');
      } else if (isNotEmptyString(key)) {
        reqHttpPath = reqHttpPath + `('${body[key]}')`;

        headers.put("CamelHttpPath", reqHttpPath);
        headers.put("CamelHttpMethod", 'PATCH');
      }
    }
  }
  
  return message;
}

/**
 * 对于外围系统不支持深层次的 JSON 对象，外围系统会将嵌套的 JSON 对象展开成平铺的形式。
 * 此函数将平铺的属性还原为嵌套的对象格式：
 * 
 * // 测试示例
  let flatObject = {
    "Tex__Name": "xxxx",
    "Tex__ID": "nnnnnnn",
    "Account__ID": "333333",
    "Info__Contact__Phone": "123456789",
    "Info__Contact__Email": "test@example.com",
    "Records": [
      { "Record__ID": "001", "Record__Value": "100" },
      { "Record__ID": "002", "Record__Value": "200" }
    ]
  };
  {
    "Tex": {
      "Name": "xxxx",
      "ID": "nnnnnnn"
    },
    "Account": {
      "ID": "333333"
    },
    "Info": {
      "Contact": {
        "Phone": "123456789",
        "Email": "test@example.com"
      }
    },
    "Records": [
      {
        "Record": {
          "ID": "001",
          "Value": "100"
        }
      },
      {
        "Record": {
          "ID": "002",
          "Value": "200"
        }
      }
    ]
  }
 */

function restoreNestedObject(flatObj) {
  const SEPARATOR = "__"; // 定义分隔符为常量

  let nestedObj = {};

  // 遍历每个键值对
  for (let key in flatObj) {
    if (Array.isArray(flatObj[key])) {
      // 对于数组，保留数组结构并递归处理数组中的每个对象
      nestedObj[key] = flatObj[key].map((item) => {
        if (typeof item == "object" && !isStringObject(item) && !Array.isArray(item)) {
          return restoreNestedObject(item); // 递归还原数组中的对象
        }
        return item; // 对于非对象的项，直接返回
      });
    } else if (
      typeof flatObj[key] == "object" &&
      !isStringObject(flatObj[key]) &&
      !Array.isArray(flatObj[key])
    ) {
      // 对于已经是对象的部分，递归调用还原嵌套结构
      nestedObj[key] = restoreNestedObject(flatObj[key]);
    } else if (key.includes(SEPARATOR)) {
      // 使用 "__" 分隔符将键拆分为父子层级
      let keys = key.split(SEPARATOR);
      setNestedProperty(nestedObj, keys, flatObj[key]);
    } else {
      // 对于不包含分隔符的键，直接赋值
      nestedObj[key] = flatObj[key];
    }
  }

  return nestedObj;
}

function setNestedProperty(obj, keys, value) {
  let currentKey = keys.shift();

  // 如果当前 key 是最后一个，则直接赋值
  if (keys.length === 0) {
    obj[currentKey] = value;
  } else {
    // 如果当前 key 对应的对象不存在，则创建空对象
    if (!obj[currentKey]) {
      obj[currentKey] = {};
    }

    // 递归调用，继续处理剩下的键
    setNestedProperty(obj[currentKey], keys, value);
  }
}

function isValidDate(dateStr) {
  // 正则表达式检测日期格式 YYYY-MM-DD
  var dateRegex = /^\d{4}-\d{2}-\d{2}/;
  return dateRegex.test(dateStr);
}

function convertDateStringToTimestamp(dateStr) {
  var date = new Date(dateStr);
  return '/Date(' + date.getTime() + ')/';
}

/**
 * Convert date in format "yyyy-MM-dd" to timestamp in format "/Date(1537804800000)/" for odata
 */
function convertDatesInJson(obj) {
  // 遍历对象的所有属性
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      
      if (isString(value) && isValidDate(value)) {
        // 如果是字符串并且是有效日期格式，转换为 /Date(timestamp)/
        obj[key] = convertDateStringToTimestamp(value);
      } else if (typeof value == 'object' && value != null) {
        // 如果是对象，递归处理
        obj[key] = convertDatesInJson(value);
      }
    }
  }
  return obj;
}

function isNotEmptyString(str) {
  return isString(str) && str.trim().length() > 0;
}

function isString(value) {
  return typeof value == 'string' || value instanceof java.lang.String;
}

function isPrimitiveString(value) {
  return typeof value == 'string';
}

function isStringObject(value) {
  return value instanceof java.lang.String;
}

/**
 * 有的情况外围系统仅支持使用对象方式传递 to_ Navigation 的值， 约定 navigation name 增加 `_n` 后缀并转换为数组。
 */
function processCreateNavigation(message) {
  //Headers
  var headers = message.getHeaders();
  var reqHttpMethod = headers.get("CamelHttpMethod");
  if (reqHttpMethod == 'GET' || !message.getBody(java.lang.String)) {
      return message
  }
  //Body
  var body = JSON.parse(message.getBody(java.lang.String));
  body = restoreNavigation(body);

  // 将处理后的 JSON 对象转换回字符串并写回消息体
  message.setBody(JSON.stringify(body));
      
  return message
}

function restoreNavigation(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key]
      if (key.startsWith('to_')) {
          if (Array.isArray(value)) {
              acc[key] = {
                  results: value.map(restoreNavigation)
              }
          } else if (key.endsWith('_n')) {
              key = key.split('_n')[0]
              acc[key] = {
                  results: [restoreNavigation(value)]
              }
          } else {
              acc[key] = value;
          }
      } else {
          acc[key] = value;
      }
      
      return acc
  }, {})
}

/**
 * 将子表更新记录拆分开来分别 patch 更新
 * 
 * - primaryKey: The primary key of main table
 * - keys: The keys of main table
 * - navigations: `to_BillOfMaterialItem:MaterialBOMItem:BillOfMaterial,BillOfMaterialCategory,BillOfMaterialVariant,BillOfMaterialVersion,BillOfMaterialItemNodeNumber,HeaderChangeDocument,Material,Plant;`
 */
function iteratingPatch(message) {
  //Headers
  var headers = message.getHeaders();
  let body = message.getBody(java.lang.String);
  //Properties
  var properties = message.getProperties();
  var reqHttpMethod = headers.get("CamelHttpMethod");
  if (reqHttpMethod == 'POST' && body) {
    var navigations = properties.get("navigations");
    var primaryKey = properties.get("primaryKey");
    var keys = properties.get("keys");
    var patchHeader = properties.get("patchHeader");
    body = JSON.parse(body);
    
    if (body[primaryKey]) {
      const items = [];
      navigations = navigations.split(';');
      navigations = navigations.map((navigation) => {
        const [name, entitySet, keys] = navigation.split(':')
        return {
          names: name.split('__').map((item) => item.trim()),
          entitySet,
          keys
        }
      })
      navigations.forEach(({names, entitySet, keys}) => {
        let _items = [];
        getSubEntity(body, names, keys.split(','), {}, _items);
        _items.forEach((item) => {
          item.path = entitySet;
          items.push(item);
        })
      })

      // Clear navigations from the body
      navigations.forEach(({names}) => {
        delete body[names[0]];
      })

      if (patchHeader) {
        items.push({
          path: headers.get("CamelHttpPath"),
          primaryKey,
          keys,
          body,
          parameters: formatParameters(body, keys ? keys.split(',') : null, primaryKey)
        })
      }
  
      message.setBody(items.map((item) => JSON.stringify(item)).join('\n'));
      headers.put("CamelHttpMethod", 'PATCH');
    }
  }

  return message
}

/**
 * 递归获取子元素数据和其主键
 * 
 * @param {*} body 
 * @param {*} paths 
 * @param {*} keys 
 * @param {*} parameters
 * @param {*} values 
 */
function getSubEntity(body, paths, keys, parameters, values) {
  let name = paths[0];
  let items = [];
  // 对于配置的路径没有相应的值则直接返回，因为存在同一个接口用于不同的用途，所以以实际值为准
  if (!body[name]) {
    return
  }
  if (Array.isArray(body[name])) {
    items = body[name]
  } else if (Array.isArray(body[name].results)) {
    items = body[name].results
  } else if (body[name]) {
    items = [body[name]]
  }

  for (let j = 0; j < items.length; j++) {
    let item = items[j];

    // Get primary key
    keys.forEach((key) => {
      if (item[key] != undefined) {
        parameters[key] = item[key];
      }
    })

    if (paths.length === 1) {
      values.push({
        keys,
        body: omitObjectAttrs(item),
        parameters: formatParameters(parameters, keys, null)
      })
    } else {
      getSubEntity(item, paths.slice(1), keys, parameters, values)
    }
  }
}

/**
 * Set parameters and body for iterating Patch
 */
function afterIteratingPatch(message) {
  //Headers
  var headers = message.getHeaders();
  //Properties
  var properties = message.getProperties();
  let body = message.getBody(java.lang.String);
  if (body) {
    body = JSON.parse(body);
    headers.put("CamelHttpPath", body.path + body.parameters);
    headers.put("CamelHttpMethod", 'PATCH');

    message.setBody(JSON.stringify(body.body));
  }

  return message
}

function formatParameters(parameters, keys, primaryKey) {
  if (keys) {
    // keys = keys.split(',');
    return `(` + keys.map((key) => {
      key = key.trim();
      let value = timestampToDatetimeParam(parameters[key]);
      return `${key}=${value || `''`}`
    }).join(',') + `)`;
  } else if (primaryKey) {
    return `('${parameters[primaryKey]}')`;
  }
  return '';
}

function omitObjectAttrs(item) {
  // Omit object attributes from JSON object
  let newObject = {}
  for (let key in item) {
     let value = item[key];
     if (value && typeof value == 'object') {
      continue;
    }
    newObject[key] = value;
  }

  return newObject;
}

function omitNavigation(item) {
  // Omit object attributes from JSON object
  let newObject = {}
  for (let key in item) {
     let value = item[key];
     if (key.startsWith('to_')) {
      continue;
    }
    newObject[key] = value;
  }

  return newObject;
}

function saveOriginBody(message) {
  let body = message.getBody(java.lang.String);
  
  if (isNotEmptyString(body)) {
    message.setProperty("OriginBody", body);
  }

  return message;
}

function restoreOriginBody(message) {
  let body = message.getProperties().get("OriginBody")
  
  if (isNotEmptyString(body)) {
    message.setBody(body);
  }

  return message;
}

function timestampToDatetimeParam(odataDate) {
  let zone = 0;
  // 正则匹配 "/Date(数字)/" 格式
  var match = odataDate && odataDate.match(/\/Date\((\d+)([+-]\d+)?\)\//);
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

      return `datetime'${year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds}'`
  }

  return odataDate ? `'${odataDate}'` : null;
}