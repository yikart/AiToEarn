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

#ifndef WKBundlePagePolicyClient_h
#define WKBundlePagePolicyClient_h

#include <WebKit/WKBase.h>

enum {
    WKBundlePagePolicyActionPassThrough,
    WKBundlePagePolicyActionUse
};
typedef uint32_t WKBundlePagePolicyAction;

typedef WKBundlePagePolicyAction (*WKBundlePageDecidePolicyForNavigationActionCallback)(WKBundlePageRef page, WKBundleFrameRef frame, WKBundleNavigationActionRef navigationAction, WKURLRequestRef request, WKTypeRef* userData, const void* clientInfo);
typedef WKBundlePagePolicyAction (*WKBundlePageDecidePolicyForNewWindowActionCallback)(WKBundlePageRef page, WKBundleFrameRef frame, WKBundleNavigationActionRef navigationAction, WKURLRequestRef request, WKStringRef frameName, WKTypeRef* userData, const void* clientInfo);
typedef WKBundlePagePolicyAction (*WKBundlePageDecidePolicyForResponseCallback)(WKBundlePageRef page, WKBundleFrameRef frame, WKURLResponseRef response, WKURLRequestRef request, WKTypeRef* userData, const void* clientInfo);
typedef void (*WKBundlePageUnableToImplementPolicyCallback)(WKBundlePageRef page, WKBundleFrameRef frame, WKErrorRef error, WKTypeRef* userData, const void* clientInfo);

typedef struct WKBundlePagePolicyClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKBundlePagePolicyClientBase;

typedef struct WKBundlePagePolicyClientV0 {
    WKBundlePagePolicyClientBase                                        base;

    // Version 0.
    WKBundlePageDecidePolicyForNavigationActionCallback                 decidePolicyForNavigationAction;
    WKBundlePageDecidePolicyForNewWindowActionCallback                  decidePolicyForNewWindowAction;
    WKBundlePageDecidePolicyForResponseCallback                         decidePolicyForResponse;
    WKBundlePageUnableToImplementPolicyCallback                         unableToImplementPolicy;
} WKBundlePagePolicyClientV0;

#endif // WKBundlePagePolicyClient_h
