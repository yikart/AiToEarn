/*
 * Copyright (C) 2011 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef WKCookieManager_h
#define WKCookieManager_h

#include <WebKit/WKBase.h>
#include <WebKit/WKDeprecated.h>

#ifdef __cplusplus
extern "C" {
#endif

enum {
    kWKHTTPCookieAcceptPolicyAlways = 0,
    kWKHTTPCookieAcceptPolicyNever = 1,
    kWKHTTPCookieAcceptPolicyOnlyFromMainDocumentDomain = 2,
    kWKHTTPCookieAcceptPolicyExclusivelyFromMainDocumentDomain = 3
};
typedef uint32_t WKHTTPCookieAcceptPolicy;

// Cookie Manager Client
typedef void (*WKCookieManagerCookiesDidChangeCallback)(WKCookieManagerRef cookieManager, const void *clientInfo);

typedef struct WKCookieManagerClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKCookieManagerClientBase;

typedef struct WKCookieManagerClientV0 {
    WKCookieManagerClientBase                                           base;

    // Version 0.
    WKCookieManagerCookiesDidChangeCallback                             cookiesDidChange;
} WKCookieManagerClientV0;

WK_EXPORT WKTypeID WKCookieManagerGetTypeID() WK_C_API_DEPRECATED;

WK_EXPORT void WKCookieManagerSetClient(WKCookieManagerRef cookieManager, const WKCookieManagerClientBase* client) WK_C_API_DEPRECATED;

typedef void (*WKCookieManagerGetCookieHostnamesFunction)(WKArrayRef, WKErrorRef, void*);
WK_EXPORT void WKCookieManagerGetHostnamesWithCookies(WKCookieManagerRef cookieManager, void* context, WKCookieManagerGetCookieHostnamesFunction function) WK_C_API_DEPRECATED;

WK_EXPORT void WKCookieManagerDeleteCookiesForHostname(WKCookieManagerRef cookieManager, WKStringRef hostname) WK_C_API_DEPRECATED;
WK_EXPORT void WKCookieManagerDeleteAllCookies(WKCookieManagerRef cookieManager) WK_C_API_DEPRECATED_WITH_REPLACEMENT(WKHTTPCookieStoreDeleteAllCookies);

// The time here is relative to the Unix epoch.
WK_EXPORT void WKCookieManagerDeleteAllCookiesModifiedAfterDate(WKCookieManagerRef cookieManager, double) WK_C_API_DEPRECATED;

typedef void (*WKCookieManagerSetHTTPCookieAcceptPolicyFunction)(WKErrorRef, void*);
WK_EXPORT void WKCookieManagerSetHTTPCookieAcceptPolicy(WKCookieManagerRef cookieManager, WKHTTPCookieAcceptPolicy policy, void* context, WKCookieManagerSetHTTPCookieAcceptPolicyFunction callback) WK_C_API_DEPRECATED_WITH_REPLACEMENT(WKHTTPCookieStoreSetHTTPCookieAcceptPolicy);
typedef void (*WKCookieManagerGetHTTPCookieAcceptPolicyFunction)(WKHTTPCookieAcceptPolicy, WKErrorRef, void*);
WK_EXPORT void WKCookieManagerGetHTTPCookieAcceptPolicy(WKCookieManagerRef cookieManager, void* context, WKCookieManagerGetHTTPCookieAcceptPolicyFunction callback) WK_C_API_DEPRECATED;

WK_EXPORT void WKCookieManagerStartObservingCookieChanges(WKCookieManagerRef cookieManager) WK_C_API_DEPRECATED;
WK_EXPORT void WKCookieManagerStopObservingCookieChanges(WKCookieManagerRef cookieManager) WK_C_API_DEPRECATED;

#ifdef __cplusplus
}
#endif

#endif // WKCookieManager_h
