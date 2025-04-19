import axios from "axios";
import crypto from "crypto-js"
const appKey = "red.gLvsVoksierVz0uF";
const appSecret = "f13a2266d1e2c32a553cb7a42ea63c48";
let cachedAccessToken = null;
let accessTokenExpiresAt = 0; // 记录 access_token 过期时间

// 生成小红书签名
function generateSignature(appKey, nonce, timeStamp, appSecret) {
  const params = {
    appKey,
    nonce,
    timeStamp,
  };
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const stringToSign = sortedParams + appSecret;
  console.log(stringToSign);
  return crypto.SHA256(stringToSign).toString();
}

// 获取小红书access_token
const getAccessToken = async (nonce, timestamp) => {
  if (cachedAccessToken && Date.now() < accessTokenExpiresAt) {
    // 如果 access_token 未过期，则直接返回缓存的 token
    return cachedAccessToken;
  }

  const signature = generateSignature(appKey, nonce, timestamp, appSecret);
  console.log({
    app_key: appKey,
    nonce: nonce,
    timestamp: timestamp,
    signature: signature,
  });
  try {
    const response = await axios.post("https://edith.xiaohongshu.com/api/sns/v1/ext/access/token", {
      app_key: appKey,
      nonce: nonce,
      timestamp: timestamp,
      signature: signature,
    }, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response.data);
    const { access_token, expires_in } = response.data.data;

    // 缓存 access_token 和计算过期时间
    cachedAccessToken = access_token;
    accessTokenExpiresAt = expires_in;

    return cachedAccessToken;
  } catch (error) {
    console.error('请求失败:', error);
    throw error; // 处理错误
  }
};

const nonce = Math.random().toString(36).substring(2);
const timestamp = Date.now();
const accessToken = await getAccessToken(nonce, timestamp);
const signature = generateSignature(appKey, nonce, timestamp, accessToken);
console.log("appKey：", appKey);
console.log("nonce：", nonce);
console.log("timestamp：", timestamp);
console.log("signature：", signature);
