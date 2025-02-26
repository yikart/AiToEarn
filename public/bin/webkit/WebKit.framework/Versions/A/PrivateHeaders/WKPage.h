/*
 * Copyright (C) 2010, 2011 Apple Inc. All rights reserved.
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

#ifndef WKPage_h
#define WKPage_h

#include <WebKit/WKBase.h>
#include <WebKit/WKDeprecated.h>
#include <WebKit/WKErrorRef.h>
#include <WebKit/WKEvent.h>
#include <WebKit/WKFindOptions.h>
#include <WebKit/WKGeometry.h>
#include <WebKit/WKNativeEvent.h>
#include <WebKit/WKPageContextMenuClient.h>
#include <WebKit/WKPageDiagnosticLoggingClient.h>
#include <WebKit/WKPageFindClient.h>
#include <WebKit/WKPageFindMatchesClient.h>
#include <WebKit/WKPageFormClient.h>
#include <WebKit/WKPageInjectedBundleClient.h>
#include <WebKit/WKPageLoadTypes.h>
#include <WebKit/WKPageLoaderClient.h>
#include <WebKit/WKPageNavigationClient.h>
#include <WebKit/WKPagePolicyClient.h>
#include <WebKit/WKPageStateClient.h>
#include <WebKit/WKPageUIClient.h>
#include <WebKit/WKPageVisibilityTypes.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

WK_EXPORT WKTypeID WKPageGetTypeID(void);

WK_EXPORT WKContextRef WKPageGetContext(WKPageRef page);
WK_EXPORT WKPageGroupRef WKPageGetPageGroup(WKPageRef page) WK_C_API_DEPRECATED;

WK_EXPORT WKPageConfigurationRef WKPageCopyPageConfiguration(WKPageRef page);

// URL Requests
WK_EXPORT void WKPageLoadURL(WKPageRef page, WKURLRef url);
WK_EXPORT void WKPageLoadURLWithUserData(WKPageRef page, WKURLRef url, WKTypeRef userData);
WK_EXPORT void WKPageLoadURLRequest(WKPageRef page, WKURLRequestRef urlRequest);
WK_EXPORT void WKPageLoadURLRequestWithUserData(WKPageRef page, WKURLRequestRef urlRequest, WKTypeRef userData);
WK_EXPORT void WKPageLoadFile(WKPageRef page, WKURLRef fileURL, WKURLRef resourceDirectoryURL);
WK_EXPORT void WKPageLoadFileWithUserData(WKPageRef page, WKURLRef fileURL, WKURLRef resourceDirectoryURL, WKTypeRef userData);

// Data Requests
WK_EXPORT void WKPageLoadData(WKPageRef page, WKDataRef data, WKStringRef MIMEType, WKStringRef encoding, WKURLRef baseURL);
WK_EXPORT void WKPageLoadDataWithUserData(WKPageRef page, WKDataRef data, WKStringRef MIMEType, WKStringRef encoding, WKURLRef baseURL, WKTypeRef userData);
WK_EXPORT void WKPageLoadHTMLString(WKPageRef page, WKStringRef htmlString, WKURLRef baseURL);
WK_EXPORT void WKPageLoadHTMLStringWithUserData(WKPageRef page, WKStringRef htmlString, WKURLRef baseURL, WKTypeRef userData);
WK_EXPORT void WKPageLoadAlternateHTMLString(WKPageRef page, WKStringRef htmlString, WKURLRef baseURL, WKURLRef unreachableURL);
WK_EXPORT void WKPageLoadAlternateHTMLStringWithUserData(WKPageRef page, WKStringRef htmlString, WKURLRef baseURL, WKURLRef unreachableURL, WKTypeRef userData);
WK_EXPORT void WKPageLoadPlainTextString(WKPageRef page, WKStringRef plainTextString);
WK_EXPORT void WKPageLoadPlainTextStringWithUserData(WKPageRef page, WKStringRef plainTextString, WKTypeRef userData);
WK_EXPORT void WKPageLoadWebArchiveData(WKPageRef page, WKDataRef webArchiveData) WK_C_API_DEPRECATED;
WK_EXPORT void WKPageLoadWebArchiveDataWithUserData(WKPageRef page, WKDataRef webArchiveData, WKTypeRef userData) WK_C_API_DEPRECATED;

WK_EXPORT void WKPageStopLoading(WKPageRef page);
WK_EXPORT void WKPageReload(WKPageRef page);
WK_EXPORT void WKPageReloadWithoutContentBlockers(WKPageRef page);
WK_EXPORT void WKPageReloadFromOrigin(WKPageRef page);
WK_EXPORT void WKPageReloadExpiredOnly(WKPageRef page);

WK_EXPORT bool WKPageTryClose(WKPageRef page);
WK_EXPORT void WKPageClose(WKPageRef page);
WK_EXPORT bool WKPageIsClosed(WKPageRef page);

WK_EXPORT void WKPageGoForward(WKPageRef page);
WK_EXPORT bool WKPageCanGoForward(WKPageRef page);
WK_EXPORT void WKPageGoBack(WKPageRef page);
WK_EXPORT bool WKPageCanGoBack(WKPageRef page);
WK_EXPORT void WKPageGoToBackForwardListItem(WKPageRef page, WKBackForwardListItemRef item);
WK_EXPORT void WKPageTryRestoreScrollPosition(WKPageRef page);
WK_EXPORT WKBackForwardListRef WKPageGetBackForwardList(WKPageRef page);
WK_EXPORT bool WKPageWillHandleHorizontalScrollEvents(WKPageRef page);

WK_EXPORT void WKPageUpdateWebsitePolicies(WKPageRef, WKWebsitePoliciesRef);

WK_EXPORT WKStringRef WKPageCopyTitle(WKPageRef page);

WK_EXPORT WKURLRef WKPageCopyPendingAPIRequestURL(WKPageRef page);

WK_EXPORT WKURLRef WKPageCopyActiveURL(WKPageRef page);
WK_EXPORT WKURLRef WKPageCopyProvisionalURL(WKPageRef page);
WK_EXPORT WKURLRef WKPageCopyCommittedURL(WKPageRef page);

WK_EXPORT WKFrameRef WKPageGetMainFrame(WKPageRef page);
WK_EXPORT WKFrameRef WKPageGetFocusedFrame(WKPageRef page); // The focused frame may be inactive.
WK_EXPORT WKFrameRef WKPageGetFrameSetLargestFrame(WKPageRef page) WK_C_API_DEPRECATED;
WK_EXPORT double WKPageGetEstimatedProgress(WKPageRef page);

WK_EXPORT uint64_t WKPageGetRenderTreeSize(WKPageRef page);

WK_EXPORT WKWebsiteDataStoreRef WKPageGetWebsiteDataStore(WKPageRef page);

WK_EXPORT WKInspectorRef WKPageGetInspector(WKPageRef page);

WK_EXPORT WKStringRef WKPageCopyUserAgent(WKPageRef page);

WK_EXPORT WKStringRef WKPageCopyApplicationNameForUserAgent(WKPageRef page);
WK_EXPORT void WKPageSetApplicationNameForUserAgent(WKPageRef page, WKStringRef applicationName);

WK_EXPORT WKStringRef WKPageCopyCustomUserAgent(WKPageRef page);
WK_EXPORT void WKPageSetCustomUserAgent(WKPageRef page, WKStringRef userAgent);
    
WK_EXPORT bool WKPageSupportsTextEncoding(WKPageRef page);
WK_EXPORT WKStringRef WKPageCopyCustomTextEncodingName(WKPageRef page);
WK_EXPORT void WKPageSetCustomTextEncodingName(WKPageRef page, WKStringRef encodingName);

WK_EXPORT void WKPageTerminate(WKPageRef page);

WK_EXPORT WKStringRef WKPageGetSessionHistoryURLValueType(void);
WK_EXPORT WKStringRef WKPageGetSessionBackForwardListItemValueType(void);

typedef bool (*WKPageSessionStateFilterCallback)(WKPageRef page, WKStringRef valueType, WKTypeRef value, void* context);

// FIXME: This should return a WKSessionStateRef object, not a WKTypeRef.
// It currently returns a WKTypeRef for backwards compatibility with Safari.
WK_EXPORT WKTypeRef WKPageCopySessionState(WKPageRef page, void* context, WKPageSessionStateFilterCallback urlAllowedCallback);

// FIXME: This should take a WKSessionStateRef object, not a WKTypeRef.
// It currently takes a WKTypeRef for backwards compatibility with Safari.
WK_EXPORT void WKPageRestoreFromSessionState(WKPageRef page, WKTypeRef sessionState);

WK_EXPORT double WKPageGetBackingScaleFactor(WKPageRef page);

WK_EXPORT void WKPageSetCustomBackingScaleFactor(WKPageRef page, double customScaleFactor);
typedef void (*WKPageSetCustomBackingScaleFactorFunction)(void* functionContext);
WK_EXPORT void WKPageSetCustomBackingScaleFactorWithCallback(WKPageRef page, double customScaleFactor, void* context, WKPageSetCustomBackingScaleFactorFunction completionHandler);
WK_EXPORT void WKPageClearWheelEventTestMonitor(WKPageRef page);

WK_EXPORT bool WKPageSupportsTextZoom(WKPageRef page);
WK_EXPORT double WKPageGetTextZoomFactor(WKPageRef page);
WK_EXPORT void WKPageSetTextZoomFactor(WKPageRef page, double zoomFactor);
WK_EXPORT double WKPageGetPageZoomFactor(WKPageRef page);
WK_EXPORT void WKPageSetPageZoomFactor(WKPageRef page, double zoomFactor);
WK_EXPORT void WKPageSetPageAndTextZoomFactors(WKPageRef page, double pageZoomFactor, double textZoomFactor);

WK_EXPORT void WKPageSetScaleFactor(WKPageRef page, double scale, WKPoint origin);
WK_EXPORT double WKPageGetScaleFactor(WKPageRef page);

WK_EXPORT void WKPageSetUseFixedLayout(WKPageRef page, bool fixed);
WK_EXPORT void WKPageSetFixedLayoutSize(WKPageRef page, WKSize size);
WK_EXPORT bool WKPageUseFixedLayout(WKPageRef page);
WK_EXPORT WKSize WKPageFixedLayoutSize(WKPageRef page);

WK_EXPORT void WKPageListenForLayoutMilestones(WKPageRef page, WKLayoutMilestones milestones);

WK_EXPORT bool WKPageHasHorizontalScrollbar(WKPageRef page);
WK_EXPORT bool WKPageHasVerticalScrollbar(WKPageRef page);

WK_EXPORT void WKPageSetSuppressScrollbarAnimations(WKPageRef page, bool suppressAnimations);
WK_EXPORT bool WKPageAreScrollbarAnimationsSuppressed(WKPageRef page);

WK_EXPORT bool WKPageIsPinnedToLeftSide(WKPageRef page);
WK_EXPORT bool WKPageIsPinnedToRightSide(WKPageRef page);
WK_EXPORT bool WKPageIsPinnedToTopSide(WKPageRef page);
WK_EXPORT bool WKPageIsPinnedToBottomSide(WKPageRef page);
    
// This API is poorly named. Even when these values are set to false, rubber-banding will
// still be allowed to occur at the end of a momentum scroll. These values are used along
// with pin state to determine if wheel events should be handled in the web process or if
// they should be passed up to the client.
WK_EXPORT bool WKPageRubberBandsAtLeft(WKPageRef);
WK_EXPORT void WKPageSetRubberBandsAtLeft(WKPageRef, bool rubberBandsAtLeft);
WK_EXPORT bool WKPageRubberBandsAtRight(WKPageRef);
WK_EXPORT void WKPageSetRubberBandsAtRight(WKPageRef, bool rubberBandsAtRight);
WK_EXPORT bool WKPageRubberBandsAtTop(WKPageRef);
WK_EXPORT void WKPageSetRubberBandsAtTop(WKPageRef, bool rubberBandsAtTop);
WK_EXPORT bool WKPageRubberBandsAtBottom(WKPageRef);
WK_EXPORT void WKPageSetRubberBandsAtBottom(WKPageRef, bool rubberBandsAtBottom);
    
// Rubber-banding is enabled by default.
WK_EXPORT bool WKPageVerticalRubberBandingIsEnabled(WKPageRef);
WK_EXPORT void WKPageSetEnableVerticalRubberBanding(WKPageRef, bool enableVerticalRubberBanding);
WK_EXPORT bool WKPageHorizontalRubberBandingIsEnabled(WKPageRef);
WK_EXPORT void WKPageSetEnableHorizontalRubberBanding(WKPageRef, bool enableHorizontalRubberBanding);
    
WK_EXPORT void WKPageSetBackgroundExtendsBeyondPage(WKPageRef, bool backgroundExtendsBeyondPage);
WK_EXPORT bool WKPageBackgroundExtendsBeyondPage(WKPageRef);

WK_EXPORT bool WKPageCanDelete(WKPageRef page);
WK_EXPORT bool WKPageHasSelectedRange(WKPageRef page);
WK_EXPORT bool WKPageIsContentEditable(WKPageRef page);

WK_EXPORT void WKPageSetMaintainsInactiveSelection(WKPageRef page, bool maintainsInactiveSelection);
WK_EXPORT void WKPageCenterSelectionInVisibleArea(WKPageRef page);
    
WK_EXPORT void WKPageFindString(WKPageRef page, WKStringRef string, WKFindOptions findOptions, unsigned maxMatchCount);
WK_EXPORT void WKPageHideFindUI(WKPageRef page);
WK_EXPORT void WKPageCountStringMatches(WKPageRef page, WKStringRef string, WKFindOptions findOptions, unsigned maxMatchCount);
WK_EXPORT void WKPageFindStringMatches(WKPageRef page, WKStringRef string, WKFindOptions findOptions, unsigned maxMatchCount);
WK_EXPORT void WKPageGetImageForFindMatch(WKPageRef page, int32_t matchIndex);
WK_EXPORT void WKPageSelectFindMatch(WKPageRef page, int32_t matchIndex);

WK_EXPORT void WKPageSetPageContextMenuClient(WKPageRef page, const WKPageContextMenuClientBase* client);
WK_EXPORT void WKPageSetPageDiagnosticLoggingClient(WKPageRef page, const WKPageDiagnosticLoggingClientBase* client);
WK_EXPORT void WKPageSetPageFindClient(WKPageRef page, const WKPageFindClientBase* client);
WK_EXPORT void WKPageSetPageFindMatchesClient(WKPageRef page, const WKPageFindMatchesClientBase* client);
WK_EXPORT void WKPageSetPageFormClient(WKPageRef page, const WKPageFormClientBase* client);
WK_EXPORT void WKPageSetPageUIClient(WKPageRef page, const WKPageUIClientBase* client);
WK_EXPORT void WKPageSetPageInjectedBundleClient(WKPageRef page, const WKPageInjectedBundleClientBase* client);

// A client can implement either a navigation client or loader and policy clients, but never both.
WK_EXPORT void WKPageSetPageLoaderClient(WKPageRef page, const WKPageLoaderClientBase* client) WK_C_API_DEPRECATED_WITH_REPLACEMENT(WKPageSetPageNavigationClient, macos(10.14.4));
WK_EXPORT void WKPageSetPagePolicyClient(WKPageRef page, const WKPagePolicyClientBase* client) WK_C_API_DEPRECATED_WITH_REPLACEMENT(WKPageSetPageNavigationClient, macos(10.14.4));
WK_EXPORT void WKPageSetPageNavigationClient(WKPageRef page, const WKPageNavigationClientBase* client);

WK_EXPORT void WKPageSetPageStateClient(WKPageRef page, WKPageStateClientBase* client);

typedef void (*WKPageEvaluateJavaScriptFunction)(WKTypeRef, WKErrorRef, void*);
WK_EXPORT void WKPageEvaluateJavaScriptInMainFrame(WKPageRef page, WKStringRef script, void* context, WKPageEvaluateJavaScriptFunction function);

typedef void (*WKPageGetSourceForFrameFunction)(WKStringRef, WKErrorRef, void*);
WK_EXPORT void WKPageGetSourceForFrame(WKPageRef page, WKFrameRef frame, void* context, WKPageGetSourceForFrameFunction function);

typedef void (*WKPageGetContentsAsStringFunction)(WKStringRef, WKErrorRef, void*);
WK_EXPORT void WKPageGetContentsAsString(WKPageRef page, void* context, WKPageGetContentsAsStringFunction function);

typedef void (*WKPageGetContentsAsMHTMLDataFunction)(WKDataRef, WKErrorRef, void*);
WK_EXPORT void WKPageGetContentsAsMHTMLData(WKPageRef page, void* context, WKPageGetContentsAsMHTMLDataFunction function);

typedef void (*WKPageGetSelectionAsWebArchiveDataFunction)(WKDataRef, WKErrorRef, void*);
WK_EXPORT void WKPageGetSelectionAsWebArchiveData(WKPageRef page, void* context, WKPageGetSelectionAsWebArchiveDataFunction function);

typedef void (*WKPageForceRepaintFunction)(WKErrorRef, void*);
WK_EXPORT void WKPageForceRepaint(WKPageRef page, void* context, WKPageForceRepaintFunction function);

/*
    Some of the more common command name strings include the following, although any WebCore EditorCommand string is supported:
    
    "Cut"
    "Copy"
    "Paste"
    "SelectAll"
    "Undo"
    "Redo"
*/

// state represents the state of the command in a menu (on is 1, off is 0, and mixed is -1), typically used to add a checkmark next to the menu item.
typedef void (*WKPageValidateCommandCallback)(WKStringRef command, bool isEnabled, int32_t state, WKErrorRef, void* context);
WK_EXPORT void WKPageValidateCommand(WKPageRef page, WKStringRef command, void* context, WKPageValidateCommandCallback callback);
WK_EXPORT void WKPageExecuteCommand(WKPageRef page, WKStringRef command);

WK_EXPORT void WKPagePostMessageToInjectedBundle(WKPageRef page, WKStringRef messageName, WKTypeRef messageBody);

WK_EXPORT void WKPageSelectContextMenuItem(WKPageRef page, WKContextMenuItemRef item);

WK_EXPORT void WKPageClearNotificationPermissionState(WKPageRef page);

#ifdef __cplusplus
}
#endif

#endif /* WKPage_h */
