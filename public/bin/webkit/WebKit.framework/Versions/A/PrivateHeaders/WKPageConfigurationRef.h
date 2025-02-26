/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#ifndef WKPageConfigurationRef_h
#define WKPageConfigurationRef_h

#include <WebKit/WKBase.h>
#include <WebKit/WKDeprecated.h>

#ifdef __cplusplus
extern "C" {
#endif

WK_EXPORT WKTypeID WKPageConfigurationGetTypeID(void);

WK_EXPORT WKPageConfigurationRef WKPageConfigurationCreate(void);

WK_EXPORT WKContextRef WKPageConfigurationGetContext(WKPageConfigurationRef configuration);
WK_EXPORT void WKPageConfigurationSetContext(WKPageConfigurationRef configuration, WKContextRef context);

WK_EXPORT WKPageGroupRef WKPageConfigurationGetPageGroup(WKPageConfigurationRef configuration) WK_C_API_DEPRECATED;
WK_EXPORT void WKPageConfigurationSetPageGroup(WKPageConfigurationRef configuration, WKPageGroupRef pageGroup) WK_C_API_DEPRECATED;

WK_EXPORT WKUserContentControllerRef WKPageConfigurationGetUserContentController(WKPageConfigurationRef configuration);
WK_EXPORT void WKPageConfigurationSetUserContentController(WKPageConfigurationRef configuration, WKUserContentControllerRef userContentController);

WK_EXPORT WKPreferencesRef WKPageConfigurationGetPreferences(WKPageConfigurationRef configuration);
WK_EXPORT void WKPageConfigurationSetPreferences(WKPageConfigurationRef configuration, WKPreferencesRef preferences);

WK_EXPORT WKPageRef WKPageConfigurationGetRelatedPage(WKPageConfigurationRef configuration) WK_C_API_DEPRECATED;
WK_EXPORT void WKPageConfigurationSetRelatedPage(WKPageConfigurationRef configuration, WKPageRef relatedPage) WK_C_API_DEPRECATED;

WK_EXPORT WKWebsiteDataStoreRef WKPageConfigurationGetWebsiteDataStore(WKPageConfigurationRef configuration);
WK_EXPORT void WKPageConfigurationSetWebsiteDataStore(WKPageConfigurationRef configuration, WKWebsiteDataStoreRef websiteDataStore);

WK_EXPORT void WKPageConfigurationSetInitialCapitalizationEnabled(WKPageConfigurationRef configuration, bool enabled);
WK_EXPORT void WKPageConfigurationSetBackgroundCPULimit(WKPageConfigurationRef configuration, double cpuLimit); // Terminates process if it uses more than CPU limit over an extended period of time while in the background.

WK_EXPORT void WKPageConfigurationSetAllowTestOnlyIPC(WKPageConfigurationRef configuration, bool allowTestOnlyIPC);

WK_EXPORT void WKPageConfigurationSetPortsForUpgradingInsecureSchemeForTesting(WKPageConfigurationRef configuration, uint16_t upgradeFromInsecurePort, uint16_t upgradeToSecurePort);

#ifdef __cplusplus
}
#endif

#endif // WKPageConfigurationRef_h
