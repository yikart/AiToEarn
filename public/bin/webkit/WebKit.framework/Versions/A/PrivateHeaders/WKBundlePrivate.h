/*
 * Copyright (C) 2010-2016 Apple Inc. All rights reserved.
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

#ifndef WKBundlePrivate_h
#define WKBundlePrivate_h

#include <WebKit/WKBase.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#include <JavaScriptCore/JSBase.h>
#include <WebKit/WKDeprecated.h>
#include <WebKit/WKUserContentInjectedFrames.h>
#include <WebKit/WKUserScriptInjectionTime.h>

#ifdef __cplusplus
extern "C" {
#endif

// TestRunner only SPIs.
WK_EXPORT void WKBundleAddOriginAccessAllowListEntry(WKBundleRef bundle, WKStringRef, WKStringRef, WKStringRef, bool);
WK_EXPORT void WKBundleRemoveOriginAccessAllowListEntry(WKBundleRef bundle, WKStringRef, WKStringRef, WKStringRef, bool);
WK_EXPORT void WKBundleResetOriginAccessAllowLists(WKBundleRef bundle);
WK_EXPORT int WKBundleNumberOfPages(WKBundleRef bundle, WKBundleFrameRef frameRef, double pageWidthInPixels, double pageHeightInPixels);
WK_EXPORT int WKBundlePageNumberForElementById(WKBundleRef bundle, WKBundleFrameRef frameRef, WKStringRef idRef, double pageWidthInPixels, double pageHeightInPixels);
WK_EXPORT WKStringRef WKBundlePageSizeAndMarginsInPixels(WKBundleRef bundle, WKBundleFrameRef frameRef, int, int, int, int, int, int, int);
WK_EXPORT bool WKBundleIsPageBoxVisible(WKBundleRef bundle, WKBundleFrameRef frameRef, int);
WK_EXPORT void WKBundleSetUserStyleSheetLocationForTesting(WKBundleRef bundle, WKStringRef location);
WK_EXPORT void WKBundleRemoveAllWebNotificationPermissions(WKBundleRef bundle, WKBundlePageRef page);
WK_EXPORT WKDataRef WKBundleCopyWebNotificationID(WKBundleRef bundle, JSContextRef context, JSValueRef notification);
WK_EXPORT WKDataRef WKBundleCreateWKDataFromUInt8Array(WKBundleRef bundle, JSContextRef context, JSValueRef data);
WK_EXPORT void WKBundleSetAsynchronousSpellCheckingEnabledForTesting(WKBundleRef bundleRef, bool enabled);
// Returns array of dictionaries. Dictionary keys are document identifiers, values are document URLs.
WK_EXPORT WKArrayRef WKBundleGetLiveDocumentURLsForTesting(WKBundleRef bundle, bool excludeDocumentsInPageGroupPages);

// Local storage API
WK_EXPORT void WKBundleSetDatabaseQuota(WKBundleRef bundle, uint64_t);

// Garbage collection API
WK_EXPORT void WKBundleGarbageCollectJavaScriptObjects(WKBundleRef bundle);
WK_EXPORT void WKBundleGarbageCollectJavaScriptObjectsOnAlternateThreadForDebugging(WKBundleRef bundle, bool waitUntilDone);
WK_EXPORT size_t WKBundleGetJavaScriptObjectsCount(WKBundleRef bundle);

WK_EXPORT bool WKBundleIsProcessingUserGesture(WKBundleRef bundle);

WK_EXPORT void WKBundleSetTabKeyCyclesThroughElements(WKBundleRef bundle, WKBundlePageRef page, bool enabled);

WK_EXPORT void WKBundleClearResourceLoadStatistics(WKBundleRef bundle);

typedef void (*NotifyObserverCallback)(void* functionContext);
WK_EXPORT void WKBundleResourceLoadStatisticsNotifyObserver(WKBundleRef bundle, void* context, NotifyObserverCallback callback);

WK_EXPORT void WKBundleExtendClassesForParameterCoder(WKBundleRef bundle, WKArrayRef classes);

WK_EXPORT void WKBundleReleaseMemory(WKBundleRef bundle);

#ifdef __cplusplus
}
#endif

#endif /* WKBundlePrivate_h */
