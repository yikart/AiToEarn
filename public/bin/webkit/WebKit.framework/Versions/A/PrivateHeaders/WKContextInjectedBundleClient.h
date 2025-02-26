/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#ifndef WKContextInjectedBundleClient_h
#define WKContextInjectedBundleClient_h

#include <WebKit/WKBase.h>

// Injected Bundle Client
typedef void (*WKContextDidReceiveMessageFromInjectedBundleCallback)(WKContextRef context, WKStringRef messageName, WKTypeRef messageBody, const void *clientInfo);
typedef void (*WKContextDidReceiveSynchronousMessageFromInjectedBundleCallback)(WKContextRef context, WKStringRef messageName, WKTypeRef messageBody, WKTypeRef* returnData, const void *clientInfo);
typedef WKTypeRef (*WKContextGetInjectedBundleInitializationUserDataCallback)(WKContextRef context, const void *clientInfo);
typedef void (*WKContextDidReceiveSynchronousMessageFromInjectedBundleWithListenerCallback)(WKContextRef context, WKStringRef messageName, WKTypeRef messageBody, WKMessageListenerRef listener, const void *clientInfo);

typedef struct WKContextInjectedBundleClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKContextInjectedBundleClientBase;

typedef struct WKContextInjectedBundleClientV0 {
    WKContextInjectedBundleClientBase                                   base;

    // Version 0.
    WKContextDidReceiveMessageFromInjectedBundleCallback                didReceiveMessageFromInjectedBundle;
    WKContextDidReceiveSynchronousMessageFromInjectedBundleCallback     didReceiveSynchronousMessageFromInjectedBundle;
} WKContextInjectedBundleClientV0;

typedef struct WKContextInjectedBundleClientV1 {
    WKContextInjectedBundleClientBase                                   base;

    // Version 0.
    WKContextDidReceiveMessageFromInjectedBundleCallback                didReceiveMessageFromInjectedBundle;
    WKContextDidReceiveSynchronousMessageFromInjectedBundleCallback     didReceiveSynchronousMessageFromInjectedBundle;

    // Version 1.
    WKContextGetInjectedBundleInitializationUserDataCallback            getInjectedBundleInitializationUserData;
} WKContextInjectedBundleClientV1;

typedef struct WKContextInjectedBundleClientV2 {
    WKContextInjectedBundleClientBase                                   base;

    // Version 0.
    WKContextDidReceiveMessageFromInjectedBundleCallback                didReceiveMessageFromInjectedBundle;
    WKContextDidReceiveSynchronousMessageFromInjectedBundleCallback     didReceiveSynchronousMessageFromInjectedBundle;

    // Version 1.
    WKContextGetInjectedBundleInitializationUserDataCallback            getInjectedBundleInitializationUserData;

    // Version 2.
    WKContextDidReceiveSynchronousMessageFromInjectedBundleWithListenerCallback didReceiveSynchronousMessageFromInjectedBundleWithListener;
} WKContextInjectedBundleClientV2;

#endif // WKContextInjectedBundleClient_h
