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

#ifndef WKPagePolicyClient_h
#define WKPagePolicyClient_h

#include <WebKit/WKBase.h>
#include <WebKit/WKEvent.h>
#include <WebKit/WKPageLoadTypes.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef void (*WKPageDecidePolicyForNavigationActionCallback)(WKPageRef page, WKFrameRef frame, WKFrameNavigationType navigationType, WKEventModifiers modifiers, WKEventMouseButton mouseButton, WKFrameRef originatingFrame, WKURLRequestRef request, WKFramePolicyListenerRef listener, WKTypeRef userData, const void* clientInfo);
typedef void (*WKPageDecidePolicyForNewWindowActionCallback)(WKPageRef page, WKFrameRef frame, WKFrameNavigationType navigationType, WKEventModifiers modifiers, WKEventMouseButton mouseButton, WKURLRequestRef request, WKStringRef frameName, WKFramePolicyListenerRef listener, WKTypeRef userData, const void* clientInfo);
typedef void (*WKPageDecidePolicyForResponseCallback_deprecatedForUseWithV0)(WKPageRef page, WKFrameRef frame, WKURLResponseRef response, WKURLRequestRef request, WKFramePolicyListenerRef listener, WKTypeRef userData, const void* clientInfo);
typedef void (*WKPageUnableToImplementPolicyCallback)(WKPageRef page, WKFrameRef frame, WKErrorRef error, WKTypeRef userData, const void* clientInfo);

typedef void (*WKPageDecidePolicyForNavigationActionCallback_deprecatedForUseWithV0)(WKPageRef page, WKFrameRef frame, WKFrameNavigationType navigationType, WKEventModifiers modifiers, WKEventMouseButton mouseButton, WKURLRequestRef request, WKFramePolicyListenerRef listener, WKTypeRef userData, const void* clientInfo);
typedef void (*WKPageDecidePolicyForResponseCallback)(WKPageRef page, WKFrameRef frame, WKURLResponseRef response, WKURLRequestRef request, bool canShowMIMEType, WKFramePolicyListenerRef listener, WKTypeRef userData, const void* clientInfo);

typedef struct WKPagePolicyClientBase {
    int                                                                  version;
    const void *                                                         clientInfo;
} WKPagePolicyClientBase;

typedef struct WKPagePolicyClientV0 {
    WKPagePolicyClientBase                                               base;

    // Version 0.
    WKPageDecidePolicyForNavigationActionCallback_deprecatedForUseWithV0 decidePolicyForNavigationAction_deprecatedForUseWithV0;
    WKPageDecidePolicyForNewWindowActionCallback                         decidePolicyForNewWindowAction;
    WKPageDecidePolicyForResponseCallback_deprecatedForUseWithV0         decidePolicyForResponse_deprecatedForUseWithV0;
    WKPageUnableToImplementPolicyCallback                                unableToImplementPolicy;
} WKPagePolicyClientV0;

typedef struct WKPagePolicyClientV1 {
    WKPagePolicyClientBase                                               base;

    // Version 0.
    WKPageDecidePolicyForNavigationActionCallback_deprecatedForUseWithV0 decidePolicyForNavigationAction_deprecatedForUseWithV0;
    WKPageDecidePolicyForNewWindowActionCallback                         decidePolicyForNewWindowAction;
    WKPageDecidePolicyForResponseCallback_deprecatedForUseWithV0         decidePolicyForResponse_deprecatedForUseWithV0;
    WKPageUnableToImplementPolicyCallback                                unableToImplementPolicy;

    // Version 1.
    WKPageDecidePolicyForNavigationActionCallback                        decidePolicyForNavigationAction;
    WKPageDecidePolicyForResponseCallback                                decidePolicyForResponse;
} WKPagePolicyClientV1;

#ifdef __cplusplus
}
#endif

#endif // WKPagePolicyClient_h
