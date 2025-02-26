/*
 * Copyright (C) 2013-2018 Apple Inc. All rights reserved.
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
#include <WebKit/WKEvent.h>
#include <WebKit/WKGeometry.h>
#include <WebKit/WKNativeEvent.h>

#ifdef __cplusplus
extern "C" {
#endif

enum {
    kWKFocusDirectionBackward = 0,
    kWKFocusDirectionForward = 1
};
typedef uint32_t WKFocusDirection;

enum {
    kWKPluginUnavailabilityReasonPluginMissing,
    kWKPluginUnavailabilityReasonPluginCrashed,
    kWKPluginUnavailabilityReasonInsecurePluginVersion
};
typedef uint32_t WKPluginUnavailabilityReason;

enum {
    kWKAutoplayEventDidPreventFromAutoplaying,
    kWKAutoplayEventDidPlayMediaWithUserGesture,
    kWKAutoplayEventDidAutoplayMediaPastThresholdWithoutUserInterference,
    kWKAutoplayEventUserDidInterfereWithPlayback,
};
typedef uint32_t WKAutoplayEvent;

enum {
    kWKAutoplayEventFlagsNone = 0,
    kWKAutoplayEventFlagsHasAudio = 1 << 0,
    kWKAutoplayEventFlagsPlaybackWasPrevented = 1 << 1,
    kWKAutoplayEventFlagsMediaIsMainContent = 1 << 2,
};
typedef uint32_t WKAutoplayEventFlags;

enum {
    kWKResourceLimitMemory,
    kWKResourceLimitCPU,
};
typedef uint32_t WKResourceLimit;

enum {
    kWKScreenOrientationTypePortraitPrimary,
    kWKScreenOrientationTypePortraitSecondary,
    kWKScreenOrientationTypeLandscapePrimary,
    kWKScreenOrientationTypeLandscapeSecondary,
};
typedef uint32_t WKScreenOrientationType;

WK_EXPORT WKTypeID WKPageRunBeforeUnloadConfirmPanelResultListenerGetTypeID(void);
WK_EXPORT void WKPageRunBeforeUnloadConfirmPanelResultListenerCall(WKPageRunBeforeUnloadConfirmPanelResultListenerRef listener, bool result);

WK_EXPORT WKTypeID WKPageRunJavaScriptAlertResultListenerGetTypeID(void);
WK_EXPORT void WKPageRunJavaScriptAlertResultListenerCall(WKPageRunJavaScriptAlertResultListenerRef listener);

WK_EXPORT WKTypeID WKPageRunJavaScriptConfirmResultListenerGetTypeID(void);
WK_EXPORT void WKPageRunJavaScriptConfirmResultListenerCall(WKPageRunJavaScriptConfirmResultListenerRef listener, bool result);

WK_EXPORT WKTypeID WKPageRunJavaScriptPromptResultListenerGetTypeID(void);
WK_EXPORT void WKPageRunJavaScriptPromptResultListenerCall(WKPageRunJavaScriptPromptResultListenerRef listener, WKStringRef result);

WK_EXPORT WKTypeID WKPageRequestStorageAccessConfirmResultListenerGetTypeID(void);
WK_EXPORT void WKPageRequestStorageAccessConfirmResultListenerCall(WKPageRequestStorageAccessConfirmResultListenerRef listener, bool result);
    
typedef void (*WKPageUIClientCallback)(WKPageRef page, const void* clientInfo);
typedef WKPageRef (*WKPageCreateNewPageCallback)(WKPageRef page, WKPageConfigurationRef configuration, WKNavigationActionRef navigationAction, WKWindowFeaturesRef windowFeatures, const void *clientInfo);
typedef void (*WKPageRunBeforeUnloadConfirmPanelCallback)(WKPageRef page, WKStringRef message, WKFrameRef frame, WKPageRunBeforeUnloadConfirmPanelResultListenerRef listener, const void *clientInfo);
typedef void (*WKPageRunJavaScriptAlertCallback)(WKPageRef page, WKStringRef alertText, WKFrameRef frame, WKSecurityOriginRef securityOrigin, WKPageRunJavaScriptAlertResultListenerRef listener, const void *clientInfo);
typedef void (*WKPageRunJavaScriptConfirmCallback)(WKPageRef page, WKStringRef message, WKFrameRef frame, WKSecurityOriginRef securityOrigin, WKPageRunJavaScriptConfirmResultListenerRef listener, const void *clientInfo);
typedef void (*WKPageRunJavaScriptPromptCallback)(WKPageRef page, WKStringRef message, WKStringRef defaultValue, WKFrameRef frame, WKSecurityOriginRef securityOrigin, WKPageRunJavaScriptPromptResultListenerRef listener, const void *clientInfo);
typedef void (*WKPageHandleJavaScriptDialogCallback)(WKPageRef page, bool accept, WKStringRef value, const void *clientInfo);
typedef void (*WKPageRequestStorageAccessConfirmCallback)(WKPageRef page, WKFrameRef frame, WKStringRef requestingDomain, WKStringRef currentDomain, WKPageRequestStorageAccessConfirmResultListenerRef listener, const void *clientInfo);
typedef void (*WKPageTakeFocusCallback)(WKPageRef page, WKFocusDirection direction, const void *clientInfo);
typedef void (*WKPageFocusCallback)(WKPageRef page, const void *clientInfo);
typedef void (*WKPageUnfocusCallback)(WKPageRef page, const void *clientInfo);
typedef void (*WKPageSetStatusTextCallback)(WKPageRef page, WKStringRef text, const void *clientInfo);
typedef void (*WKPageMouseDidMoveOverElementCallback)(WKPageRef page, WKHitTestResultRef hitTestResult, WKEventModifiers modifiers, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidNotHandleKeyEventCallback)(WKPageRef page, WKNativeEventPtr event, const void *clientInfo);
typedef void (*WKPageDidNotHandleWheelEventCallback)(WKPageRef page, WKNativeEventPtr event, const void *clientInfo);
typedef bool (*WKPageGetToolbarsAreVisibleCallback)(WKPageRef page, const void *clientInfo);
typedef void (*WKPageSetToolbarsAreVisibleCallback)(WKPageRef page, bool toolbarsVisible, const void *clientInfo);
typedef bool (*WKPageGetMenuBarIsVisibleCallback)(WKPageRef page, const void *clientInfo);
typedef void (*WKPageSetMenuBarIsVisibleCallback)(WKPageRef page, bool menuBarVisible, const void *clientInfo);
typedef bool (*WKPageGetStatusBarIsVisibleCallback)(WKPageRef page, const void *clientInfo);
typedef void (*WKPageSetStatusBarIsVisibleCallback)(WKPageRef page, bool statusBarVisible, const void *clientInfo);
typedef bool (*WKPageGetIsResizableCallback)(WKPageRef page, const void *clientInfo);
typedef void (*WKPageSetIsResizableCallback)(WKPageRef page, bool resizable, const void *clientInfo);
typedef WKRect (*WKPageGetWindowFrameCallback)(WKPageRef page, const void *clientInfo);
typedef void (*WKPageSetWindowFrameCallback)(WKPageRef page, WKRect frame, const void *clientInfo);
typedef unsigned long long (*WKPageExceededDatabaseQuotaCallback)(WKPageRef page, WKFrameRef frame, WKSecurityOriginRef origin, WKStringRef databaseName, WKStringRef displayName, unsigned long long currentQuota, unsigned long long currentOriginUsage, unsigned long long currentDatabaseUsage, unsigned long long expectedUsage, const void *clientInfo);
typedef void (*WKPageRunOpenPanelCallback)(WKPageRef page, WKFrameRef frame, WKOpenPanelParametersRef parameters, WKOpenPanelResultListenerRef listener, const void *clientInfo);
typedef void (*WKPageDecidePolicyForGeolocationPermissionRequestCallback)(WKPageRef page, WKFrameRef frame, WKSecurityOriginRef origin, WKGeolocationPermissionRequestRef permissionRequest, const void* clientInfo);
typedef float (*WKPageHeaderHeightCallback)(WKPageRef page, WKFrameRef frame, const void* clientInfo);
typedef float (*WKPageFooterHeightCallback)(WKPageRef page, WKFrameRef frame, const void* clientInfo);
typedef void (*WKPageDrawHeaderCallback)(WKPageRef page, WKFrameRef frame, WKRect rect, const void* clientInfo);
typedef void (*WKPageDrawFooterCallback)(WKPageRef page, WKFrameRef frame, WKRect rect, const void* clientInfo);
typedef void (*WKPagePrintFrameCallback)(WKPageRef page, WKFrameRef frame, const void* clientInfo);
typedef void (*WKPageSaveDataToFileInDownloadsFolderCallback)(WKPageRef page, WKStringRef suggestedFilename, WKStringRef mimeType, WKURLRef originatingURL, WKDataRef data, const void* clientInfo);
typedef void (*WKPageDecidePolicyForNotificationPermissionRequestCallback)(WKPageRef page, WKSecurityOriginRef origin, WKNotificationPermissionRequestRef permissionRequest, const void *clientInfo);
typedef void (*WKPageShowColorPickerCallback)(WKPageRef page, WKStringRef initialColor, WKColorPickerResultListenerRef listener, const void* clientInfo);
typedef void (*WKPageHideColorPickerCallback)(WKPageRef page, const void* clientInfo);
typedef void (*WKPageUnavailablePluginButtonClickedCallback)(WKPageRef page, WKPluginUnavailabilityReason pluginUnavailabilityReason, WKDictionaryRef pluginInfoDictionary, const void* clientInfo);
typedef void (*WKPagePinnedStateDidChangeCallback)(WKPageRef page, const void* clientInfo);
typedef void (*WKPageIsPlayingAudioDidChangeCallback)(WKPageRef page, const void* clientInfo);
typedef void (*WKPageDecidePolicyForUserMediaPermissionRequestCallback)(WKPageRef page, WKFrameRef frame, WKSecurityOriginRef userMediaDocumentOrigin, WKSecurityOriginRef topLevelDocumentOrigin, WKUserMediaPermissionRequestRef permissionRequest, const void* clientInfo);
typedef void (*WKCheckUserMediaPermissionCallback)(WKPageRef page, WKFrameRef frame, WKSecurityOriginRef userMediaDocumentOrigin, WKSecurityOriginRef topLevelDocumentOrigin, WKUserMediaPermissionCheckRef devicesRequest, const void *clientInfo);
typedef void (*WKPageDidClickAutoFillButtonCallback)(WKPageRef page, WKTypeRef userData, const void *clientInfo);
typedef void (*WKHandleAutoplayEventCallback)(WKPageRef page, WKAutoplayEvent event, WKAutoplayEventFlags flags, const void* clientInfo);
typedef void (*WKFullscreenMayReturnToInlineCallback)(WKPageRef page, const void* clientInfo);
typedef void (*WKRequestPointerLockCallback)(WKPageRef page, const void* clientInfo);
typedef void (*WKDidLosePointerLockCallback)(WKPageRef page, const void* clientInfo);
typedef void (*WKHasVideoInPictureInPictureDidChangeCallback)(WKPageRef page, bool hasVideoInPictureInPicture, const void* clientInfo);
typedef void (*WKPageDidResignInputElementStrongPasswordAppearanceCallback)(WKPageRef page, WKTypeRef userData, const void *clientInfo);
typedef bool (*WKPageShouldAllowDeviceOrientationAndMotionAccessCallback)(WKPageRef page, WKSecurityOriginRef securityOrigin, WKFrameInfoRef frame, const void *clientInfo);

typedef void (*WKPageRunWebAuthenticationPanelCallback)(void);
typedef void (*WKPageDecidePolicyForSpeechRecognitionPermissionRequestCallback)(WKPageRef page, WKSecurityOriginRef topOrigin, WKSpeechRecognitionPermissionCallbackRef callback);

typedef void (*WKPageDecidePolicyForMediaKeySystemPermissionRequestCallback)(WKPageRef page, WKSecurityOriginRef topOrigin, WKStringRef keySystem, WKMediaKeySystemPermissionCallbackRef callback);
typedef void (*WKQueryPermissionCallback)(WKStringRef permissionName, WKSecurityOriginRef topOrigin, WKQueryPermissionResultCallbackRef callback);
typedef void(*WKLockScreenOrientationCallback)(WKPageRef page, WKScreenOrientationType orientation);
typedef void(*WKUnlockScreenOrientationCallback)(WKPageRef page);

// Deprecated
typedef WKPageRef (*WKPageCreateNewPageCallback_deprecatedForUseWithV0)(WKPageRef page, WKDictionaryRef features, WKEventModifiers modifiers, WKEventMouseButton mouseButton, const void* clientInfo);
typedef void      (*WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0)(WKPageRef page, WKEventModifiers modifiers, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0)(WKPageRef page, WKStringRef mimeType, WKStringRef url, WKStringRef pluginsPageURL, const void* clientInfo);
typedef void (*WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1)(WKPageRef page, WKPluginUnavailabilityReason pluginUnavailabilityReason, WKStringRef mimeType, WKStringRef url, WKStringRef pluginsPageURL, const void* clientInfo);
typedef void (*WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0)(WKPageRef page, WKStringRef alertText, WKFrameRef frame, const void *clientInfo);
typedef bool (*WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0)(WKPageRef page, WKStringRef message, WKFrameRef frame, const void *clientInfo);
typedef WKStringRef (*WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0)(WKPageRef page, WKStringRef message, WKStringRef defaultValue, WKFrameRef frame, const void *clientInfo);
typedef WKPageRef (*WKPageCreateNewPageCallback_deprecatedForUseWithV1)(WKPageRef page, WKURLRequestRef urlRequest, WKDictionaryRef features, WKEventModifiers modifiers, WKEventMouseButton mouseButton, const void *clientInfo);
typedef void (*WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5)(WKPageRef page, WKStringRef alertText, WKFrameRef frame, WKSecurityOriginRef securityOrigin, const void *clientInfo);
typedef bool (*WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5)(WKPageRef page, WKStringRef message, WKFrameRef frame, WKSecurityOriginRef securityOrigin, const void *clientInfo);
typedef WKStringRef (*WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5)(WKPageRef page, WKStringRef message, WKStringRef defaultValue, WKFrameRef frame, WKSecurityOriginRef securityOrigin, const void *clientInfo);
typedef bool (*WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6)(WKPageRef page, WKStringRef message, WKFrameRef frame, const void *clientInfo);

typedef struct WKPageUIClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKPageUIClientBase;

typedef struct WKPageUIClientV0 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;
} WKPageUIClientV0;

typedef struct WKPageUIClientV1 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;
} WKPageUIClientV1;

typedef struct WKPageUIClientV2 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;
} WKPageUIClientV2;

typedef struct WKPageUIClientV3 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;
} WKPageUIClientV3;

typedef struct WKPageUIClientV4 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame.
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;
    
    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;
} WKPageUIClientV4;

typedef struct WKPageUIClientV5 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;
    
    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.
} WKPageUIClientV5;

typedef struct WKPageUIClientV6 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.

    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;
} WKPageUIClientV6;

typedef struct WKPageUIClientV7 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.

    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;

    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;
} WKPageUIClientV7;

typedef struct WKPageUIClientV8 {
    WKPageUIClientBase                                                  base;
    
    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;
    
    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;
    
    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;
    
    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;
    
    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;
    
    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.
    
    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;
    
    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;
    
    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;
} WKPageUIClientV8;

typedef struct WKPageUIClientV9 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.

    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;

    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;

    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;

    // Version 9.
    WKHandleAutoplayEventCallback                                       handleAutoplayEvent;
} WKPageUIClientV9;
    
typedef struct WKPageUIClientV10 {
    WKPageUIClientBase                                                  base;
    
    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;
    
    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;
    
    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;
    
    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;
    
    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;
    
    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.
    
    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;
    
    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;
    
    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;
    
    // Version 9.
    WKHandleAutoplayEventCallback                                       handleAutoplayEvent;
    
    // Version 10.
    WKHasVideoInPictureInPictureDidChangeCallback                       hasVideoInPictureInPictureDidChange;
    void*                                                               unused6; // Used to be didExceedBackgroundResourceLimitWhileInForeground
} WKPageUIClientV10;

typedef struct WKPageUIClientV11 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.

    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;

    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;

    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;

    // Version 9.
    WKHandleAutoplayEventCallback                                       handleAutoplayEvent;

    // Version 10.
    WKHasVideoInPictureInPictureDidChangeCallback                       hasVideoInPictureInPictureDidChange;
    void*                                                               unused6; // Used to be didExceedBackgroundResourceLimitWhileInForeground

    // Version 11.
    WKPageDidResignInputElementStrongPasswordAppearanceCallback         didResignInputElementStrongPasswordAppearance;
} WKPageUIClientV11;

typedef struct WKPageUIClientV12 {
    WKPageUIClientBase                                                  base;
    
    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;
    
    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;
    
    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;
    
    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;
    
    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;
    
    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.
    
    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;
    
    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;
    
    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;
    
    // Version 9.
    WKHandleAutoplayEventCallback                                       handleAutoplayEvent;
    
    // Version 10.
    WKHasVideoInPictureInPictureDidChangeCallback                       hasVideoInPictureInPictureDidChange;
    void*                                                               unused6; // Used to be didExceedBackgroundResourceLimitWhileInForeground
    
    // Version 11.
    WKPageDidResignInputElementStrongPasswordAppearanceCallback         didResignInputElementStrongPasswordAppearance;

    // Version 12.
    WKPageRequestStorageAccessConfirmCallback                           requestStorageAccessConfirm;
} WKPageUIClientV12;

typedef struct WKPageUIClientV13 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.

    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;

    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;

    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;

    // Version 9.
    WKHandleAutoplayEventCallback                                       handleAutoplayEvent;

    // Version 10.
    WKHasVideoInPictureInPictureDidChangeCallback                       hasVideoInPictureInPictureDidChange;
    void*                                                               unused6; // Used to be didExceedBackgroundResourceLimitWhileInForeground

    // Version 11.
    WKPageDidResignInputElementStrongPasswordAppearanceCallback         didResignInputElementStrongPasswordAppearance;

    // Version 12.
    WKPageRequestStorageAccessConfirmCallback                           requestStorageAccessConfirm;

    // Version 13.
    WKPageShouldAllowDeviceOrientationAndMotionAccessCallback           shouldAllowDeviceOrientationAndMotionAccess;
} WKPageUIClientV13;

typedef struct WKPageUIClientV14 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.

    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;

    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;

    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;

    // Version 9.
    WKHandleAutoplayEventCallback                                       handleAutoplayEvent;

    // Version 10.
    WKHasVideoInPictureInPictureDidChangeCallback                       hasVideoInPictureInPictureDidChange;
    void*                                                               unused6; // Used to be didExceedBackgroundResourceLimitWhileInForeground

    // Version 11.
    WKPageDidResignInputElementStrongPasswordAppearanceCallback         didResignInputElementStrongPasswordAppearance;

    // Version 12.
    WKPageRequestStorageAccessConfirmCallback                           requestStorageAccessConfirm;

    // Version 13.
    WKPageShouldAllowDeviceOrientationAndMotionAccessCallback           shouldAllowDeviceOrientationAndMotionAccess;

    // Version 14.
    WKPageRunWebAuthenticationPanelCallback                             runWebAuthenticationPanel;
    WKPageHandleJavaScriptDialogCallback                                handleJavaScriptDialog;
} WKPageUIClientV14;

typedef struct WKPageUIClientV15 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.

    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;

    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;

    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;

    // Version 9.
    WKHandleAutoplayEventCallback                                       handleAutoplayEvent;

    // Version 10.
    WKHasVideoInPictureInPictureDidChangeCallback                       hasVideoInPictureInPictureDidChange;
    void*                                                               unused6; // Used to be didExceedBackgroundResourceLimitWhileInForeground

    // Version 11.
    WKPageDidResignInputElementStrongPasswordAppearanceCallback         didResignInputElementStrongPasswordAppearance;

    // Version 12.
    WKPageRequestStorageAccessConfirmCallback                           requestStorageAccessConfirm;

    // Version 13.
    WKPageShouldAllowDeviceOrientationAndMotionAccessCallback           shouldAllowDeviceOrientationAndMotionAccess;

    // Version 14.
    WKPageRunWebAuthenticationPanelCallback                             runWebAuthenticationPanel;
    WKPageHandleJavaScriptDialogCallback                                handleJavaScriptDialog;

    // Version 15.
    WKPageDecidePolicyForSpeechRecognitionPermissionRequestCallback     decidePolicyForSpeechRecognitionPermissionRequest;
    
} WKPageUIClientV15;

typedef struct WKPageUIClientV16 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.

    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;

    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;

    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;

    // Version 9.
    WKHandleAutoplayEventCallback                                       handleAutoplayEvent;

    // Version 10.
    WKHasVideoInPictureInPictureDidChangeCallback                       hasVideoInPictureInPictureDidChange;
    void*                                                               unused6; // Used to be didExceedBackgroundResourceLimitWhileInForeground

    // Version 11.
    WKPageDidResignInputElementStrongPasswordAppearanceCallback         didResignInputElementStrongPasswordAppearance;

    // Version 12.
    WKPageRequestStorageAccessConfirmCallback                           requestStorageAccessConfirm;

    // Version 13.
    WKPageShouldAllowDeviceOrientationAndMotionAccessCallback           shouldAllowDeviceOrientationAndMotionAccess;

    // Version 14.
    WKPageRunWebAuthenticationPanelCallback                             runWebAuthenticationPanel;
    WKPageHandleJavaScriptDialogCallback                                handleJavaScriptDialog;

    // Version 15.
    WKPageDecidePolicyForSpeechRecognitionPermissionRequestCallback     decidePolicyForSpeechRecognitionPermissionRequest;

    // Version 16.
    WKPageDecidePolicyForMediaKeySystemPermissionRequestCallback        decidePolicyForMediaKeySystemPermissionRequest;

} WKPageUIClientV16;

typedef struct WKPageUIClientV17 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.

    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;

    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;

    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;

    // Version 9.
    WKHandleAutoplayEventCallback                                       handleAutoplayEvent;

    // Version 10.
    WKHasVideoInPictureInPictureDidChangeCallback                       hasVideoInPictureInPictureDidChange;
    void*                                                               unused6; // Used to be didExceedBackgroundResourceLimitWhileInForeground

    // Version 11.
    WKPageDidResignInputElementStrongPasswordAppearanceCallback         didResignInputElementStrongPasswordAppearance;

    // Version 12.
    WKPageRequestStorageAccessConfirmCallback                           requestStorageAccessConfirm;

    // Version 13.
    WKPageShouldAllowDeviceOrientationAndMotionAccessCallback           shouldAllowDeviceOrientationAndMotionAccess;

    // Version 14.
    WKPageRunWebAuthenticationPanelCallback                             runWebAuthenticationPanel;
    WKPageHandleJavaScriptDialogCallback                                handleJavaScriptDialog;

    // Version 15.
    WKPageDecidePolicyForSpeechRecognitionPermissionRequestCallback     decidePolicyForSpeechRecognitionPermissionRequest;

    // Version 16.
    WKPageDecidePolicyForMediaKeySystemPermissionRequestCallback        decidePolicyForMediaKeySystemPermissionRequest;

} WKPageUIClientV17;

typedef struct WKPageUIClientV18 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.

    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;

    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;

    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;

    // Version 9.
    WKHandleAutoplayEventCallback                                       handleAutoplayEvent;

    // Version 10.
    WKHasVideoInPictureInPictureDidChangeCallback                       hasVideoInPictureInPictureDidChange;
    void*                                                               unused6; // Used to be didExceedBackgroundResourceLimitWhileInForeground

    // Version 11.
    WKPageDidResignInputElementStrongPasswordAppearanceCallback         didResignInputElementStrongPasswordAppearance;

    // Version 12.
    WKPageRequestStorageAccessConfirmCallback                           requestStorageAccessConfirm;

    // Version 13.
    WKPageShouldAllowDeviceOrientationAndMotionAccessCallback           shouldAllowDeviceOrientationAndMotionAccess;

    // Version 14.
    WKPageRunWebAuthenticationPanelCallback                             runWebAuthenticationPanel;
    WKPageHandleJavaScriptDialogCallback                                handleJavaScriptDialog;

    // Version 15.
    WKPageDecidePolicyForSpeechRecognitionPermissionRequestCallback     decidePolicyForSpeechRecognitionPermissionRequest;

    // Version 16.
    WKPageDecidePolicyForMediaKeySystemPermissionRequestCallback        decidePolicyForMediaKeySystemPermissionRequest;

    // Version 17.
    WKQueryPermissionCallback                                           queryPermission;
} WKPageUIClientV18;

typedef struct WKPageUIClientV19 {
    WKPageUIClientBase                                                  base;

    // Version 0.
    WKPageCreateNewPageCallback_deprecatedForUseWithV0                  createNewPage_deprecatedForUseWithV0;
    WKPageUIClientCallback                                              showPage;
    WKPageUIClientCallback                                              close;
    WKPageTakeFocusCallback                                             takeFocus;
    WKPageFocusCallback                                                 focus;
    WKPageUnfocusCallback                                               unfocus;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV0             runJavaScriptAlert_deprecatedForUseWithV0;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV0           runJavaScriptConfirm_deprecatedForUseWithV0;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV0            runJavaScriptPrompt_deprecatedForUseWithV0;
    WKPageSetStatusTextCallback                                         setStatusText;
    WKPageMouseDidMoveOverElementCallback_deprecatedForUseWithV0        mouseDidMoveOverElement_deprecatedForUseWithV0;
    WKPageMissingPluginButtonClickedCallback_deprecatedForUseWithV0     missingPluginButtonClicked_deprecatedForUseWithV0;
    WKPageDidNotHandleKeyEventCallback                                  didNotHandleKeyEvent;
    WKPageDidNotHandleWheelEventCallback                                didNotHandleWheelEvent;
    WKPageGetToolbarsAreVisibleCallback                                 toolbarsAreVisible;
    WKPageSetToolbarsAreVisibleCallback                                 setToolbarsAreVisible;
    WKPageGetMenuBarIsVisibleCallback                                   menuBarIsVisible;
    WKPageSetMenuBarIsVisibleCallback                                   setMenuBarIsVisible;
    WKPageGetStatusBarIsVisibleCallback                                 statusBarIsVisible;
    WKPageSetStatusBarIsVisibleCallback                                 setStatusBarIsVisible;
    WKPageGetIsResizableCallback                                        isResizable;
    WKPageSetIsResizableCallback                                        setIsResizable;
    WKPageGetWindowFrameCallback                                        getWindowFrame;
    WKPageSetWindowFrameCallback                                        setWindowFrame;
    WKPageRunBeforeUnloadConfirmPanelCallback_deprecatedForUseWithV6    runBeforeUnloadConfirmPanel_deprecatedForUseWithV6;
    WKPageUIClientCallback                                              didDraw;
    WKPageUIClientCallback                                              pageDidScroll;
    WKPageExceededDatabaseQuotaCallback                                 exceededDatabaseQuota;
    WKPageRunOpenPanelCallback                                          runOpenPanel;
    WKPageDecidePolicyForGeolocationPermissionRequestCallback           decidePolicyForGeolocationPermissionRequest;
    WKPageHeaderHeightCallback                                          headerHeight;
    WKPageFooterHeightCallback                                          footerHeight;
    WKPageDrawHeaderCallback                                            drawHeader;
    WKPageDrawFooterCallback                                            drawFooter;
    WKPagePrintFrameCallback                                            printFrame;
    WKPageUIClientCallback                                              runModal;
    void*                                                               unused1; // Used to be didCompleteRubberBandForMainFrame
    WKPageSaveDataToFileInDownloadsFolderCallback                       saveDataToFileInDownloadsFolder;
    void*                                                               shouldInterruptJavaScript_unavailable;

    // Version 1.
    WKPageCreateNewPageCallback_deprecatedForUseWithV1                  createNewPage_deprecatedForUseWithV1;
    WKPageMouseDidMoveOverElementCallback                               mouseDidMoveOverElement;
    WKPageDecidePolicyForNotificationPermissionRequestCallback          decidePolicyForNotificationPermissionRequest;
    WKPageUnavailablePluginButtonClickedCallback_deprecatedForUseWithV1 unavailablePluginButtonClicked_deprecatedForUseWithV1;

    // Version 2.
    WKPageShowColorPickerCallback                                       showColorPicker;
    WKPageHideColorPickerCallback                                       hideColorPicker;
    WKPageUnavailablePluginButtonClickedCallback                        unavailablePluginButtonClicked;

    // Version 3.
    WKPagePinnedStateDidChangeCallback                                  pinnedStateDidChange;

    // Version 4.
    void*                                                               unused2; // Used to be didBeginTrackingPotentialLongMousePress.
    void*                                                               unused3; // Used to be didRecognizeLongMousePress.
    void*                                                               unused4; // Used to be didCancelTrackingPotentialLongMousePress.
    WKPageIsPlayingAudioDidChangeCallback                               isPlayingAudioDidChange;

    // Version 5.
    WKPageDecidePolicyForUserMediaPermissionRequestCallback             decidePolicyForUserMediaPermissionRequest;
    WKPageDidClickAutoFillButtonCallback                                didClickAutoFillButton;
    WKPageRunJavaScriptAlertCallback_deprecatedForUseWithV5             runJavaScriptAlert_deprecatedForUseWithV5;
    WKPageRunJavaScriptConfirmCallback_deprecatedForUseWithV5           runJavaScriptConfirm_deprecatedForUseWithV5;
    WKPageRunJavaScriptPromptCallback_deprecatedForUseWithV5            runJavaScriptPrompt_deprecatedForUseWithV5;
    void*                                                               unused5; // Used to be mediaSessionMetadataDidChange.

    // Version 6.
    WKPageCreateNewPageCallback                                         createNewPage;
    WKPageRunJavaScriptAlertCallback                                    runJavaScriptAlert;
    WKPageRunJavaScriptConfirmCallback                                  runJavaScriptConfirm;
    WKPageRunJavaScriptPromptCallback                                   runJavaScriptPrompt;
    WKCheckUserMediaPermissionCallback                                  checkUserMediaPermissionForOrigin;

    // Version 7.
    WKPageRunBeforeUnloadConfirmPanelCallback                           runBeforeUnloadConfirmPanel;
    WKFullscreenMayReturnToInlineCallback                               fullscreenMayReturnToInline;

    // Version 8.
    WKRequestPointerLockCallback                                        requestPointerLock;
    WKDidLosePointerLockCallback                                        didLosePointerLock;

    // Version 9.
    WKHandleAutoplayEventCallback                                       handleAutoplayEvent;

    // Version 10.
    WKHasVideoInPictureInPictureDidChangeCallback                       hasVideoInPictureInPictureDidChange;
    void*                                                               unused6; // Used to be didExceedBackgroundResourceLimitWhileInForeground

    // Version 11.
    WKPageDidResignInputElementStrongPasswordAppearanceCallback         didResignInputElementStrongPasswordAppearance;

    // Version 12.
    WKPageRequestStorageAccessConfirmCallback                           requestStorageAccessConfirm;

    // Version 13.
    WKPageShouldAllowDeviceOrientationAndMotionAccessCallback           shouldAllowDeviceOrientationAndMotionAccess;

    // Version 14.
    WKPageRunWebAuthenticationPanelCallback                             runWebAuthenticationPanel;
    WKPageHandleJavaScriptDialogCallback                                handleJavaScriptDialog;

    // Version 15.
    WKPageDecidePolicyForSpeechRecognitionPermissionRequestCallback     decidePolicyForSpeechRecognitionPermissionRequest;

    // Version 16.
    WKPageDecidePolicyForMediaKeySystemPermissionRequestCallback        decidePolicyForMediaKeySystemPermissionRequest;

    // Version 17.
    WKQueryPermissionCallback                                           queryPermission;

    // Version 18.
    WKLockScreenOrientationCallback                                     lockScreenOrientation;
    WKUnlockScreenOrientationCallback                                   unlockScreenOrientation;
} WKPageUIClientV19;

#ifdef __cplusplus
}
#endif
