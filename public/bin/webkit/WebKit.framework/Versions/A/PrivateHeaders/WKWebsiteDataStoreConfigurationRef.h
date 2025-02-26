/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#ifndef WKWebsiteDataStoreConfigurationRef_h
#define WKWebsiteDataStoreConfigurationRef_h

#include <WebKit/WKBase.h>

#ifdef __cplusplus
extern "C" {
#endif

WK_EXPORT WKTypeID WKWebsiteDataStoreConfigurationGetTypeID();

WK_EXPORT WKWebsiteDataStoreConfigurationRef WKWebsiteDataStoreConfigurationCreate();

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyApplicationCacheDirectory(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetApplicationCacheDirectory(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef directory);

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyNetworkCacheDirectory(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetNetworkCacheDirectory(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef directory);

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyIndexedDBDatabaseDirectory(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetIndexedDBDatabaseDirectory(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef directory);

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyLocalStorageDirectory(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetLocalStorageDirectory(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef directory);

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyWebSQLDatabaseDirectory(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetWebSQLDatabaseDirectory(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef directory);

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyCacheStorageDirectory(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetCacheStorageDirectory(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef directory);

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyGeneralStorageDirectory(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetGeneralStorageDirectory(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef directory);

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyMediaKeysStorageDirectory(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetMediaKeysStorageDirectory(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef directory);

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyResourceLoadStatisticsDirectory(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetResourceLoadStatisticsDirectory(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef directory);

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyServiceWorkerRegistrationDirectory(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetServiceWorkerRegistrationDirectory(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef directory);

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyCookieStorageFile(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetCookieStorageFile(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef cookieStorageFile);

WK_EXPORT uint64_t WKWebsiteDataStoreConfigurationGetPerOriginStorageQuota(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetPerOriginStorageQuota(WKWebsiteDataStoreConfigurationRef configuration, uint64_t quota);

WK_EXPORT bool WKWebsiteDataStoreConfigurationGetNetworkCacheSpeculativeValidationEnabled(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetNetworkCacheSpeculativeValidationEnabled(WKWebsiteDataStoreConfigurationRef configuration, bool enabled);

WK_EXPORT bool WKWebsiteDataStoreConfigurationGetTestingSessionEnabled(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetTestingSessionEnabled(WKWebsiteDataStoreConfigurationRef configuration, bool enabled);

WK_EXPORT bool WKWebsiteDataStoreConfigurationGetStaleWhileRevalidateEnabled(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetStaleWhileRevalidateEnabled(WKWebsiteDataStoreConfigurationRef configuration, bool enabled);

WK_EXPORT WKStringRef WKWebsiteDataStoreConfigurationCopyPCMMachServiceName(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationSetPCMMachServiceName(WKWebsiteDataStoreConfigurationRef configuration, WKStringRef name);

WK_EXPORT bool WKWebsiteDataStoreConfigurationHasOriginQuotaRatio(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationClearOriginQuotaRatio(WKWebsiteDataStoreConfigurationRef configuration);

WK_EXPORT bool WKWebsiteDataStoreConfigurationHasTotalQuotaRatio(WKWebsiteDataStoreConfigurationRef configuration);
WK_EXPORT void WKWebsiteDataStoreConfigurationClearTotalQuotaRatio(WKWebsiteDataStoreConfigurationRef configuration);

#ifdef __cplusplus
}
#endif

#endif /* WKWebsiteDataStoreConfigurationRef_h */
