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

#ifndef WKBundlePageResourceLoadClient_h
#define WKBundlePageResourceLoadClient_h

#include <WebKit/WKBase.h>

typedef void (*WKBundlePageDidInitiateLoadForResourceCallback)(WKBundlePageRef, WKBundleFrameRef, uint64_t resourceIdentifier, WKURLRequestRef, bool pageIsProvisionallyLoading, const void* clientInfo);
typedef WKURLRequestRef (*WKBundlePageWillSendRequestForFrameCallback)(WKBundlePageRef, WKBundleFrameRef, uint64_t resourceIdentifier, WKURLRequestRef, WKURLResponseRef redirectResponse, const void *clientInfo);
typedef void (*WKBundlePageDidReceiveResponseForResourceCallback)(WKBundlePageRef, WKBundleFrameRef, uint64_t resourceIdentifier, WKURLResponseRef, const void* clientInfo);
typedef void (*WKBundlePageDidReceiveContentLengthForResourceCallback)(WKBundlePageRef, WKBundleFrameRef, uint64_t resourceIdentifier, uint64_t contentLength, const void* clientInfo);
typedef void (*WKBundlePageDidFinishLoadForResourceCallback)(WKBundlePageRef, WKBundleFrameRef, uint64_t resourceIdentifier, const void* clientInfo);
typedef void (*WKBundlePageDidFailLoadForResourceCallback)(WKBundlePageRef, WKBundleFrameRef, uint64_t resourceIdentifier, WKErrorRef, const void* clientInfo);
typedef bool (*WKBundlePageShouldCacheResponseCallback)(WKBundlePageRef, WKBundleFrameRef, uint64_t resourceIdentifier, const void* clientInfo);
typedef bool (*WKBundlePageShouldUseCredentialStorageCallback)(WKBundlePageRef, WKBundleFrameRef, uint64_t resourceIdentifier, const void* clientInfo);

typedef struct WKBundlePageResourceLoadClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKBundlePageResourceLoadClientBase;

typedef struct WKBundlePageResourceLoadClientV0 {
    WKBundlePageResourceLoadClientBase                                  base;

    // Version 0.
    WKBundlePageDidInitiateLoadForResourceCallback                      didInitiateLoadForResource;

    // willSendRequestForFrame is supposed to return a retained reference to the URL request.
    WKBundlePageWillSendRequestForFrameCallback                         willSendRequestForFrame;

    WKBundlePageDidReceiveResponseForResourceCallback                   didReceiveResponseForResource;
    WKBundlePageDidReceiveContentLengthForResourceCallback              didReceiveContentLengthForResource;
    WKBundlePageDidFinishLoadForResourceCallback                        didFinishLoadForResource;
    WKBundlePageDidFailLoadForResourceCallback                          didFailLoadForResource;
} WKBundlePageResourceLoadClientV0;

typedef struct WKBundlePageResourceLoadClientV1 {
    WKBundlePageResourceLoadClientBase                                  base;

    // Version 0.
    WKBundlePageDidInitiateLoadForResourceCallback                      didInitiateLoadForResource;

    // willSendRequestForFrame is supposed to return a retained reference to the URL request.
    WKBundlePageWillSendRequestForFrameCallback                         willSendRequestForFrame;

    WKBundlePageDidReceiveResponseForResourceCallback                   didReceiveResponseForResource;
    WKBundlePageDidReceiveContentLengthForResourceCallback              didReceiveContentLengthForResource;
    WKBundlePageDidFinishLoadForResourceCallback                        didFinishLoadForResource;
    WKBundlePageDidFailLoadForResourceCallback                          didFailLoadForResource;

    // Version 1.
    WKBundlePageShouldCacheResponseCallback                             shouldCacheResponse;
    WKBundlePageShouldUseCredentialStorageCallback                      shouldUseCredentialStorage;
} WKBundlePageResourceLoadClientV1;

#endif // WKBundlePageResourceLoadClient_h
