/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#pragma once

#include <WebKit/WKBase.h>
#include <WebKit/WKDeprecated.h>

#ifdef __cplusplus
extern "C" {
#endif

WK_EXPORT WKTypeID WKWebsitePoliciesGetTypeID();

enum WKWebsiteAutoplayPolicy {
    kWKWebsiteAutoplayPolicyDefault,
    kWKWebsiteAutoplayPolicyAllow,
    kWKWebsiteAutoplayPolicyAllowWithoutSound,
    kWKWebsiteAutoplayPolicyDeny
};

typedef uint32_t WKWebsiteAutoplayQuirk;
enum {
    kWKWebsiteAutoplayQuirkSynthesizedPauseEvents = 1 << 0,
    kWKWebsiteAutoplayQuirkInheritedUserGestures = 1 << 1,
    kWKWebsiteAutoplayQuirkArbitraryUserGestures = 1 << 2,
    kWKWebsiteAutoplayQuirkPerDocumentAutoplayBehavior = 1 << 3,
};

enum WKWebsitePopUpPolicy {
    kWKWebsitePopUpPolicyDefault,
    kWKWebsitePopUpPolicyAllow,
    kWKWebsitePopUpPolicyBlock,
};

WK_EXPORT WKWebsitePoliciesRef WKWebsitePoliciesCreate();

WK_EXPORT bool WKWebsitePoliciesGetContentBlockersEnabled(WKWebsitePoliciesRef);
WK_EXPORT void WKWebsitePoliciesSetContentBlockersEnabled(WKWebsitePoliciesRef, bool);

WK_EXPORT WKDictionaryRef WKWebsitePoliciesCopyCustomHeaderFields(WKWebsitePoliciesRef) WK_C_API_DEPRECATED;
WK_EXPORT void WKWebsitePoliciesSetCustomHeaderFields(WKWebsitePoliciesRef, WKDictionaryRef) WK_C_API_DEPRECATED;

WK_EXPORT WKWebsiteAutoplayQuirk WKWebsitePoliciesGetAllowedAutoplayQuirks(WKWebsitePoliciesRef);
WK_EXPORT void WKWebsitePoliciesSetAllowedAutoplayQuirks(WKWebsitePoliciesRef, WKWebsiteAutoplayQuirk);

WK_EXPORT enum WKWebsiteAutoplayPolicy WKWebsitePoliciesGetAutoplayPolicy(WKWebsitePoliciesRef);
WK_EXPORT void WKWebsitePoliciesSetAutoplayPolicy(WKWebsitePoliciesRef, enum WKWebsiteAutoplayPolicy);

WK_EXPORT enum WKWebsitePopUpPolicy WKWebsitePoliciesGetPopUpPolicy(WKWebsitePoliciesRef);
WK_EXPORT void WKWebsitePoliciesSetPopUpPolicy(WKWebsitePoliciesRef, enum WKWebsitePopUpPolicy);

WK_EXPORT WKWebsiteDataStoreRef WKWebsitePoliciesGetDataStore(WKWebsitePoliciesRef);
WK_EXPORT void WKWebsitePoliciesSetDataStore(WKWebsitePoliciesRef, WKWebsiteDataStoreRef);

#ifdef __cplusplus
}
#endif
