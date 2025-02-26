/*
 * Copyright (C) 2010-2022 Apple Inc. All rights reserved.
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

#ifndef WKPreferencesRef_h
#define WKPreferencesRef_h

#include <WebKit/WKBase.h>
#include <WebKit/WKDeprecated.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

enum WKStorageBlockingPolicy {
    kWKAllowAllStorage = 0,
    kWKBlockThirdPartyStorage,
    kWKBlockAllStorage
};
typedef enum WKStorageBlockingPolicy WKStorageBlockingPolicy;

enum WKDebugOverlayRegionFlags {
    kWKNonFastScrollableRegion = 1 << 0,
    kWKWheelEventHandlerRegion = 1 << 1,
    kWKTouchActionRegion = 1 << 2,
    kWKEditableElementRegion = 1 << 3,
};
typedef unsigned WKDebugOverlayRegions;

enum _WKUserInterfaceDirectionPolicy {
    kWKUserInterfaceDirectionPolicyContent,
    kWKUserInterfaceDirectionPolicySystem,
};
typedef enum _WKUserInterfaceDirectionPolicy _WKUserInterfaceDirectionPolicy;

WK_EXPORT WKTypeID WKPreferencesGetTypeID(void);

WK_EXPORT WKPreferencesRef WKPreferencesCreate(void);
WK_EXPORT WKPreferencesRef WKPreferencesCreateWithIdentifier(WKStringRef identifier);

// Defaults to true.
WK_EXPORT void WKPreferencesSetJavaScriptEnabled(WKPreferencesRef preferences, bool javaScriptEnabled);
WK_EXPORT bool WKPreferencesGetJavaScriptEnabled(WKPreferencesRef preferences);

// Defaults to true.
WK_EXPORT void WKPreferencesSetJavaScriptMarkupEnabled(WKPreferencesRef preferences, bool javaScriptEnabled);
WK_EXPORT bool WKPreferencesGetJavaScriptMarkupEnabled(WKPreferencesRef preferences);

// Defaults to true.
WK_EXPORT void WKPreferencesSetLoadsImagesAutomatically(WKPreferencesRef preferences, bool loadsImagesAutomatically);
WK_EXPORT bool WKPreferencesGetLoadsImagesAutomatically(WKPreferencesRef preferences);

// Obsolete: Defaults to false.
WK_EXPORT void WKPreferencesSetLoadsSiteIconsIgnoringImageLoadingPreference(WKPreferencesRef preferences, bool loadsSiteIconsIgnoringImageLoadingPreference);
WK_EXPORT bool WKPreferencesGetLoadsSiteIconsIgnoringImageLoadingPreference(WKPreferencesRef preferences);

// Defaults to true.
WK_EXPORT void WKPreferencesSetLocalStorageEnabled(WKPreferencesRef preferences, bool localStorageEnabled);
WK_EXPORT bool WKPreferencesGetLocalStorageEnabled(WKPreferencesRef preferences);

// Defaults to true.
WK_EXPORT void WKPreferencesSetDatabasesEnabled(WKPreferencesRef preferences, bool databasesEnabled);
WK_EXPORT bool WKPreferencesGetDatabasesEnabled(WKPreferencesRef preferences);

// Defaults to true.
WK_EXPORT void WKPreferencesSetJavaScriptCanOpenWindowsAutomatically(WKPreferencesRef preferences, bool javaScriptCanOpenWindowsAutomatically);
WK_EXPORT bool WKPreferencesGetJavaScriptCanOpenWindowsAutomatically(WKPreferencesRef preferences);

// Defaults to true.
WK_EXPORT void WKPreferencesSetHyperlinkAuditingEnabled(WKPreferencesRef preferences, bool hyperlinkAuditingEnabled);
WK_EXPORT bool WKPreferencesGetHyperlinkAuditingEnabled(WKPreferencesRef preferences);

WK_EXPORT void WKPreferencesSetStandardFontFamily(WKPreferencesRef preferencesRef, WKStringRef family);
WK_EXPORT WKStringRef WKPreferencesCopyStandardFontFamily(WKPreferencesRef preferencesRef);

WK_EXPORT void WKPreferencesSetFixedFontFamily(WKPreferencesRef preferencesRef, WKStringRef family);
WK_EXPORT WKStringRef WKPreferencesCopyFixedFontFamily(WKPreferencesRef preferencesRef);

WK_EXPORT void WKPreferencesSetSerifFontFamily(WKPreferencesRef preferencesRef, WKStringRef family);
WK_EXPORT WKStringRef WKPreferencesCopySerifFontFamily(WKPreferencesRef preferencesRef);

WK_EXPORT void WKPreferencesSetSansSerifFontFamily(WKPreferencesRef preferencesRef, WKStringRef family);
WK_EXPORT WKStringRef WKPreferencesCopySansSerifFontFamily(WKPreferencesRef preferencesRef);

WK_EXPORT void WKPreferencesSetCursiveFontFamily(WKPreferencesRef preferencesRef, WKStringRef family);
WK_EXPORT WKStringRef WKPreferencesCopyCursiveFontFamily(WKPreferencesRef preferencesRef);

WK_EXPORT void WKPreferencesSetFantasyFontFamily(WKPreferencesRef preferencesRef, WKStringRef family);
WK_EXPORT WKStringRef WKPreferencesCopyFantasyFontFamily(WKPreferencesRef preferencesRef);

WK_EXPORT void WKPreferencesSetPictographFontFamily(WKPreferencesRef preferencesRef, WKStringRef family);
WK_EXPORT WKStringRef WKPreferencesCopyPictographFontFamily(WKPreferencesRef preferencesRef);

// Defaults to 16.
WK_EXPORT void WKPreferencesSetDefaultFontSize(WKPreferencesRef preferencesRef, uint32_t);
WK_EXPORT uint32_t WKPreferencesGetDefaultFontSize(WKPreferencesRef preferencesRef);

// Defaults to 13.
WK_EXPORT void WKPreferencesSetDefaultFixedFontSize(WKPreferencesRef preferencesRef, uint32_t);
WK_EXPORT uint32_t WKPreferencesGetDefaultFixedFontSize(WKPreferencesRef preferencesRef);

// Defaults to 0.
WK_EXPORT void WKPreferencesSetMinimumFontSize(WKPreferencesRef preferencesRef, uint32_t);
WK_EXPORT uint32_t WKPreferencesGetMinimumFontSize(WKPreferencesRef preferencesRef);

WK_EXPORT void WKPreferencesSetDefaultTextEncodingName(WKPreferencesRef preferencesRef, WKStringRef name);
WK_EXPORT WKStringRef WKPreferencesCopyDefaultTextEncodingName(WKPreferencesRef preferencesRef);

// Defaults to false.
WK_EXPORT void WKPreferencesSetDeveloperExtrasEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetDeveloperExtrasEnabled(WKPreferencesRef preferencesRef);

// Defaults to true.
WK_EXPORT void WKPreferencesSetTextAreasAreResizable(WKPreferencesRef preferencesRef, bool resizable);
WK_EXPORT bool WKPreferencesGetTextAreasAreResizable(WKPreferencesRef preferencesRef);

// Defaults to false.
WK_EXPORT void WKPreferencesSetTabsToLinks(WKPreferencesRef preferences, bool tabsToLinks);
WK_EXPORT bool WKPreferencesGetTabsToLinks(WKPreferencesRef preferences);

// Defaults to false.
WK_EXPORT void WKPreferencesSetDNSPrefetchingEnabled(WKPreferencesRef preferences, bool enabled);
WK_EXPORT bool WKPreferencesGetDNSPrefetchingEnabled(WKPreferencesRef preferences);

// Defaults to true.
WK_EXPORT void WKPreferencesSetAuthorAndUserStylesEnabled(WKPreferencesRef preferences, bool enabled);
WK_EXPORT bool WKPreferencesGetAuthorAndUserStylesEnabled(WKPreferencesRef preferences);

// Defaults to false.
WK_EXPORT void WKPreferencesSetShouldPrintBackgrounds(WKPreferencesRef preferences, bool shouldPrintBackgrounds);
WK_EXPORT bool WKPreferencesGetShouldPrintBackgrounds(WKPreferencesRef preferences);

// Defaults to false.
WK_EXPORT void WKPreferencesSetJavaScriptCanAccessClipboard(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetJavaScriptCanAccessClipboard(WKPreferencesRef preferencesRef);

// Defaults to false
WK_EXPORT void WKPreferencesSetFullScreenEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetFullScreenEnabled(WKPreferencesRef preferencesRef);

// Defaults to true.
WK_EXPORT void WKPreferencesSetAVFoundationEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetAVFoundationEnabled(WKPreferencesRef preferencesRef);

// Defaults to false
WK_EXPORT void WKPreferencesSetWebAudioEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetWebAudioEnabled(WKPreferencesRef preferencesRef);
    
// Defaults to false
WK_EXPORT void WKPreferencesSetSuppressesIncrementalRendering(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetSuppressesIncrementalRendering(WKPreferencesRef preferencesRef);

// Defaults to true
WK_EXPORT void WKPreferencesSetBackspaceKeyNavigationEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetBackspaceKeyNavigationEnabled(WKPreferencesRef preferencesRef);

// Defaults to false
WK_EXPORT void WKPreferencesSetCaretBrowsingEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetCaretBrowsingEnabled(WKPreferencesRef preferencesRef);

// Defaults to false
WK_EXPORT void WKPreferencesSetShouldDisplaySubtitles(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetShouldDisplaySubtitles(WKPreferencesRef preferencesRef);

// Defaults to false
WK_EXPORT void WKPreferencesSetShouldDisplayCaptions(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetShouldDisplayCaptions(WKPreferencesRef preferencesRef);

// Defaults to false
WK_EXPORT void WKPreferencesSetShouldDisplayTextDescriptions(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetShouldDisplayTextDescriptions(WKPreferencesRef preferencesRef);

// Defaults to false
WK_EXPORT void WKPreferencesSetNotificationsEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetNotificationsEnabled(WKPreferencesRef preferencesRef);

// Defaults to false
WK_EXPORT void WKPreferencesSetShouldRespectImageOrientation(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetShouldRespectImageOrientation(WKPreferencesRef preferencesRef);

// Defaults to kWKAllowAllStorage 
WK_EXPORT void WKPreferencesSetStorageBlockingPolicy(WKPreferencesRef preferencesRef, WKStorageBlockingPolicy policy);
WK_EXPORT WKStorageBlockingPolicy WKPreferencesGetStorageBlockingPolicy(WKPreferencesRef preferencesRef);

// Defaults to false.
WK_EXPORT void WKPreferencesSetEncodingDetectorEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetEncodingDetectorEnabled(WKPreferencesRef preferencesRef);

// Defaults to false.
WK_EXPORT void WKPreferencesSetTextAutosizingEnabled(WKPreferencesRef preferences, bool textAutosizingEnabled);
WK_EXPORT bool WKPreferencesGetTextAutosizingEnabled(WKPreferencesRef preferences);

// Defaults to false.
WK_EXPORT void WKPreferencesSetTextAutosizingUsesIdempotentMode(WKPreferencesRef preferences, bool textAutosizingUsesIdempotentModeEnabled);
WK_EXPORT bool WKPreferencesGetTextAutosizingUsesIdempotentMode(WKPreferencesRef preferences);

// Defaults to true.
WK_EXPORT void WKPreferencesSetQTKitEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetQTKitEnabled(WKPreferencesRef preferencesRef);

// Defaults to false
WK_EXPORT void WKPreferencesSetAsynchronousSpellCheckingEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetAsynchronousSpellCheckingEnabled(WKPreferencesRef preferencesRef);

// Defaults to true
WK_EXPORT void WKPreferencesSetMediaStreamEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetMediaStreamEnabled(WKPreferencesRef preferencesRef);

// Defaults to false
WK_EXPORT void WKPreferencesSetMediaDevicesEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetMediaDevicesEnabled(WKPreferencesRef preferencesRef);

// Defaults to true
WK_EXPORT void WKPreferencesSetPeerConnectionEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetPeerConnectionEnabled(WKPreferencesRef preferencesRef);

// Defaults to false.
WK_EXPORT void WKPreferencesSetSpatialNavigationEnabled(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetSpatialNavigationEnabled(WKPreferencesRef preferencesRef);

// Defaults to 0.
WK_EXPORT void WKPreferencesSetVisibleDebugOverlayRegions(WKPreferencesRef preferencesRef, WKDebugOverlayRegions enabled);
WK_EXPORT WKDebugOverlayRegions WKPreferencesGetVisibleDebugOverlayRegions(WKPreferencesRef preferencesRef);

// Defaults to false.
WK_EXPORT void WKPreferencesSetIgnoreViewportScalingConstraints(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetIgnoreViewportScalingConstraints(WKPreferencesRef preferencesRef);

// Defaults to true.
WK_EXPORT void WKPreferencesSetAllowsAirPlayForMediaPlayback(WKPreferencesRef preferencesRef, bool enabled);
WK_EXPORT bool WKPreferencesGetAllowsAirPlayForMediaPlayback(WKPreferencesRef preferencesRef);

// Defaults to kWKUserInterfaceDirectionPolicyContent.
WK_EXPORT void WKPreferencesSetUserInterfaceDirectionPolicy(WKPreferencesRef preferencesRef, _WKUserInterfaceDirectionPolicy userInterfaceDirectionPolicy);
WK_EXPORT _WKUserInterfaceDirectionPolicy WKPreferencesGetUserInterfaceDirectionPolicy(WKPreferencesRef preferencesRef);

// Defaults to false.
WK_EXPORT bool WKPreferencesGetApplePayEnabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetApplePayEnabled(WKPreferencesRef preferencesRef, bool enabled);

// Defaults to false.
WK_EXPORT bool WKPreferencesGetCSSTransformStyleSeparatedEnabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetCSSTransformStyleSeparatedEnabled(WKPreferencesRef preferencesRef, bool enabled);

// Defaults to true.
WK_EXPORT bool WKPreferencesGetApplePayCapabilityDisclosureAllowed(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetApplePayCapabilityDisclosureAllowed(WKPreferencesRef preferencesRef, bool allowed);

// Defaults to true.
WK_EXPORT bool WKPreferencesGetLegacyEncryptedMediaAPIEnabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetLegacyEncryptedMediaAPIEnabled(WKPreferencesRef preferencesRef, bool enabled);

// Defaults to true.
WK_EXPORT bool WKPreferencesGetAllowMediaContentTypesRequiringHardwareSupportAsFallback(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetAllowMediaContentTypesRequiringHardwareSupportAsFallback(WKPreferencesRef preferencesRef, bool allow);

WK_EXPORT bool WKPreferencesGetMediaCapabilitiesEnabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetMediaCapabilitiesEnabled(WKPreferencesRef preferencesRef, bool enabled);

// Defaults to false.
WK_EXPORT bool WKPreferencesGetRestrictedHTTPResponseAccess(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetRestrictedHTTPResponseAccess(WKPreferencesRef preferencesRef, bool allow);

// Defaults to false.
WK_EXPORT bool WKPreferencesGetProcessSwapOnNavigationEnabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetProcessSwapOnNavigationEnabled(WKPreferencesRef preferencesRef, bool enabled);

// Obsolete. Always returns true.
WK_EXPORT bool WKPreferencesGetWebSQLDisabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetWebSQLDisabled(WKPreferencesRef preferencesRef, bool enabled);

WK_EXPORT void WKPreferencesSetCaptureAudioInUIProcessEnabled(WKPreferencesRef preferencesRef, bool flag);
WK_EXPORT bool WKPreferencesGetCaptureAudioInUIProcessEnabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetCaptureAudioInGPUProcessEnabled(WKPreferencesRef preferencesRef, bool flag);
WK_EXPORT bool WKPreferencesGetCaptureAudioInGPUProcessEnabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetCaptureVideoInUIProcessEnabled(WKPreferencesRef preferencesRef, bool flag);
WK_EXPORT bool WKPreferencesGetCaptureVideoInUIProcessEnabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetCaptureVideoInGPUProcessEnabled(WKPreferencesRef preferencesRef, bool flag);
WK_EXPORT bool WKPreferencesGetCaptureVideoInGPUProcessEnabled(WKPreferencesRef preferencesRef);

WK_EXPORT bool WKPreferencesGetVP9DecoderEnabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetVP9DecoderEnabled(WKPreferencesRef preferencesRef, bool enabled);

// Defaults to false.
WK_EXPORT bool WKPreferencesGetRemotePlaybackEnabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetRemotePlaybackEnabled(WKPreferencesRef preferencesRef, bool enabled);

// Defaults to false.
WK_EXPORT bool WKPreferencesGetShouldUseServiceWorkerShortTimeout(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetShouldUseServiceWorkerShortTimeout(WKPreferencesRef preferencesRef, bool enabled);

// Defaults to false.
WK_EXPORT bool WKPreferencesGetRequestVideoFrameCallbackEnabled(WKPreferencesRef preferencesRef);
WK_EXPORT void WKPreferencesSetRequestVideoFrameCallbackEnabled(WKPreferencesRef preferencesRef, bool enabled);


// The following are all deprecated and do nothing. They should be removed when possible.

WK_EXPORT void WKPreferencesSetOfflineWebApplicationCacheEnabled(WKPreferencesRef, bool) WK_C_API_DEPRECATED;
WK_EXPORT bool WKPreferencesGetOfflineWebApplicationCacheEnabled(WKPreferencesRef) WK_C_API_DEPRECATED;
WK_EXPORT void WKPreferencesSetXSSAuditorEnabled(WKPreferencesRef, bool) WK_C_API_DEPRECATED;
WK_EXPORT bool WKPreferencesGetXSSAuditorEnabled(WKPreferencesRef) WK_C_API_DEPRECATED;
WK_EXPORT void WKPreferencesSetPluginsEnabled(WKPreferencesRef, bool) WK_C_API_DEPRECATED;
WK_EXPORT bool WKPreferencesGetPluginsEnabled(WKPreferencesRef) WK_C_API_DEPRECATED;
WK_EXPORT void WKPreferencesSetJavaEnabled(WKPreferencesRef, bool) WK_C_API_DEPRECATED;
WK_EXPORT bool WKPreferencesGetJavaEnabled(WKPreferencesRef) WK_C_API_DEPRECATED;
WK_EXPORT void WKPreferencesSetPrivateBrowsingEnabled(WKPreferencesRef, bool) WK_C_API_DEPRECATED;
WK_EXPORT bool WKPreferencesGetPrivateBrowsingEnabled(WKPreferencesRef) WK_C_API_DEPRECATED;
WK_EXPORT void WKPreferencesSetAVFoundationNSURLSessionEnabled(WKPreferencesRef, bool) WK_C_API_DEPRECATED;
WK_EXPORT bool WKPreferencesGetAVFoundationNSURLSessionEnabled(WKPreferencesRef) WK_C_API_DEPRECATED;
WK_EXPORT bool WKPreferencesGetCrossOriginResourcePolicyEnabled(WKPreferencesRef) WK_C_API_DEPRECATED;
WK_EXPORT void WKPreferencesSetCrossOriginResourcePolicyEnabled(WKPreferencesRef, bool) WK_C_API_DEPRECATED;
WK_EXPORT void WKPreferencesSetPlugInSnapshottingEnabled(WKPreferencesRef, bool) WK_C_API_DEPRECATED;
WK_EXPORT bool WKPreferencesGetPlugInSnapshottingEnabled(WKPreferencesRef) WK_C_API_DEPRECATED;

#ifdef __cplusplus
}
#endif

#endif /* WKPreferencesRef_h */
