/*
 * Copyright (C) 2010-2017 Apple Inc. All rights reserved.
 * Portions Copyright (c) 2010 Motorola Mobility, Inc.  All rights reserved.
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

#ifndef WKBase_h
#define WKBase_h

#include <WebKit/WKDeclarationSpecifiers.h>
#include <stdint.h>

#include <WebKit/WKBaseMac.h>

/* WebKit2 shared types */

typedef uint32_t WKTypeID;
typedef const void* WKTypeRef;

typedef const struct OpaqueWKArray* WKArrayRef;
typedef struct OpaqueWKArray* WKMutableArrayRef;

typedef const struct OpaqueWKDictionary* WKDictionaryRef;
typedef struct OpaqueWKDictionary* WKMutableDictionaryRef;

typedef const struct OpaqueWKBoolean* WKBooleanRef;
typedef const struct OpaqueWKCertificateInfo* WKCertificateInfoRef;
typedef const struct OpaqueWKContextMenuItem* WKContextMenuItemRef;
typedef const struct OpaqueWKData* WKDataRef;
typedef const struct OpaqueWKDouble* WKDoubleRef;
typedef const struct OpaqueWKError* WKErrorRef;
typedef const struct OpaqueWKGraphicsContext* WKGraphicsContextRef;
typedef const struct OpaqueWKImage* WKImageRef;
typedef const struct OpaqueWKPointRef* WKPointRef;
typedef const struct OpaqueWKRectRef* WKRectRef;
typedef const struct OpaqueWKSecurityOrigin* WKSecurityOriginRef;
typedef const struct OpaqueWKSerializedScriptValue* WKSerializedScriptValueRef;
typedef const struct OpaqueWKSizeRef* WKSizeRef;
typedef const struct OpaqueWKString* WKStringRef;
typedef const struct OpaqueWKUInt64* WKUInt64Ref;
typedef const struct OpaqueWKURL* WKURLRef;
typedef const struct OpaqueWKURLRequest* WKURLRequestRef;
typedef const struct OpaqueWKURLResponse* WKURLResponseRef;
typedef const struct OpaqueWKUserContentURLPattern* WKUserContentURLPatternRef;
typedef const struct OpaqueWKWebArchive* WKWebArchiveRef;
typedef const struct OpaqueWKWebArchiveResource* WKWebArchiveResourceRef;

/* WebKit2 main API types */

typedef const struct OpaqueWKApplicationCacheManager* WKApplicationCacheManagerRef;
typedef const struct OpaqueWKAuthenticationChallenge* WKAuthenticationChallengeRef;
typedef const struct OpaqueWKAuthenticationDecisionListener* WKAuthenticationDecisionListenerRef;
typedef const struct OpaqueWKBackForwardList* WKBackForwardListRef;
typedef const struct OpaqueWKBackForwardListItem* WKBackForwardListItemRef;
typedef const struct OpaqueWKResourceCacheManager* WKResourceCacheManagerRef;
typedef const struct OpaqueWKCaptionUserPreferencesTestingModeToken* WKCaptionUserPreferencesTestingModeTokenRef;
typedef const struct OpaqueWKColorPickerResultListener* WKColorPickerResultListenerRef;
typedef const struct OpaqueWKContext* WKContextRef;
typedef const struct OpaqueWKContextConfiguration* WKContextConfigurationRef;
typedef const struct OpaqueWKContextMenuListener* WKContextMenuListenerRef;
typedef const struct OpaqueWKCookieManager* WKCookieManagerRef;
typedef const struct OpaqueWKCredential* WKCredentialRef;
typedef const struct OpaqueWKDownload* WKDownloadRef;
typedef const struct OpaqueWKExperimentalFeature* WKFeatureRef;
typedef const struct OpaqueWKFormSubmissionListener* WKFormSubmissionListenerRef;
typedef const struct OpaqueWKFrameHandle* WKFrameHandleRef;
typedef const struct OpaqueWKFrameInfo* WKFrameInfoRef;
typedef const struct OpaqueWKFrame* WKFrameRef;
typedef const struct OpaqueWKFramePolicyListener* WKFramePolicyListenerRef;
typedef const struct OpaqueWKGeolocationManager* WKGeolocationManagerRef;
typedef const struct OpaqueWKGeolocationPermissionRequest* WKGeolocationPermissionRequestRef;
typedef const struct OpaqueWKGeolocationPosition* WKGeolocationPositionRef;
typedef const struct OpaqueWKGrammarDetail* WKGrammarDetailRef;
typedef const struct OpaqueWKHTTPCookieStore* WKHTTPCookieStoreRef;
typedef const struct OpaqueWKHitTestResult* WKHitTestResultRef;
typedef const struct OpaqueWKIconDatabase* WKIconDatabaseRef;
typedef const struct OpaqueWKInspector* WKInspectorRef;
typedef const struct OpaqueWKInternalDebugFeature* WKInternalDebugFeatureRef;
typedef const struct OpaqueWKKeyValueStorageManager* WKKeyValueStorageManagerRef;
typedef const struct OpaqueWKMessageListener* WKMessageListenerRef;
typedef const struct OpaqueWKNavigationAction* WKNavigationActionRef;
typedef const struct OpaqueWKNavigationData* WKNavigationDataRef;
typedef const struct OpaqueWKNavigation* WKNavigationRef;
typedef const struct OpaqueWKNavigationResponse* WKNavigationResponseRef;
typedef const struct OpaqueWKNotification* WKNotificationRef;
typedef const struct OpaqueWKNotificationManager* WKNotificationManagerRef;
typedef const struct OpaqueWKNotificationPermissionRequest* WKNotificationPermissionRequestRef;
typedef const struct OpaqueWKNotificationProvider* WKNotificationProviderRef;
typedef const struct OpaqueWKOpenPanelParameters* WKOpenPanelParametersRef;
typedef const struct OpaqueWKOpenPanelResultListener* WKOpenPanelResultListenerRef;
typedef const struct OpaqueWKPage* WKPageRef;
typedef const struct OpaqueWKPageConfiguration* WKPageConfigurationRef;
typedef const struct OpaqueWKPageGroup* WKPageGroupRef;
typedef const struct OpaqueWKPreferences* WKPreferencesRef;
typedef const struct OpaqueWKProtectionSpace* WKProtectionSpaceRef;
typedef const struct OpaqueWKPageRunBeforeUnloadConfirmPanelResultListener* WKPageRunBeforeUnloadConfirmPanelResultListenerRef;
typedef const struct OpaqueWKPageRunJavaScriptAlertResultListener* WKPageRunJavaScriptAlertResultListenerRef;
typedef const struct OpaqueWKPageRunJavaScriptConfirmResultListener* WKPageRunJavaScriptConfirmResultListenerRef;
typedef const struct OpaqueWKPageRunJavaScriptPromptResultListener* WKPageRunJavaScriptPromptResultListenerRef;
typedef const struct OpaqueWKPageRequestStorageAccessConfirmResultListener* WKPageRequestStorageAccessConfirmResultListenerRef;
typedef const struct OpaqueWKResourceLoadStatisticsManager* WKResourceLoadStatisticsManagerRef;
typedef const struct OpaqueWKTextChecker* WKTextCheckerRef;
typedef const struct OpaqueWKSession* WKSessionRef;
typedef const struct OpaqueWKSessionState* WKSessionStateRef;
typedef const struct OpaqueWKUserContentController* WKUserContentControllerRef;
typedef const struct OpaqueWKUserContentExtensionStore* WKUserContentExtensionStoreRef;
typedef const struct OpaqueWKUserContentFilter* WKUserContentFilterRef;
typedef const struct OpaqueWKUserMediaPermissionCheck* WKUserMediaPermissionCheckRef;
typedef const struct OpaqueWKUserMediaPermissionRequest* WKUserMediaPermissionRequestRef;
typedef const struct OpaqueWKUserScript* WKUserScriptRef;
typedef const struct OpaqueWKViewportAttributes* WKViewportAttributesRef;
typedef const struct OpaqueWKWebsiteDataConfigurationStore* WKWebsiteDataStoreConfigurationRef;
typedef const struct OpaqueWKWebsiteDataStore* WKWebsiteDataStoreRef;
typedef const struct OpaqueWKWebsitePolicies* WKWebsitePoliciesRef;
typedef const struct OpaqueWKWindowFeatures* WKWindowFeaturesRef;
typedef const struct OpaqueWKSpeechRecognitionPermissionCallback* WKSpeechRecognitionPermissionCallbackRef;
typedef const struct OpaqueWKMediaKeySystemPermissionRequest* WKMediaKeySystemPermissionRequestRef;
typedef const struct OpaqueWKMediaKeySystemPermissionCallback* WKMediaKeySystemPermissionCallbackRef;
typedef const struct OpaqueWKQueryPermissionResultCallback* WKQueryPermissionResultCallbackRef;

/* WebKit2 Bundle types */

typedef const struct OpaqueWKBundle* WKBundleRef;
typedef const struct OpaqueWKBundleBackForwardList* WKBundleBackForwardListRef;
typedef const struct OpaqueWKBundleBackForwardListItem* WKBundleBackForwardListItemRef;
typedef const struct OpaqueWKBundleDOMCSSStyleDeclaration* WKBundleCSSStyleDeclarationRef;
typedef const struct OpaqueWKBundleDOMWindowExtension* WKBundleDOMWindowExtensionRef;
typedef const struct OpaqueWKBundleFileHandle* WKBundleFileHandleRef;
typedef const struct OpaqueWKBundleFrame* WKBundleFrameRef;
typedef const struct OpaqueWKBundleHitTestResult* WKBundleHitTestResultRef;
typedef const struct OpaqueWKBundleNavigationAction* WKBundleNavigationActionRef;
typedef const struct OpaqueWKBundleNodeHandle* WKBundleNodeHandleRef;
typedef const struct OpaqueWKBundlePage* WKBundlePageRef;
typedef const struct OpaqueWKBundlePageBanner* WKBundlePageBannerRef;
typedef const struct OpaqueWKBundlePageGroup* WKBundlePageGroupRef;
typedef const struct OpaqueWKBundlePageOverlay* WKBundlePageOverlayRef;
typedef const struct OpaqueWKBundleRangeHandle* WKBundleRangeHandleRef;
typedef const struct OpaqueWKBundleScriptWorld* WKBundleScriptWorldRef;

#endif /* WKBase_h */
