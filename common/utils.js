/* Refer the link below to learn more about the use cases of script.
https://help.sap.com/viewer/368c481cd6954bdfa5d0435479fd4eaf/Cloud/en-US/148851bf8192412cba1f9d2c17f4bd25.html

If you want to know more about the SCRIPT APIs, refer the link below
https://help.sap.com/doc/a56f52e1a58e4e2bac7f7adbf45b2e26/Cloud/en-US/index.html */
importClass(com.sap.gateway.ip.core.customdev.util.Message);
importClass(java.util.HashMap);

function restoreNestedBody(message) {
    var body = JSON.parse(message.getBody(java.lang.String));
    
    body = restoreNestedObject(body)
    
    // 将处理后的 JSON 对象转换回字符串并写回消息体
    message.setBody(JSON.stringify(body));

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

  // 遍历每个键值对
  for (let key in flatObj) {
    if (Array.isArray(flatObj[key])) {
      // 对于数组，保留数组结构并递归处理数组中的每个对象
      nestedObj[key] = flatObj[key].map((item) => {
        if (typeof item === "object" && !Array.isArray(item)) {
          return restoreNestedObject(item); // 递归还原数组中的对象
        }
        return item; // 对于非对象的项，直接返回
      });
    } else if (
      typeof flatObj[key] === "object" &&
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
