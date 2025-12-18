/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!*****************************************!*\
  !*** ./src/homeInject/xhsSignInject.ts ***!
  \*****************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   XHS_SIGN_MESSAGE_TYPE: () => (/* binding */ XHS_SIGN_MESSAGE_TYPE),
/* harmony export */   XHS_SIGN_SOURCE: () => (/* binding */ XHS_SIGN_SOURCE),
/* harmony export */   getXhsSign: () => (/* binding */ getXhsSign)
/* harmony export */ });
/**
 * 小红书签名注入脚本
 * 此脚本将被注入到主页环境中执行，提供小红书签名功能
 * 依赖真实的浏览器 window 对象
 */
// Base64 字符表
const BASE64_CHARS = [
    'Z',
    'm',
    's',
    'e',
    'r',
    'b',
    'B',
    'o',
    'H',
    'Q',
    't',
    'N',
    'P',
    '+',
    'w',
    'O',
    'c',
    'z',
    'a',
    '/',
    'L',
    'p',
    'n',
    'g',
    'G',
    '8',
    'y',
    'J',
    'q',
    '4',
    '2',
    'K',
    'W',
    'Y',
    'j',
    '0',
    'D',
    'S',
    'f',
    'd',
    'i',
    'k',
    'x',
    '3',
    'V',
    'T',
    '1',
    '6',
    'I',
    'l',
    'U',
    'A',
    'F',
    'M',
    '9',
    '7',
    'h',
    'E',
    'C',
    'v',
    'u',
    'R',
    'X',
    '5',
];
/** 消息来源标识 */
const XHS_SIGN_SOURCE = 'aitoearn-xhs-sign';
/** 签名消息类型 */
const XHS_SIGN_MESSAGE_TYPE = {
    REQUEST: 'XHS_SIGN_REQUEST',
    RESPONSE: 'XHS_SIGN_RESPONSE',
};
/**
 * 将三字节转换为 Base64
 */
function tripletToBase64(e) {
    return (BASE64_CHARS[(e >> 18) & 63] +
        BASE64_CHARS[(e >> 12) & 63] +
        BASE64_CHARS[(e >> 6) & 63] +
        BASE64_CHARS[63 & e]);
}
/**
 * 编码块
 */
function encodeChunk(e, a, r) {
    const d = [];
    for (let f = a; f < r; f += 3) {
        const c = ((e[f] << 16) & 0xff0000) + ((e[f + 1] << 8) & 65280) + (255 & e[f + 2]);
        d.push(tripletToBase64(c));
    }
    return d.join('');
}
/**
 * UTF8 编码
 */
function encodeUtf8(e) {
    const a = encodeURIComponent(e);
    const r = [];
    for (let c = 0; c < a.length; c++) {
        const d = a.charAt(c);
        if (d === '%') {
            const f = parseInt(a.charAt(c + 1) + a.charAt(c + 2), 16);
            r.push(f);
            c += 2;
        }
        else {
            r.push(d.charCodeAt(0));
        }
    }
    return r;
}
/**
 * Base64 编码
 */
function b64Encode(e) {
    let a;
    const r = e.length;
    const d = r % 3;
    const f = [];
    const s = 16383;
    const _ = r - d;
    for (let u = 0; u < _; u += s) {
        f.push(encodeChunk(e, u, u + s > _ ? _ : u + s));
    }
    if (d === 1) {
        a = e[r - 1];
        f.push(BASE64_CHARS[a >> 2] + BASE64_CHARS[(a << 4) & 63] + '==');
    }
    else if (d === 2) {
        a = (e[r - 2] << 8) + e[r - 1];
        f.push(BASE64_CHARS[a >> 10] +
            BASE64_CHARS[(a >> 4) & 63] +
            BASE64_CHARS[(a << 2) & 63] +
            '=');
    }
    return f.join('');
}
/**
 * CRC32 计算函数
 */
const crc32 = (function () {
    const f = new Uint32Array(256);
    for (let c = 0; c < 256; c++) {
        let d = c;
        for (let s = 0; s < 8; s++) {
            d = d & 1 ? 3988292384 ^ (d >>> 1) : d >>> 1;
        }
        f[c] = d;
    }
    return function (e, a = 0) {
        if (!e || e.length === 0) {
            return -1 ^ a;
        }
        let c = -1;
        for (let r = 0; r < e.length; ++r) {
            c = f[(255 & c) ^ e[r]] ^ (c >>> 8);
        }
        return -1 ^ c ^ a;
    };
})();
/**
 * 生成 B3TraceId
 */
function getB3TraceId() {
    const re = 'abcdef0123456789';
    const je = 16;
    let e = '';
    for (let t = 0; t < 16; t++) {
        e += re[Math.floor(Math.random() * je)];
    }
    return e;
}
/**
 * MD5 加密实现
 */
function md5(str) {
    function safeAdd(x, y) {
        const lsw = (x & 0xffff) + (y & 0xffff);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xffff);
    }
    function bitRotateLeft(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    }
    function md5cmn(q, a, b, x, s, t) {
        return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
    }
    function md5ff(a, b, c, d, x, s, t) {
        return md5cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function md5gg(a, b, c, d, x, s, t) {
        return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function md5hh(a, b, c, d, x, s, t) {
        return md5cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5ii(a, b, c, d, x, s, t) {
        return md5cmn(c ^ (b | ~d), a, b, x, s, t);
    }
    function binlMD5(x, len) {
        x[len >> 5] |= 0x80 << len % 32;
        x[(((len + 64) >>> 9) << 4) + 14] = len;
        let a = 1732584193;
        let b = -271733879;
        let c = -1732584194;
        let d = 271733878;
        for (let i = 0; i < x.length; i += 16) {
            const olda = a;
            const oldb = b;
            const oldc = c;
            const oldd = d;
            a = md5ff(a, b, c, d, x[i], 7, -680876936);
            d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
            a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = md5gg(b, c, d, a, x[i], 20, -373897302);
            a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
            a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
            d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = md5hh(d, a, b, c, x[i + 0], 11, -358537222);
            c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
            a = md5ii(a, b, c, d, x[i], 6, -198630844);
            d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
            a = safeAdd(a, olda);
            b = safeAdd(b, oldb);
            c = safeAdd(c, oldc);
            d = safeAdd(d, oldd);
        }
        return [a, b, c, d];
    }
    function binl2hex(binarray) {
        const hexTab = '0123456789abcdef';
        let str = '';
        for (let i = 0; i < binarray.length * 4; i++) {
            str +=
                hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf) +
                    hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xf);
        }
        return str;
    }
    function str2binl(str) {
        const bin = [];
        for (let i = 0; i < str.length * 8; i += 8) {
            bin[i >> 5] |= (str.charCodeAt(i / 8) & 0xff) << i % 32;
        }
        return bin;
    }
    function utf8Encode(string) {
        string = string.replace(/\r\n/g, '\n');
        let utftext = '';
        for (let n = 0; n < string.length; n++) {
            const c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if (c > 127 && c < 2048) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }
    const utf8Str = utf8Encode(str);
    const binl = str2binl(utf8Str);
    return binl2hex(binlMD5(binl, utf8Str.length * 8));
}
/**
 * 获取小红书签名
 * 需要在已加载 web_sign.js 的页面环境中调用
 *
 * @param url API路径
 * @param body 请求体（可选）
 * @param a1 cookie中的a1值
 * @returns 签名结果
 */
function getXhsSign(url, body, a1) {
    try {
        // 设置小红书签名环境变量
        window.xsecplatform = 'Windows';
        window.xsecappid = 'xhs-pc-web';
        // 设置 a1 到 cookie（签名算法需要）
        document.cookie = `a1=${a1}; path=/`;
        // 构建签名数据
        let x1_data = url.substring(url.indexOf('/api'));
        if (body !== null && body !== undefined && body !== '') {
            try {
                const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
                x1_data = x1_data.concat(bodyStr);
            }
            catch (_a) {
                x1_data = x1_data.concat(JSON.stringify(body));
            }
        }
        // 计算 MD5
        const x1 = md5(x1_data);
        // 检查 mnsv2 函数是否存在
        if (typeof window.mnsv2 !== 'function') {
            console.error('[XhsSign] mnsv2 函数不存在，请确保 web_sign.js 已加载');
            return null;
        }
        // 调用小红书签名函数
        const x3 = window.mnsv2(x1_data, x1);
        // 构建 XS 数据
        const XS_Data = {
            x0: '4.2.1',
            x1: 'xhs-pc-web',
            x2: 'Windows',
            x3: x3,
            x4: 'object',
        };
        const XS = 'XYS_'.concat(b64Encode(encodeUtf8(JSON.stringify(XS_Data))));
        // x8 固定值
        const x8 = 'I38rHdgsjopgIvesdVwgIC+oIELmBZ5e3VwXLgFTIxS3bqwErFeexd0ekncAzMFYnqthIhJeSfMDKutRI3KsYorWHPtGrbV0P9WfIi/eWc6eYqtyQApPI37ekmR6QL+5Ii6sdneeSfqYHqwl2qt5B0DBIx+PGDi/sVtkIxdsxuwr4qtiIhuaIE3e3LV0I3VTIC7e0utl2ADmsLveDSKsSPw5IEvsiVtJOqw8BuwfPpdeTFWOIx4TIiu6ZPwrPut5IvlaLbgs3qtxIxes1VwHIkumIkIyejgsY/WTge7eSqte/D7sDcpipedeYrDtIC6eDVw2IENsSqtlnlSuNjVtIvoekqt3cZ7sVo4gIESyIhEJH7GUIxmPOzmoIicXePwFIviR2B5sDz7sxVtdIv6ed77eYjuQIE0e6WbYKqwjIhJs3oes6DveTPtNcU6eDuw5IvYpc/0edVwULnosDVwrI3TaIxmlsqtsaPwyssHbOIveDo5eTVwnIEKsWfAe1cQ3IiNsSpvekBWAIiJeTPtMIhpD8qtt2VtWIxve3Pw1Ik/s1uw5IEAsjutS+qwPzPwUIvukIxcrNeQhOrNeiuwJIxGrIhvsdPtpzlIpc/JsDBY3IicL2utKruwSICdskPtS+SKe1cAsiMmLIiAsx7OsTutycPwqIC0efVtUIi5eTsuPICKs1nJsfPwSIvAs1PwftYpwIkWyIv/exm5s1U0sDz0eSqwoIC+SIvIirVwG';
        // 构建 XS_common 数据
        const xs_common_data = {
            s0: 5,
            s1: '',
            x0: '1',
            x1: '4.1.0',
            x2: 'Windows',
            x3: 'xhs-pc-web',
            x4: '4.68.0',
            x5: a1,
            x6: '',
            x7: '',
            x8: x8,
            x9: crc32(encodeUtf8(''.concat('').concat('').concat(x8))),
            x10: 0,
            x11: 'normal',
        };
        const XS_common = b64Encode(encodeUtf8(JSON.stringify(xs_common_data)));
        const x_b3_traceid = getB3TraceId();
        return {
            'X-s': XS,
            'X-t': new Date().getTime().toString(),
            'X-s-common': XS_common,
            'X-B3-Traceid': x_b3_traceid,
            'X-xray-traceid': md5(x_b3_traceid),
        };
    }
    catch (error) {
        console.error('[XhsSign] 签名失败:', error);
        return null;
    }
}
/**
 * 初始化签名服务
 * 加载 web_sign.js 并设置消息监听
 */
function initXhsSignService() {
    console.log('[XhsSign Inject] 初始化小红书签名服务...');
    // 将签名函数挂载到 window 对象
    window.__xhsSign = getXhsSign;
    // 监听来自 content script 的签名请求
    window.addEventListener('message', (event) => {
        // 只处理来自当前窗口的消息
        if (event.source !== window) {
            return;
        }
        const data = event.data;
        // 检查消息来源和类型
        if ((data === null || data === void 0 ? void 0 : data.source) === XHS_SIGN_SOURCE &&
            (data === null || data === void 0 ? void 0 : data.type) === XHS_SIGN_MESSAGE_TYPE.REQUEST) {
            const { requestId, payload } = data;
            const { url, data: bodyData, a1 } = payload;
            console.log('[XhsSign Inject] 收到签名请求:', url);
            try {
                const signResult = getXhsSign(url, bodyData, a1);
                if (signResult) {
                    // 发送成功响应
                    window.postMessage({
                        source: XHS_SIGN_SOURCE,
                        type: XHS_SIGN_MESSAGE_TYPE.RESPONSE,
                        requestId,
                        result: {
                            success: true,
                            data: signResult,
                        },
                    }, '*');
                    console.log('[XhsSign Inject] 签名成功');
                }
                else {
                    // 发送失败响应
                    window.postMessage({
                        source: XHS_SIGN_SOURCE,
                        type: XHS_SIGN_MESSAGE_TYPE.RESPONSE,
                        requestId,
                        result: {
                            success: false,
                            error: 'mnsv2 函数不存在，签名失败',
                        },
                    }, '*');
                }
            }
            catch (error) {
                // 发送错误响应
                window.postMessage({
                    source: XHS_SIGN_SOURCE,
                    type: XHS_SIGN_MESSAGE_TYPE.RESPONSE,
                    requestId,
                    result: {
                        success: false,
                        error: (error === null || error === void 0 ? void 0 : error.message) || '签名失败',
                    },
                }, '*');
                console.error('[XhsSign Inject] 签名失败:', error);
            }
        }
    });
    console.log('[XhsSign Inject] 小红书签名服务已初始化');
}
// 初始化签名服务
initXhsSignService();


/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGhzX3NpZ25faW5qZWN0LmpzIiwibWFwcGluZ3MiOiI7O1VBQUE7VUFDQTs7Ozs7V0NEQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBOzs7OztXQ1BBOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7Ozs7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsT0FBTztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLGNBQWM7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsT0FBTztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLFNBQVM7QUFDN0I7QUFDQSx3QkFBd0IsT0FBTztBQUMvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsY0FBYztBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixRQUFRO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsY0FBYztBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUJBQXlCO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0Isb0JBQW9CO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLG1CQUFtQjtBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLEtBQUs7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLHFCQUFxQjtBQUN6QyxvQkFBb0IsMEJBQTBCO0FBQzlDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QixxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QixxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQzhEIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY2hyb21lLWV4dGVuc2lvbi10eXBlc2NyaXB0LXN0YXJ0ZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY2hyb21lLWV4dGVuc2lvbi10eXBlc2NyaXB0LXN0YXJ0ZXIvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2Nocm9tZS1leHRlbnNpb24tdHlwZXNjcmlwdC1zdGFydGVyL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vY2hyb21lLWV4dGVuc2lvbi10eXBlc2NyaXB0LXN0YXJ0ZXIvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9jaHJvbWUtZXh0ZW5zaW9uLXR5cGVzY3JpcHQtc3RhcnRlci8uL3NyYy9ob21lSW5qZWN0L3hoc1NpZ25JbmplY3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gVGhlIHJlcXVpcmUgc2NvcGVcbnZhciBfX3dlYnBhY2tfcmVxdWlyZV9fID0ge307XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvKipcbiAqIOWwj+e6ouS5puetvuWQjeazqOWFpeiEmuacrFxuICog5q2k6ISa5pys5bCG6KKr5rOo5YWl5Yiw5Li76aG1546v5aKD5Lit5omn6KGM77yM5o+Q5L6b5bCP57qi5Lmm562+5ZCN5Yqf6IO9XG4gKiDkvp3otZbnnJ/lrp7nmoTmtY/op4jlmaggd2luZG93IOWvueixoVxuICovXG4vLyBCYXNlNjQg5a2X56ym6KGoXG5jb25zdCBCQVNFNjRfQ0hBUlMgPSBbXG4gICAgJ1onLFxuICAgICdtJyxcbiAgICAncycsXG4gICAgJ2UnLFxuICAgICdyJyxcbiAgICAnYicsXG4gICAgJ0InLFxuICAgICdvJyxcbiAgICAnSCcsXG4gICAgJ1EnLFxuICAgICd0JyxcbiAgICAnTicsXG4gICAgJ1AnLFxuICAgICcrJyxcbiAgICAndycsXG4gICAgJ08nLFxuICAgICdjJyxcbiAgICAneicsXG4gICAgJ2EnLFxuICAgICcvJyxcbiAgICAnTCcsXG4gICAgJ3AnLFxuICAgICduJyxcbiAgICAnZycsXG4gICAgJ0cnLFxuICAgICc4JyxcbiAgICAneScsXG4gICAgJ0onLFxuICAgICdxJyxcbiAgICAnNCcsXG4gICAgJzInLFxuICAgICdLJyxcbiAgICAnVycsXG4gICAgJ1knLFxuICAgICdqJyxcbiAgICAnMCcsXG4gICAgJ0QnLFxuICAgICdTJyxcbiAgICAnZicsXG4gICAgJ2QnLFxuICAgICdpJyxcbiAgICAnaycsXG4gICAgJ3gnLFxuICAgICczJyxcbiAgICAnVicsXG4gICAgJ1QnLFxuICAgICcxJyxcbiAgICAnNicsXG4gICAgJ0knLFxuICAgICdsJyxcbiAgICAnVScsXG4gICAgJ0EnLFxuICAgICdGJyxcbiAgICAnTScsXG4gICAgJzknLFxuICAgICc3JyxcbiAgICAnaCcsXG4gICAgJ0UnLFxuICAgICdDJyxcbiAgICAndicsXG4gICAgJ3UnLFxuICAgICdSJyxcbiAgICAnWCcsXG4gICAgJzUnLFxuXTtcbi8qKiDmtojmga/mnaXmupDmoIfor4YgKi9cbmNvbnN0IFhIU19TSUdOX1NPVVJDRSA9ICdhaXRvZWFybi14aHMtc2lnbic7XG4vKiog562+5ZCN5raI5oGv57G75Z6LICovXG5jb25zdCBYSFNfU0lHTl9NRVNTQUdFX1RZUEUgPSB7XG4gICAgUkVRVUVTVDogJ1hIU19TSUdOX1JFUVVFU1QnLFxuICAgIFJFU1BPTlNFOiAnWEhTX1NJR05fUkVTUE9OU0UnLFxufTtcbi8qKlxuICog5bCG5LiJ5a2X6IqC6L2s5o2i5Li6IEJhc2U2NFxuICovXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQoZSkge1xuICAgIHJldHVybiAoQkFTRTY0X0NIQVJTWyhlID4+IDE4KSAmIDYzXSArXG4gICAgICAgIEJBU0U2NF9DSEFSU1soZSA+PiAxMikgJiA2M10gK1xuICAgICAgICBCQVNFNjRfQ0hBUlNbKGUgPj4gNikgJiA2M10gK1xuICAgICAgICBCQVNFNjRfQ0hBUlNbNjMgJiBlXSk7XG59XG4vKipcbiAqIOe8lueggeWdl1xuICovXG5mdW5jdGlvbiBlbmNvZGVDaHVuayhlLCBhLCByKSB7XG4gICAgY29uc3QgZCA9IFtdO1xuICAgIGZvciAobGV0IGYgPSBhOyBmIDwgcjsgZiArPSAzKSB7XG4gICAgICAgIGNvbnN0IGMgPSAoKGVbZl0gPDwgMTYpICYgMHhmZjAwMDApICsgKChlW2YgKyAxXSA8PCA4KSAmIDY1MjgwKSArICgyNTUgJiBlW2YgKyAyXSk7XG4gICAgICAgIGQucHVzaCh0cmlwbGV0VG9CYXNlNjQoYykpO1xuICAgIH1cbiAgICByZXR1cm4gZC5qb2luKCcnKTtcbn1cbi8qKlxuICogVVRGOCDnvJbnoIFcbiAqL1xuZnVuY3Rpb24gZW5jb2RlVXRmOChlKSB7XG4gICAgY29uc3QgYSA9IGVuY29kZVVSSUNvbXBvbmVudChlKTtcbiAgICBjb25zdCByID0gW107XG4gICAgZm9yIChsZXQgYyA9IDA7IGMgPCBhLmxlbmd0aDsgYysrKSB7XG4gICAgICAgIGNvbnN0IGQgPSBhLmNoYXJBdChjKTtcbiAgICAgICAgaWYgKGQgPT09ICclJykge1xuICAgICAgICAgICAgY29uc3QgZiA9IHBhcnNlSW50KGEuY2hhckF0KGMgKyAxKSArIGEuY2hhckF0KGMgKyAyKSwgMTYpO1xuICAgICAgICAgICAgci5wdXNoKGYpO1xuICAgICAgICAgICAgYyArPSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgci5wdXNoKGQuY2hhckNvZGVBdCgwKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHI7XG59XG4vKipcbiAqIEJhc2U2NCDnvJbnoIFcbiAqL1xuZnVuY3Rpb24gYjY0RW5jb2RlKGUpIHtcbiAgICBsZXQgYTtcbiAgICBjb25zdCByID0gZS5sZW5ndGg7XG4gICAgY29uc3QgZCA9IHIgJSAzO1xuICAgIGNvbnN0IGYgPSBbXTtcbiAgICBjb25zdCBzID0gMTYzODM7XG4gICAgY29uc3QgXyA9IHIgLSBkO1xuICAgIGZvciAobGV0IHUgPSAwOyB1IDwgXzsgdSArPSBzKSB7XG4gICAgICAgIGYucHVzaChlbmNvZGVDaHVuayhlLCB1LCB1ICsgcyA+IF8gPyBfIDogdSArIHMpKTtcbiAgICB9XG4gICAgaWYgKGQgPT09IDEpIHtcbiAgICAgICAgYSA9IGVbciAtIDFdO1xuICAgICAgICBmLnB1c2goQkFTRTY0X0NIQVJTW2EgPj4gMl0gKyBCQVNFNjRfQ0hBUlNbKGEgPDwgNCkgJiA2M10gKyAnPT0nKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZCA9PT0gMikge1xuICAgICAgICBhID0gKGVbciAtIDJdIDw8IDgpICsgZVtyIC0gMV07XG4gICAgICAgIGYucHVzaChCQVNFNjRfQ0hBUlNbYSA+PiAxMF0gK1xuICAgICAgICAgICAgQkFTRTY0X0NIQVJTWyhhID4+IDQpICYgNjNdICtcbiAgICAgICAgICAgIEJBU0U2NF9DSEFSU1soYSA8PCAyKSAmIDYzXSArXG4gICAgICAgICAgICAnPScpO1xuICAgIH1cbiAgICByZXR1cm4gZi5qb2luKCcnKTtcbn1cbi8qKlxuICogQ1JDMzIg6K6h566X5Ye95pWwXG4gKi9cbmNvbnN0IGNyYzMyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBmID0gbmV3IFVpbnQzMkFycmF5KDI1Nik7XG4gICAgZm9yIChsZXQgYyA9IDA7IGMgPCAyNTY7IGMrKykge1xuICAgICAgICBsZXQgZCA9IGM7XG4gICAgICAgIGZvciAobGV0IHMgPSAwOyBzIDwgODsgcysrKSB7XG4gICAgICAgICAgICBkID0gZCAmIDEgPyAzOTg4MjkyMzg0IF4gKGQgPj4+IDEpIDogZCA+Pj4gMTtcbiAgICAgICAgfVxuICAgICAgICBmW2NdID0gZDtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlLCBhID0gMCkge1xuICAgICAgICBpZiAoIWUgfHwgZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAtMSBeIGE7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGMgPSAtMTtcbiAgICAgICAgZm9yIChsZXQgciA9IDA7IHIgPCBlLmxlbmd0aDsgKytyKSB7XG4gICAgICAgICAgICBjID0gZlsoMjU1ICYgYykgXiBlW3JdXSBeIChjID4+PiA4KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTEgXiBjIF4gYTtcbiAgICB9O1xufSkoKTtcbi8qKlxuICog55Sf5oiQIEIzVHJhY2VJZFxuICovXG5mdW5jdGlvbiBnZXRCM1RyYWNlSWQoKSB7XG4gICAgY29uc3QgcmUgPSAnYWJjZGVmMDEyMzQ1Njc4OSc7XG4gICAgY29uc3QgamUgPSAxNjtcbiAgICBsZXQgZSA9ICcnO1xuICAgIGZvciAobGV0IHQgPSAwOyB0IDwgMTY7IHQrKykge1xuICAgICAgICBlICs9IHJlW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGplKV07XG4gICAgfVxuICAgIHJldHVybiBlO1xufVxuLyoqXG4gKiBNRDUg5Yqg5a+G5a6e546wXG4gKi9cbmZ1bmN0aW9uIG1kNShzdHIpIHtcbiAgICBmdW5jdGlvbiBzYWZlQWRkKHgsIHkpIHtcbiAgICAgICAgY29uc3QgbHN3ID0gKHggJiAweGZmZmYpICsgKHkgJiAweGZmZmYpO1xuICAgICAgICBjb25zdCBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcbiAgICAgICAgcmV0dXJuIChtc3cgPDwgMTYpIHwgKGxzdyAmIDB4ZmZmZik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGJpdFJvdGF0ZUxlZnQobnVtLCBjbnQpIHtcbiAgICAgICAgcmV0dXJuIChudW0gPDwgY250KSB8IChudW0gPj4+ICgzMiAtIGNudCkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtZDVjbW4ocSwgYSwgYiwgeCwgcywgdCkge1xuICAgICAgICByZXR1cm4gc2FmZUFkZChiaXRSb3RhdGVMZWZ0KHNhZmVBZGQoc2FmZUFkZChhLCBxKSwgc2FmZUFkZCh4LCB0KSksIHMpLCBiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbWQ1ZmYoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgICAgICByZXR1cm4gbWQ1Y21uKChiICYgYykgfCAofmIgJiBkKSwgYSwgYiwgeCwgcywgdCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG1kNWdnKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICAgICAgcmV0dXJuIG1kNWNtbigoYiAmIGQpIHwgKGMgJiB+ZCksIGEsIGIsIHgsIHMsIHQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtZDVoaChhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgICAgIHJldHVybiBtZDVjbW4oYiBeIGMgXiBkLCBhLCBiLCB4LCBzLCB0KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbWQ1aWkoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgICAgICByZXR1cm4gbWQ1Y21uKGMgXiAoYiB8IH5kKSwgYSwgYiwgeCwgcywgdCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGJpbmxNRDUoeCwgbGVuKSB7XG4gICAgICAgIHhbbGVuID4+IDVdIHw9IDB4ODAgPDwgbGVuICUgMzI7XG4gICAgICAgIHhbKCgobGVuICsgNjQpID4+PiA5KSA8PCA0KSArIDE0XSA9IGxlbjtcbiAgICAgICAgbGV0IGEgPSAxNzMyNTg0MTkzO1xuICAgICAgICBsZXQgYiA9IC0yNzE3MzM4Nzk7XG4gICAgICAgIGxldCBjID0gLTE3MzI1ODQxOTQ7XG4gICAgICAgIGxldCBkID0gMjcxNzMzODc4O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHgubGVuZ3RoOyBpICs9IDE2KSB7XG4gICAgICAgICAgICBjb25zdCBvbGRhID0gYTtcbiAgICAgICAgICAgIGNvbnN0IG9sZGIgPSBiO1xuICAgICAgICAgICAgY29uc3Qgb2xkYyA9IGM7XG4gICAgICAgICAgICBjb25zdCBvbGRkID0gZDtcbiAgICAgICAgICAgIGEgPSBtZDVmZihhLCBiLCBjLCBkLCB4W2ldLCA3LCAtNjgwODc2OTM2KTtcbiAgICAgICAgICAgIGQgPSBtZDVmZihkLCBhLCBiLCBjLCB4W2kgKyAxXSwgMTIsIC0zODk1NjQ1ODYpO1xuICAgICAgICAgICAgYyA9IG1kNWZmKGMsIGQsIGEsIGIsIHhbaSArIDJdLCAxNywgNjA2MTA1ODE5KTtcbiAgICAgICAgICAgIGIgPSBtZDVmZihiLCBjLCBkLCBhLCB4W2kgKyAzXSwgMjIsIC0xMDQ0NTI1MzMwKTtcbiAgICAgICAgICAgIGEgPSBtZDVmZihhLCBiLCBjLCBkLCB4W2kgKyA0XSwgNywgLTE3NjQxODg5Nyk7XG4gICAgICAgICAgICBkID0gbWQ1ZmYoZCwgYSwgYiwgYywgeFtpICsgNV0sIDEyLCAxMjAwMDgwNDI2KTtcbiAgICAgICAgICAgIGMgPSBtZDVmZihjLCBkLCBhLCBiLCB4W2kgKyA2XSwgMTcsIC0xNDczMjMxMzQxKTtcbiAgICAgICAgICAgIGIgPSBtZDVmZihiLCBjLCBkLCBhLCB4W2kgKyA3XSwgMjIsIC00NTcwNTk4Myk7XG4gICAgICAgICAgICBhID0gbWQ1ZmYoYSwgYiwgYywgZCwgeFtpICsgOF0sIDcsIDE3NzAwMzU0MTYpO1xuICAgICAgICAgICAgZCA9IG1kNWZmKGQsIGEsIGIsIGMsIHhbaSArIDldLCAxMiwgLTE5NTg0MTQ0MTcpO1xuICAgICAgICAgICAgYyA9IG1kNWZmKGMsIGQsIGEsIGIsIHhbaSArIDEwXSwgMTcsIC00MjA2Myk7XG4gICAgICAgICAgICBiID0gbWQ1ZmYoYiwgYywgZCwgYSwgeFtpICsgMTFdLCAyMiwgLTE5OTA0MDQxNjIpO1xuICAgICAgICAgICAgYSA9IG1kNWZmKGEsIGIsIGMsIGQsIHhbaSArIDEyXSwgNywgMTgwNDYwMzY4Mik7XG4gICAgICAgICAgICBkID0gbWQ1ZmYoZCwgYSwgYiwgYywgeFtpICsgMTNdLCAxMiwgLTQwMzQxMTAxKTtcbiAgICAgICAgICAgIGMgPSBtZDVmZihjLCBkLCBhLCBiLCB4W2kgKyAxNF0sIDE3LCAtMTUwMjAwMjI5MCk7XG4gICAgICAgICAgICBiID0gbWQ1ZmYoYiwgYywgZCwgYSwgeFtpICsgMTVdLCAyMiwgMTIzNjUzNTMyOSk7XG4gICAgICAgICAgICBhID0gbWQ1Z2coYSwgYiwgYywgZCwgeFtpICsgMV0sIDUsIC0xNjU3OTY1MTApO1xuICAgICAgICAgICAgZCA9IG1kNWdnKGQsIGEsIGIsIGMsIHhbaSArIDZdLCA5LCAtMTA2OTUwMTYzMik7XG4gICAgICAgICAgICBjID0gbWQ1Z2coYywgZCwgYSwgYiwgeFtpICsgMTFdLCAxNCwgNjQzNzE3NzEzKTtcbiAgICAgICAgICAgIGIgPSBtZDVnZyhiLCBjLCBkLCBhLCB4W2ldLCAyMCwgLTM3Mzg5NzMwMik7XG4gICAgICAgICAgICBhID0gbWQ1Z2coYSwgYiwgYywgZCwgeFtpICsgNV0sIDUsIC03MDE1NTg2OTEpO1xuICAgICAgICAgICAgZCA9IG1kNWdnKGQsIGEsIGIsIGMsIHhbaSArIDEwXSwgOSwgMzgwMTYwODMpO1xuICAgICAgICAgICAgYyA9IG1kNWdnKGMsIGQsIGEsIGIsIHhbaSArIDE1XSwgMTQsIC02NjA0NzgzMzUpO1xuICAgICAgICAgICAgYiA9IG1kNWdnKGIsIGMsIGQsIGEsIHhbaSArIDRdLCAyMCwgLTQwNTUzNzg0OCk7XG4gICAgICAgICAgICBhID0gbWQ1Z2coYSwgYiwgYywgZCwgeFtpICsgOV0sIDUsIDU2ODQ0NjQzOCk7XG4gICAgICAgICAgICBkID0gbWQ1Z2coZCwgYSwgYiwgYywgeFtpICsgMTRdLCA5LCAtMTAxOTgwMzY5MCk7XG4gICAgICAgICAgICBjID0gbWQ1Z2coYywgZCwgYSwgYiwgeFtpICsgM10sIDE0LCAtMTg3MzYzOTYxKTtcbiAgICAgICAgICAgIGIgPSBtZDVnZyhiLCBjLCBkLCBhLCB4W2kgKyA4XSwgMjAsIDExNjM1MzE1MDEpO1xuICAgICAgICAgICAgYSA9IG1kNWdnKGEsIGIsIGMsIGQsIHhbaSArIDEzXSwgNSwgLTE0NDQ2ODE0NjcpO1xuICAgICAgICAgICAgZCA9IG1kNWdnKGQsIGEsIGIsIGMsIHhbaSArIDJdLCA5LCAtNTE0MDM3ODQpO1xuICAgICAgICAgICAgYyA9IG1kNWdnKGMsIGQsIGEsIGIsIHhbaSArIDddLCAxNCwgMTczNTMyODQ3Myk7XG4gICAgICAgICAgICBiID0gbWQ1Z2coYiwgYywgZCwgYSwgeFtpICsgMTJdLCAyMCwgLTE5MjY2MDc3MzQpO1xuICAgICAgICAgICAgYSA9IG1kNWhoKGEsIGIsIGMsIGQsIHhbaSArIDVdLCA0LCAtMzc4NTU4KTtcbiAgICAgICAgICAgIGQgPSBtZDVoaChkLCBhLCBiLCBjLCB4W2kgKyA4XSwgMTEsIC0yMDIyNTc0NDYzKTtcbiAgICAgICAgICAgIGMgPSBtZDVoaChjLCBkLCBhLCBiLCB4W2kgKyAxMV0sIDE2LCAxODM5MDMwNTYyKTtcbiAgICAgICAgICAgIGIgPSBtZDVoaChiLCBjLCBkLCBhLCB4W2kgKyAxNF0sIDIzLCAtMzUzMDk1NTYpO1xuICAgICAgICAgICAgYSA9IG1kNWhoKGEsIGIsIGMsIGQsIHhbaSArIDFdLCA0LCAtMTUzMDk5MjA2MCk7XG4gICAgICAgICAgICBkID0gbWQ1aGgoZCwgYSwgYiwgYywgeFtpICsgNF0sIDExLCAxMjcyODkzMzUzKTtcbiAgICAgICAgICAgIGMgPSBtZDVoaChjLCBkLCBhLCBiLCB4W2kgKyA3XSwgMTYsIC0xNTU0OTc2MzIpO1xuICAgICAgICAgICAgYiA9IG1kNWhoKGIsIGMsIGQsIGEsIHhbaSArIDEwXSwgMjMsIC0xMDk0NzMwNjQwKTtcbiAgICAgICAgICAgIGEgPSBtZDVoaChhLCBiLCBjLCBkLCB4W2kgKyAxM10sIDQsIDY4MTI3OTE3NCk7XG4gICAgICAgICAgICBkID0gbWQ1aGgoZCwgYSwgYiwgYywgeFtpICsgMF0sIDExLCAtMzU4NTM3MjIyKTtcbiAgICAgICAgICAgIGMgPSBtZDVoaChjLCBkLCBhLCBiLCB4W2kgKyAzXSwgMTYsIC03MjI1MjE5NzkpO1xuICAgICAgICAgICAgYiA9IG1kNWhoKGIsIGMsIGQsIGEsIHhbaSArIDZdLCAyMywgNzYwMjkxODkpO1xuICAgICAgICAgICAgYSA9IG1kNWhoKGEsIGIsIGMsIGQsIHhbaSArIDldLCA0LCAtNjQwMzY0NDg3KTtcbiAgICAgICAgICAgIGQgPSBtZDVoaChkLCBhLCBiLCBjLCB4W2kgKyAxMl0sIDExLCAtNDIxODE1ODM1KTtcbiAgICAgICAgICAgIGMgPSBtZDVoaChjLCBkLCBhLCBiLCB4W2kgKyAxNV0sIDE2LCA1MzA3NDI1MjApO1xuICAgICAgICAgICAgYiA9IG1kNWhoKGIsIGMsIGQsIGEsIHhbaSArIDJdLCAyMywgLTk5NTMzODY1MSk7XG4gICAgICAgICAgICBhID0gbWQ1aWkoYSwgYiwgYywgZCwgeFtpXSwgNiwgLTE5ODYzMDg0NCk7XG4gICAgICAgICAgICBkID0gbWQ1aWkoZCwgYSwgYiwgYywgeFtpICsgN10sIDEwLCAxMTI2ODkxNDE1KTtcbiAgICAgICAgICAgIGMgPSBtZDVpaShjLCBkLCBhLCBiLCB4W2kgKyAxNF0sIDE1LCAtMTQxNjM1NDkwNSk7XG4gICAgICAgICAgICBiID0gbWQ1aWkoYiwgYywgZCwgYSwgeFtpICsgNV0sIDIxLCAtNTc0MzQwNTUpO1xuICAgICAgICAgICAgYSA9IG1kNWlpKGEsIGIsIGMsIGQsIHhbaSArIDEyXSwgNiwgMTcwMDQ4NTU3MSk7XG4gICAgICAgICAgICBkID0gbWQ1aWkoZCwgYSwgYiwgYywgeFtpICsgM10sIDEwLCAtMTg5NDk4NjYwNik7XG4gICAgICAgICAgICBjID0gbWQ1aWkoYywgZCwgYSwgYiwgeFtpICsgMTBdLCAxNSwgLTEwNTE1MjMpO1xuICAgICAgICAgICAgYiA9IG1kNWlpKGIsIGMsIGQsIGEsIHhbaSArIDFdLCAyMSwgLTIwNTQ5MjI3OTkpO1xuICAgICAgICAgICAgYSA9IG1kNWlpKGEsIGIsIGMsIGQsIHhbaSArIDhdLCA2LCAxODczMzEzMzU5KTtcbiAgICAgICAgICAgIGQgPSBtZDVpaShkLCBhLCBiLCBjLCB4W2kgKyAxNV0sIDEwLCAtMzA2MTE3NDQpO1xuICAgICAgICAgICAgYyA9IG1kNWlpKGMsIGQsIGEsIGIsIHhbaSArIDZdLCAxNSwgLTE1NjAxOTgzODApO1xuICAgICAgICAgICAgYiA9IG1kNWlpKGIsIGMsIGQsIGEsIHhbaSArIDEzXSwgMjEsIDEzMDkxNTE2NDkpO1xuICAgICAgICAgICAgYSA9IG1kNWlpKGEsIGIsIGMsIGQsIHhbaSArIDRdLCA2LCAtMTQ1NTIzMDcwKTtcbiAgICAgICAgICAgIGQgPSBtZDVpaShkLCBhLCBiLCBjLCB4W2kgKyAxMV0sIDEwLCAtMTEyMDIxMDM3OSk7XG4gICAgICAgICAgICBjID0gbWQ1aWkoYywgZCwgYSwgYiwgeFtpICsgMl0sIDE1LCA3MTg3ODcyNTkpO1xuICAgICAgICAgICAgYiA9IG1kNWlpKGIsIGMsIGQsIGEsIHhbaSArIDldLCAyMSwgLTM0MzQ4NTU1MSk7XG4gICAgICAgICAgICBhID0gc2FmZUFkZChhLCBvbGRhKTtcbiAgICAgICAgICAgIGIgPSBzYWZlQWRkKGIsIG9sZGIpO1xuICAgICAgICAgICAgYyA9IHNhZmVBZGQoYywgb2xkYyk7XG4gICAgICAgICAgICBkID0gc2FmZUFkZChkLCBvbGRkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW2EsIGIsIGMsIGRdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBiaW5sMmhleChiaW5hcnJheSkge1xuICAgICAgICBjb25zdCBoZXhUYWIgPSAnMDEyMzQ1Njc4OWFiY2RlZic7XG4gICAgICAgIGxldCBzdHIgPSAnJztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5hcnJheS5sZW5ndGggKiA0OyBpKyspIHtcbiAgICAgICAgICAgIHN0ciArPVxuICAgICAgICAgICAgICAgIGhleFRhYi5jaGFyQXQoKGJpbmFycmF5W2kgPj4gMl0gPj4gKChpICUgNCkgKiA4ICsgNCkpICYgMHhmKSArXG4gICAgICAgICAgICAgICAgICAgIGhleFRhYi5jaGFyQXQoKGJpbmFycmF5W2kgPj4gMl0gPj4gKChpICUgNCkgKiA4KSkgJiAweGYpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN0cjJiaW5sKHN0cikge1xuICAgICAgICBjb25zdCBiaW4gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoICogODsgaSArPSA4KSB7XG4gICAgICAgICAgICBiaW5baSA+PiA1XSB8PSAoc3RyLmNoYXJDb2RlQXQoaSAvIDgpICYgMHhmZikgPDwgaSAlIDMyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiaW47XG4gICAgfVxuICAgIGZ1bmN0aW9uIHV0ZjhFbmNvZGUoc3RyaW5nKSB7XG4gICAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpO1xuICAgICAgICBsZXQgdXRmdGV4dCA9ICcnO1xuICAgICAgICBmb3IgKGxldCBuID0gMDsgbiA8IHN0cmluZy5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgY29uc3QgYyA9IHN0cmluZy5jaGFyQ29kZUF0KG4pO1xuICAgICAgICAgICAgaWYgKGMgPCAxMjgpIHtcbiAgICAgICAgICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjID4gMTI3ICYmIGMgPCAyMDQ4KSB7XG4gICAgICAgICAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjID4+IDYpIHwgMTkyKTtcbiAgICAgICAgICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgJiA2MykgfCAxMjgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjID4+IDEyKSB8IDIyNCk7XG4gICAgICAgICAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyA+PiA2KSAmIDYzKSB8IDEyOCk7XG4gICAgICAgICAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXRmdGV4dDtcbiAgICB9XG4gICAgY29uc3QgdXRmOFN0ciA9IHV0ZjhFbmNvZGUoc3RyKTtcbiAgICBjb25zdCBiaW5sID0gc3RyMmJpbmwodXRmOFN0cik7XG4gICAgcmV0dXJuIGJpbmwyaGV4KGJpbmxNRDUoYmlubCwgdXRmOFN0ci5sZW5ndGggKiA4KSk7XG59XG4vKipcbiAqIOiOt+WPluWwj+e6ouS5puetvuWQjVxuICog6ZyA6KaB5Zyo5bey5Yqg6L29IHdlYl9zaWduLmpzIOeahOmhtemdoueOr+Wig+S4reiwg+eUqFxuICpcbiAqIEBwYXJhbSB1cmwgQVBJ6Lev5b6EXG4gKiBAcGFyYW0gYm9keSDor7fmsYLkvZPvvIjlj6/pgInvvIlcbiAqIEBwYXJhbSBhMSBjb29raWXkuK3nmoRhMeWAvFxuICogQHJldHVybnMg562+5ZCN57uT5p6cXG4gKi9cbmZ1bmN0aW9uIGdldFhoc1NpZ24odXJsLCBib2R5LCBhMSkge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIOiuvue9ruWwj+e6ouS5puetvuWQjeeOr+Wig+WPmOmHj1xuICAgICAgICB3aW5kb3cueHNlY3BsYXRmb3JtID0gJ1dpbmRvd3MnO1xuICAgICAgICB3aW5kb3cueHNlY2FwcGlkID0gJ3hocy1wYy13ZWInO1xuICAgICAgICAvLyDorr7nva4gYTEg5YiwIGNvb2tpZe+8iOetvuWQjeeul+azlemcgOimge+8iVxuICAgICAgICBkb2N1bWVudC5jb29raWUgPSBgYTE9JHthMX07IHBhdGg9L2A7XG4gICAgICAgIC8vIOaehOW7uuetvuWQjeaVsOaNrlxuICAgICAgICBsZXQgeDFfZGF0YSA9IHVybC5zdWJzdHJpbmcodXJsLmluZGV4T2YoJy9hcGknKSk7XG4gICAgICAgIGlmIChib2R5ICE9PSBudWxsICYmIGJvZHkgIT09IHVuZGVmaW5lZCAmJiBib2R5ICE9PSAnJykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBib2R5U3RyID0gdHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnID8gYm9keSA6IEpTT04uc3RyaW5naWZ5KGJvZHkpO1xuICAgICAgICAgICAgICAgIHgxX2RhdGEgPSB4MV9kYXRhLmNvbmNhdChib2R5U3RyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChfYSkge1xuICAgICAgICAgICAgICAgIHgxX2RhdGEgPSB4MV9kYXRhLmNvbmNhdChKU09OLnN0cmluZ2lmeShib2R5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8g6K6h566XIE1ENVxuICAgICAgICBjb25zdCB4MSA9IG1kNSh4MV9kYXRhKTtcbiAgICAgICAgLy8g5qOA5p+lIG1uc3YyIOWHveaVsOaYr+WQpuWtmOWcqFxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5tbnN2MiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1hoc1NpZ25dIG1uc3YyIOWHveaVsOS4jeWtmOWcqO+8jOivt+ehruS/nSB3ZWJfc2lnbi5qcyDlt7LliqDovb0nKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIC8vIOiwg+eUqOWwj+e6ouS5puetvuWQjeWHveaVsFxuICAgICAgICBjb25zdCB4MyA9IHdpbmRvdy5tbnN2Mih4MV9kYXRhLCB4MSk7XG4gICAgICAgIC8vIOaehOW7uiBYUyDmlbDmja5cbiAgICAgICAgY29uc3QgWFNfRGF0YSA9IHtcbiAgICAgICAgICAgIHgwOiAnNC4yLjEnLFxuICAgICAgICAgICAgeDE6ICd4aHMtcGMtd2ViJyxcbiAgICAgICAgICAgIHgyOiAnV2luZG93cycsXG4gICAgICAgICAgICB4MzogeDMsXG4gICAgICAgICAgICB4NDogJ29iamVjdCcsXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IFhTID0gJ1hZU18nLmNvbmNhdChiNjRFbmNvZGUoZW5jb2RlVXRmOChKU09OLnN0cmluZ2lmeShYU19EYXRhKSkpKTtcbiAgICAgICAgLy8geDgg5Zu65a6a5YC8XG4gICAgICAgIGNvbnN0IHg4ID0gJ0kzOHJIZGdzam9wZ0l2ZXNkVndnSUMrb0lFTG1CWjVlM1Z3WExnRlRJeFMzYnF3RXJGZWV4ZDBla25jQXpNRllucXRoSWhKZVNmTURLdXRSSTNLc1lvcldIUHRHcmJWMFA5V2ZJaS9lV2M2ZVlxdHlRQXBQSTM3ZWttUjZRTCs1SWk2c2RuZWVTZnFZSHF3bDJxdDVCMERCSXgrUEdEaS9zVnRrSXhkc3h1d3I0cXRpSWh1YUlFM2UzTFYwSTNWVElDN2UwdXRsMkFEbXNMdmVEU0tzU1B3NUlFdnNpVnRKT3F3OEJ1d2ZQcGRlVEZXT0l4NFRJaXU2WlB3clB1dDVJdmxhTGJnczNxdHhJeGVzMVZ3SElrdW1Ja0l5ZWpnc1kvV1RnZTdlU3F0ZS9EN3NEY3BpcGVkZVlyRHRJQzZlRFZ3MklFTnNTcXRsbmxTdU5qVnRJdm9la3F0M2NaN3NWbzRnSUVTeUloRUpIN0dVSXhtUE96bW9JaWNYZVB3Rkl2aVIyQjVzRHo3c3hWdGRJdjZlZDc3ZVlqdVFJRTBlNldiWUtxd2pJaEpzM29lczZEdmVUUHROY1U2ZUR1dzVJdllwYy8wZWRWd1VMbm9zRFZ3ckkzVGFJeG1sc3F0c2FQd3lzc0hiT0l2ZURvNWVUVnduSUVLc1dmQWUxY1EzSWlOc1NwdmVrQldBSWlKZVRQdE1JaHBEOHF0dDJWdFdJeHZlM1B3MUlrL3MxdXc1SUVBc2p1dFMrcXdQelB3VUl2dWtJeGNyTmVRaE9yTmVpdXdKSXhHcklodnNkUHRwemxJcGMvSnNEQlkzSWljTDJ1dEtydXdTSUNkc2tQdFMrU0tlMWNBc2lNbUxJaUFzeDdPc1R1dHljUHdxSUMwZWZWdFVJaTVlVHN1UElDS3MxbkpzZlB3U0l2QXMxUHdmdFlwd0lrV3lJdi9leG01czFVMHNEejBlU3F3b0lDK1NJdklpclZ3Ryc7XG4gICAgICAgIC8vIOaehOW7uiBYU19jb21tb24g5pWw5o2uXG4gICAgICAgIGNvbnN0IHhzX2NvbW1vbl9kYXRhID0ge1xuICAgICAgICAgICAgczA6IDUsXG4gICAgICAgICAgICBzMTogJycsXG4gICAgICAgICAgICB4MDogJzEnLFxuICAgICAgICAgICAgeDE6ICc0LjEuMCcsXG4gICAgICAgICAgICB4MjogJ1dpbmRvd3MnLFxuICAgICAgICAgICAgeDM6ICd4aHMtcGMtd2ViJyxcbiAgICAgICAgICAgIHg0OiAnNC42OC4wJyxcbiAgICAgICAgICAgIHg1OiBhMSxcbiAgICAgICAgICAgIHg2OiAnJyxcbiAgICAgICAgICAgIHg3OiAnJyxcbiAgICAgICAgICAgIHg4OiB4OCxcbiAgICAgICAgICAgIHg5OiBjcmMzMihlbmNvZGVVdGY4KCcnLmNvbmNhdCgnJykuY29uY2F0KCcnKS5jb25jYXQoeDgpKSksXG4gICAgICAgICAgICB4MTA6IDAsXG4gICAgICAgICAgICB4MTE6ICdub3JtYWwnLFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBYU19jb21tb24gPSBiNjRFbmNvZGUoZW5jb2RlVXRmOChKU09OLnN0cmluZ2lmeSh4c19jb21tb25fZGF0YSkpKTtcbiAgICAgICAgY29uc3QgeF9iM190cmFjZWlkID0gZ2V0QjNUcmFjZUlkKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnWC1zJzogWFMsXG4gICAgICAgICAgICAnWC10JzogbmV3IERhdGUoKS5nZXRUaW1lKCkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICdYLXMtY29tbW9uJzogWFNfY29tbW9uLFxuICAgICAgICAgICAgJ1gtQjMtVHJhY2VpZCc6IHhfYjNfdHJhY2VpZCxcbiAgICAgICAgICAgICdYLXhyYXktdHJhY2VpZCc6IG1kNSh4X2IzX3RyYWNlaWQpLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW1hoc1NpZ25dIOetvuWQjeWksei0pTonLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbi8qKlxuICog5Yid5aeL5YyW562+5ZCN5pyN5YqhXG4gKiDliqDovb0gd2ViX3NpZ24uanMg5bm26K6+572u5raI5oGv55uR5ZCsXG4gKi9cbmZ1bmN0aW9uIGluaXRYaHNTaWduU2VydmljZSgpIHtcbiAgICBjb25zb2xlLmxvZygnW1hoc1NpZ24gSW5qZWN0XSDliJ3lp4vljJblsI/nuqLkuabnrb7lkI3mnI3liqEuLi4nKTtcbiAgICAvLyDlsIbnrb7lkI3lh73mlbDmjILovb3liLAgd2luZG93IOWvueixoVxuICAgIHdpbmRvdy5fX3hoc1NpZ24gPSBnZXRYaHNTaWduO1xuICAgIC8vIOebkeWQrOadpeiHqiBjb250ZW50IHNjcmlwdCDnmoTnrb7lkI3or7fmsYJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgICAgICAvLyDlj6rlpITnkIbmnaXoh6rlvZPliY3nqpflj6PnmoTmtojmga9cbiAgICAgICAgaWYgKGV2ZW50LnNvdXJjZSAhPT0gd2luZG93KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGF0YSA9IGV2ZW50LmRhdGE7XG4gICAgICAgIC8vIOajgOafpea2iOaBr+adpea6kOWSjOexu+Wei1xuICAgICAgICBpZiAoKGRhdGEgPT09IG51bGwgfHwgZGF0YSA9PT0gdm9pZCAwID8gdm9pZCAwIDogZGF0YS5zb3VyY2UpID09PSBYSFNfU0lHTl9TT1VSQ0UgJiZcbiAgICAgICAgICAgIChkYXRhID09PSBudWxsIHx8IGRhdGEgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGRhdGEudHlwZSkgPT09IFhIU19TSUdOX01FU1NBR0VfVFlQRS5SRVFVRVNUKSB7XG4gICAgICAgICAgICBjb25zdCB7IHJlcXVlc3RJZCwgcGF5bG9hZCB9ID0gZGF0YTtcbiAgICAgICAgICAgIGNvbnN0IHsgdXJsLCBkYXRhOiBib2R5RGF0YSwgYTEgfSA9IHBheWxvYWQ7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1hoc1NpZ24gSW5qZWN0XSDmlLbliLDnrb7lkI3or7fmsYI6JywgdXJsKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2lnblJlc3VsdCA9IGdldFhoc1NpZ24odXJsLCBib2R5RGF0YSwgYTEpO1xuICAgICAgICAgICAgICAgIGlmIChzaWduUmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWPkemAgeaIkOWKn+WTjeW6lFxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBYSFNfU0lHTl9TT1VSQ0UsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBYSFNfU0lHTl9NRVNTQUdFX1RZUEUuUkVTUE9OU0UsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHNpZ25SZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LCAnKicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1hoc1NpZ24gSW5qZWN0XSDnrb7lkI3miJDlip8nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWPkemAgeWksei0peWTjeW6lFxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBYSFNfU0lHTl9TT1VSQ0UsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBYSFNfU0lHTl9NRVNTQUdFX1RZUEUuUkVTUE9OU0UsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ21uc3YyIOWHveaVsOS4jeWtmOWcqO+8jOetvuWQjeWksei0pScsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LCAnKicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIOWPkemAgemUmeivr+WTjeW6lFxuICAgICAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZTogWEhTX1NJR05fU09VUkNFLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBYSFNfU0lHTl9NRVNTQUdFX1RZUEUuUkVTUE9OU0UsXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAoZXJyb3IgPT09IG51bGwgfHwgZXJyb3IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGVycm9yLm1lc3NhZ2UpIHx8ICfnrb7lkI3lpLHotKUnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sICcqJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1hoc1NpZ24gSW5qZWN0XSDnrb7lkI3lpLHotKU6JywgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJ1tYaHNTaWduIEluamVjdF0g5bCP57qi5Lmm562+5ZCN5pyN5Yqh5bey5Yid5aeL5YyWJyk7XG59XG4vLyDliJ3lp4vljJbnrb7lkI3mnI3liqFcbmluaXRYaHNTaWduU2VydmljZSgpO1xuZXhwb3J0IHsgZ2V0WGhzU2lnbiwgWEhTX1NJR05fU09VUkNFLCBYSFNfU0lHTl9NRVNTQUdFX1RZUEUgfTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==