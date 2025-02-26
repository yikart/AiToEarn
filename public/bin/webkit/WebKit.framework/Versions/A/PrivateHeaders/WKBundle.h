/*
 * Copyright (C) 2010 Apple Inc. All rights reserved.
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

#ifndef WKBundle_h
#define WKBundle_h

#include <JavaScriptCore/JavaScript.h>
#include <WebKit/WKBase.h>
#include <WebKit/WKDeprecated.h>

#ifdef __cplusplus
extern "C" {
#endif

// Client
typedef void (*WKBundleDidCreatePageCallback)(WKBundleRef bundle, WKBundlePageRef page, const void* clientInfo);
typedef void (*WKBundleWillDestroyPageCallback)(WKBundleRef bundle, WKBundlePageRef page, const void* clientInfo);
typedef void (*WKBundleDidInitializePageGroupCallback)(WKBundleRef bundle, WKBundlePageGroupRef pageGroup, const void* clientInfo);
typedef void (*WKBundleDidReceiveMessageCallback)(WKBundleRef bundle, WKStringRef name, WKTypeRef messageBody, const void* clientInfo);
typedef void (*WKBundleDidReceiveMessageToPageCallback)(WKBundleRef bundle, WKBundlePageRef page, WKStringRef name, WKTypeRef messageBody, const void* clientInfo);

typedef struct WKBundleClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKBundleClientBase;

typedef struct WKBundleClientV0 {
    WKBundleClientBase                                                  base;

    // Version 0.
    WKBundleDidCreatePageCallback                                       didCreatePage;
    WKBundleWillDestroyPageCallback                                     willDestroyPage;
    WKBundleDidInitializePageGroupCallback                              didInitializePageGroup;
    WKBundleDidReceiveMessageCallback                                   didReceiveMessage;
} WKBundleClientV0;

typedef struct WKBundleClientV1 {
    WKBundleClientBase                                                  base;

    // Version 0.
    WKBundleDidCreatePageCallback                                       didCreatePage;
    WKBundleWillDestroyPageCallback                                     willDestroyPage;
    WKBundleDidInitializePageGroupCallback                              didInitializePageGroup;
    WKBundleDidReceiveMessageCallback                                   didReceiveMessage;

    // Version 1.
    WKBundleDidReceiveMessageToPageCallback                             didReceiveMessageToPage;
} WKBundleClientV1;

WK_EXPORT WKTypeID WKBundleGetTypeID();

WK_EXPORT void WKBundleSetClient(WKBundleRef bundle, WKBundleClientBase* client);
WK_EXPORT void WKBundleSetServiceWorkerProxyCreationCallback(WKBundleRef bundle, void (*)(uint64_t));

WK_EXPORT void WKBundlePostMessage(WKBundleRef bundle, WKStringRef messageName, WKTypeRef messageBody);
WK_EXPORT void WKBundlePostSynchronousMessage(WKBundleRef bundle, WKStringRef messageName, WKTypeRef messageBody, WKTypeRef* returnRetainedData) WK_C_API_DEPRECATED;

WK_EXPORT void WKBundleReportException(JSContextRef, JSValueRef exception);

#ifdef __cplusplus
}
#endif

#endif /* WKBundle_h */
