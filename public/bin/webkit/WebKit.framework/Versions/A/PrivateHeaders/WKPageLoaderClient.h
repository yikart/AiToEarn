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

#ifndef WKPageLoaderClient_h
#define WKPageLoaderClient_h

#include <WebKit/WKBase.h>
#include <WebKit/WKErrorRef.h>
#include <WebKit/WKPageLoadTypes.h>
#include <WebKit/WKPluginLoadPolicy.h>

#ifdef __cplusplus
extern "C" {
#endif

// Deprecated, but kept around for client compatibility.
enum {
    kWKWebGLLoadPolicyBlocked = 0,
    kWKWebGLLoadPolicyLoadNormally,
    kWKWebGLLoadPolicyPending
};
typedef uint32_t WKWebGLLoadPolicy;

typedef void (*WKPageLoaderClientCallback)(WKPageRef page, const void* clientInfo);
typedef void (*WKPageDidStartProvisionalLoadForFrameCallback)(WKPageRef page, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidReceiveServerRedirectForProvisionalLoadForFrameCallback)(WKPageRef page, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidFailProvisionalLoadWithErrorForFrameCallback)(WKPageRef page, WKFrameRef frame, WKErrorRef error, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidCommitLoadForFrameCallback)(WKPageRef page, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidFinishDocumentLoadForFrameCallback)(WKPageRef page, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidFinishLoadForFrameCallback)(WKPageRef page, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidFailLoadWithErrorForFrameCallback)(WKPageRef page, WKFrameRef frame, WKErrorRef error, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidSameDocumentNavigationForFrameCallback)(WKPageRef page, WKFrameRef frame, WKSameDocumentNavigationType type, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidReceiveTitleForFrameCallback)(WKPageRef page, WKStringRef title, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidFirstLayoutForFrameCallback)(WKPageRef page, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidFirstVisuallyNonEmptyLayoutForFrameCallback)(WKPageRef page, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidRemoveFrameFromHierarchyCallback)(WKPageRef page, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidDisplayInsecureContentForFrameCallback)(WKPageRef page, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidRunInsecureContentForFrameCallback)(WKPageRef page, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidDetectXSSForFrameCallback)(WKPageRef page, WKFrameRef frame, WKTypeRef userData, const void *clientInfo);
typedef bool (*WKPageCanAuthenticateAgainstProtectionSpaceInFrameCallback)(WKPageRef page, WKFrameRef frame, WKProtectionSpaceRef protectionSpace, const void *clientInfo);
typedef void (*WKPageDidReceiveAuthenticationChallengeInFrameCallback)(WKPageRef page, WKFrameRef frame, WKAuthenticationChallengeRef authenticationChallenge, const void *clientInfo);
typedef void (*WKPageDidChangeBackForwardListCallback)(WKPageRef page, WKBackForwardListItemRef addedItem, WKArrayRef removedItems, const void *clientInfo);
typedef bool (*WKPageShouldGoToBackForwardListItemCallback)(WKPageRef page, WKBackForwardListItemRef item, const void *clientInfo);
typedef bool (*WKPageShouldKeepCurrentBackForwardListItemInListCallback)(WKPageRef page, WKBackForwardListItemRef item, const void *clientInfo);
typedef void (*WKPageWillGoToBackForwardListItemCallback)(WKPageRef page, WKBackForwardListItemRef item, WKTypeRef userData, const void *clientInfo);
typedef void (*WKPageDidLayoutCallback)(WKPageRef page, WKLayoutMilestones milestones, WKTypeRef userData, const void *clientInfo);
typedef WKPluginLoadPolicy (*WKPagePluginLoadPolicyCallback)(WKPageRef page, WKPluginLoadPolicy currentPluginLoadPolicy, WKDictionaryRef pluginInfoDictionary, WKStringRef* unavailabilityDescription, const void* clientInfo);
typedef void (*WKPagePluginDidFailCallback)(WKPageRef page, uint32_t errorCode, WKDictionaryRef pluginInfoDictionary, const void* clientInfo);
typedef WKWebGLLoadPolicy (*WKPageWebGLLoadPolicyCallback)(WKPageRef page, WKStringRef url, const void* clientInfo);
typedef void (*WKPageNavigationGestureDidBeginCallback)(WKPageRef page, const void* clientInfo);
typedef void (*WKPageNavigationGestureWillEndCallback)(WKPageRef page, bool willNavigate, WKBackForwardListItemRef item, const void* clientInfo);
typedef void (*WKPageNavigationGestureDidEndCallback)(WKPageRef page, bool willNavigate, WKBackForwardListItemRef item, const void* clientInfo);

// Deprecated
typedef void (*WKPageDidFailToInitializePluginCallback_deprecatedForUseWithV0)(WKPageRef page, WKStringRef mimeType, const void* clientInfo);
typedef void (*WKPagePluginDidFailCallback_deprecatedForUseWithV1)(WKPageRef page, uint32_t errorCode, WKStringRef mimeType, WKStringRef pluginIdentifier, WKStringRef pluginVersion, const void* clientInfo);
typedef WKPluginLoadPolicy (*WKPagePluginLoadPolicyCallback_deprecatedForUseWithV2)(WKPageRef page, WKPluginLoadPolicy currentPluginLoadPolicy, WKDictionaryRef pluginInfoDictionary, const void* clientInfo);

typedef struct WKPageLoaderClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKPageLoaderClientBase;

typedef struct WKPageLoaderClientV0 {
    WKPageLoaderClientBase                                              base;

    // Version 0.
    WKPageDidStartProvisionalLoadForFrameCallback                       didStartProvisionalLoadForFrame;
    WKPageDidReceiveServerRedirectForProvisionalLoadForFrameCallback    didReceiveServerRedirectForProvisionalLoadForFrame;
    WKPageDidFailProvisionalLoadWithErrorForFrameCallback               didFailProvisionalLoadWithErrorForFrame;
    WKPageDidCommitLoadForFrameCallback                                 didCommitLoadForFrame;
    WKPageDidFinishDocumentLoadForFrameCallback                         didFinishDocumentLoadForFrame;
    WKPageDidFinishLoadForFrameCallback                                 didFinishLoadForFrame;
    WKPageDidFailLoadWithErrorForFrameCallback                          didFailLoadWithErrorForFrame;
    WKPageDidSameDocumentNavigationForFrameCallback                     didSameDocumentNavigationForFrame;
    WKPageDidReceiveTitleForFrameCallback                               didReceiveTitleForFrame;
    WKPageDidFirstLayoutForFrameCallback                                didFirstLayoutForFrame;
    WKPageDidFirstVisuallyNonEmptyLayoutForFrameCallback                didFirstVisuallyNonEmptyLayoutForFrame;
    WKPageDidRemoveFrameFromHierarchyCallback                           didRemoveFrameFromHierarchy;
    WKPageDidDisplayInsecureContentForFrameCallback                     didDisplayInsecureContentForFrame;
    WKPageDidRunInsecureContentForFrameCallback                         didRunInsecureContentForFrame;
    WKPageCanAuthenticateAgainstProtectionSpaceInFrameCallback          canAuthenticateAgainstProtectionSpaceInFrame;
    WKPageDidReceiveAuthenticationChallengeInFrameCallback              didReceiveAuthenticationChallengeInFrame;

    // FIXME: Move to progress client.
    WKPageLoaderClientCallback                                          didStartProgress;
    WKPageLoaderClientCallback                                          didChangeProgress;
    WKPageLoaderClientCallback                                          didFinishProgress;

    // FIXME: These three functions should not be part of this client.
    WKPageLoaderClientCallback                                          processDidBecomeUnresponsive;
    WKPageLoaderClientCallback                                          processDidBecomeResponsive;
    WKPageLoaderClientCallback                                          processDidCrash;
    WKPageDidChangeBackForwardListCallback                              didChangeBackForwardList;
    WKPageShouldGoToBackForwardListItemCallback                         shouldGoToBackForwardListItem;
    WKPageDidFailToInitializePluginCallback_deprecatedForUseWithV0      didFailToInitializePlugin_deprecatedForUseWithV0;
} WKPageLoaderClientV0;

typedef struct WKPageLoaderClientV1 {
    WKPageLoaderClientBase                                              base;

    // Version -.
    WKPageDidStartProvisionalLoadForFrameCallback                       didStartProvisionalLoadForFrame;
    WKPageDidReceiveServerRedirectForProvisionalLoadForFrameCallback    didReceiveServerRedirectForProvisionalLoadForFrame;
    WKPageDidFailProvisionalLoadWithErrorForFrameCallback               didFailProvisionalLoadWithErrorForFrame;
    WKPageDidCommitLoadForFrameCallback                                 didCommitLoadForFrame;
    WKPageDidFinishDocumentLoadForFrameCallback                         didFinishDocumentLoadForFrame;
    WKPageDidFinishLoadForFrameCallback                                 didFinishLoadForFrame;
    WKPageDidFailLoadWithErrorForFrameCallback                          didFailLoadWithErrorForFrame;
    WKPageDidSameDocumentNavigationForFrameCallback                     didSameDocumentNavigationForFrame;
    WKPageDidReceiveTitleForFrameCallback                               didReceiveTitleForFrame;
    WKPageDidFirstLayoutForFrameCallback                                didFirstLayoutForFrame;
    WKPageDidFirstVisuallyNonEmptyLayoutForFrameCallback                didFirstVisuallyNonEmptyLayoutForFrame;
    WKPageDidRemoveFrameFromHierarchyCallback                           didRemoveFrameFromHierarchy;
    WKPageDidDisplayInsecureContentForFrameCallback                     didDisplayInsecureContentForFrame;
    WKPageDidRunInsecureContentForFrameCallback                         didRunInsecureContentForFrame;
    WKPageCanAuthenticateAgainstProtectionSpaceInFrameCallback          canAuthenticateAgainstProtectionSpaceInFrame;
    WKPageDidReceiveAuthenticationChallengeInFrameCallback              didReceiveAuthenticationChallengeInFrame;

    // FIXME: Move to progress client.
    WKPageLoaderClientCallback                                          didStartProgress;
    WKPageLoaderClientCallback                                          didChangeProgress;
    WKPageLoaderClientCallback                                          didFinishProgress;

    // FIXME: These three functions should not be part of this client.
    WKPageLoaderClientCallback                                          processDidBecomeUnresponsive;
    WKPageLoaderClientCallback                                          processDidBecomeResponsive;
    WKPageLoaderClientCallback                                          processDidCrash;
    WKPageDidChangeBackForwardListCallback                              didChangeBackForwardList;
    WKPageShouldGoToBackForwardListItemCallback                         shouldGoToBackForwardListItem;
    WKPageDidFailToInitializePluginCallback_deprecatedForUseWithV0      didFailToInitializePlugin_deprecatedForUseWithV0;

    // Version 1.
    WKPageDidDetectXSSForFrameCallback                                  didDetectXSSForFrame;

    void*                                                               didNewFirstVisuallyNonEmptyLayout_unavailable;

    WKPageWillGoToBackForwardListItemCallback                           willGoToBackForwardListItem;

    WKPageLoaderClientCallback                                          interactionOccurredWhileProcessUnresponsive;
    WKPagePluginDidFailCallback_deprecatedForUseWithV1                  pluginDidFail_deprecatedForUseWithV1;
} WKPageLoaderClientV1;

typedef struct WKPageLoaderClientV2 {
    WKPageLoaderClientBase                                              base;

    // Version 0.
    WKPageDidStartProvisionalLoadForFrameCallback                       didStartProvisionalLoadForFrame;
    WKPageDidReceiveServerRedirectForProvisionalLoadForFrameCallback    didReceiveServerRedirectForProvisionalLoadForFrame;
    WKPageDidFailProvisionalLoadWithErrorForFrameCallback               didFailProvisionalLoadWithErrorForFrame;
    WKPageDidCommitLoadForFrameCallback                                 didCommitLoadForFrame;
    WKPageDidFinishDocumentLoadForFrameCallback                         didFinishDocumentLoadForFrame;
    WKPageDidFinishLoadForFrameCallback                                 didFinishLoadForFrame;
    WKPageDidFailLoadWithErrorForFrameCallback                          didFailLoadWithErrorForFrame;
    WKPageDidSameDocumentNavigationForFrameCallback                     didSameDocumentNavigationForFrame;
    WKPageDidReceiveTitleForFrameCallback                               didReceiveTitleForFrame;
    WKPageDidFirstLayoutForFrameCallback                                didFirstLayoutForFrame;
    WKPageDidFirstVisuallyNonEmptyLayoutForFrameCallback                didFirstVisuallyNonEmptyLayoutForFrame;
    WKPageDidRemoveFrameFromHierarchyCallback                           didRemoveFrameFromHierarchy;
    WKPageDidDisplayInsecureContentForFrameCallback                     didDisplayInsecureContentForFrame;
    WKPageDidRunInsecureContentForFrameCallback                         didRunInsecureContentForFrame;
    WKPageCanAuthenticateAgainstProtectionSpaceInFrameCallback          canAuthenticateAgainstProtectionSpaceInFrame;
    WKPageDidReceiveAuthenticationChallengeInFrameCallback              didReceiveAuthenticationChallengeInFrame;

    // FIXME: Move to progress client.
    WKPageLoaderClientCallback                                          didStartProgress;
    WKPageLoaderClientCallback                                          didChangeProgress;
    WKPageLoaderClientCallback                                          didFinishProgress;

    // FIXME: These three functions should not be part of this client.
    WKPageLoaderClientCallback                                          processDidBecomeUnresponsive;
    WKPageLoaderClientCallback                                          processDidBecomeResponsive;
    WKPageLoaderClientCallback                                          processDidCrash;
    WKPageDidChangeBackForwardListCallback                              didChangeBackForwardList;
    WKPageShouldGoToBackForwardListItemCallback                         shouldGoToBackForwardListItem;
    WKPageDidFailToInitializePluginCallback_deprecatedForUseWithV0      didFailToInitializePlugin_deprecatedForUseWithV0;

    // Version 1.
    WKPageDidDetectXSSForFrameCallback                                  didDetectXSSForFrame;

    void*                                                               didNewFirstVisuallyNonEmptyLayout_unavailable;

    WKPageWillGoToBackForwardListItemCallback                           willGoToBackForwardListItem;

    WKPageLoaderClientCallback                                          interactionOccurredWhileProcessUnresponsive;
    WKPagePluginDidFailCallback_deprecatedForUseWithV1                  pluginDidFail_deprecatedForUseWithV1;

    // Version 2.
    void                                                                (*didReceiveIntentForFrame_unavailable)(void);
    void                                                                (*registerIntentServiceForFrame_unavailable)(void);

    WKPageDidLayoutCallback                                             didLayout;
    WKPagePluginLoadPolicyCallback_deprecatedForUseWithV2               pluginLoadPolicy_deprecatedForUseWithV2;
    WKPagePluginDidFailCallback                                         pluginDidFail;
} WKPageLoaderClientV2;

typedef struct WKPageLoaderClientV3 {
    WKPageLoaderClientBase                                              base;

    // Version 0.
    WKPageDidStartProvisionalLoadForFrameCallback                       didStartProvisionalLoadForFrame;
    WKPageDidReceiveServerRedirectForProvisionalLoadForFrameCallback    didReceiveServerRedirectForProvisionalLoadForFrame;
    WKPageDidFailProvisionalLoadWithErrorForFrameCallback               didFailProvisionalLoadWithErrorForFrame;
    WKPageDidCommitLoadForFrameCallback                                 didCommitLoadForFrame;
    WKPageDidFinishDocumentLoadForFrameCallback                         didFinishDocumentLoadForFrame;
    WKPageDidFinishLoadForFrameCallback                                 didFinishLoadForFrame;
    WKPageDidFailLoadWithErrorForFrameCallback                          didFailLoadWithErrorForFrame;
    WKPageDidSameDocumentNavigationForFrameCallback                     didSameDocumentNavigationForFrame;
    WKPageDidReceiveTitleForFrameCallback                               didReceiveTitleForFrame;
    WKPageDidFirstLayoutForFrameCallback                                didFirstLayoutForFrame;
    WKPageDidFirstVisuallyNonEmptyLayoutForFrameCallback                didFirstVisuallyNonEmptyLayoutForFrame;
    WKPageDidRemoveFrameFromHierarchyCallback                           didRemoveFrameFromHierarchy;
    WKPageDidDisplayInsecureContentForFrameCallback                     didDisplayInsecureContentForFrame;
    WKPageDidRunInsecureContentForFrameCallback                         didRunInsecureContentForFrame;
    WKPageCanAuthenticateAgainstProtectionSpaceInFrameCallback          canAuthenticateAgainstProtectionSpaceInFrame;
    WKPageDidReceiveAuthenticationChallengeInFrameCallback              didReceiveAuthenticationChallengeInFrame;

    // FIXME: Move to progress client.
    WKPageLoaderClientCallback                                          didStartProgress;
    WKPageLoaderClientCallback                                          didChangeProgress;
    WKPageLoaderClientCallback                                          didFinishProgress;

    // FIXME: These three functions should not be part of this client.
    WKPageLoaderClientCallback                                          processDidBecomeUnresponsive;
    WKPageLoaderClientCallback                                          processDidBecomeResponsive;
    WKPageLoaderClientCallback                                          processDidCrash;
    WKPageDidChangeBackForwardListCallback                              didChangeBackForwardList;
    WKPageShouldGoToBackForwardListItemCallback                         shouldGoToBackForwardListItem;
    WKPageDidFailToInitializePluginCallback_deprecatedForUseWithV0      didFailToInitializePlugin_deprecatedForUseWithV0;

    // Version 1.
    WKPageDidDetectXSSForFrameCallback                                  didDetectXSSForFrame;

    void*                                                               didNewFirstVisuallyNonEmptyLayout_unavailable;

    WKPageWillGoToBackForwardListItemCallback                           willGoToBackForwardListItem;

    WKPageLoaderClientCallback                                          interactionOccurredWhileProcessUnresponsive;
    WKPagePluginDidFailCallback_deprecatedForUseWithV1                  pluginDidFail_deprecatedForUseWithV1;

    // Version 2.
    void                                                                (*didReceiveIntentForFrame_unavailable)(void);
    void                                                                (*registerIntentServiceForFrame_unavailable)(void);

    WKPageDidLayoutCallback                                             didLayout;
    WKPagePluginLoadPolicyCallback_deprecatedForUseWithV2               pluginLoadPolicy_deprecatedForUseWithV2;
    WKPagePluginDidFailCallback                                         pluginDidFail;

    // Version 3.
    WKPagePluginLoadPolicyCallback                                      pluginLoadPolicy;
} WKPageLoaderClientV3;

typedef struct WKPageLoaderClientV4 {
    WKPageLoaderClientBase                                              base;
    
    // Version 0.
    WKPageDidStartProvisionalLoadForFrameCallback                       didStartProvisionalLoadForFrame;
    WKPageDidReceiveServerRedirectForProvisionalLoadForFrameCallback    didReceiveServerRedirectForProvisionalLoadForFrame;
    WKPageDidFailProvisionalLoadWithErrorForFrameCallback               didFailProvisionalLoadWithErrorForFrame;
    WKPageDidCommitLoadForFrameCallback                                 didCommitLoadForFrame;
    WKPageDidFinishDocumentLoadForFrameCallback                         didFinishDocumentLoadForFrame;
    WKPageDidFinishLoadForFrameCallback                                 didFinishLoadForFrame;
    WKPageDidFailLoadWithErrorForFrameCallback                          didFailLoadWithErrorForFrame;
    WKPageDidSameDocumentNavigationForFrameCallback                     didSameDocumentNavigationForFrame;
    WKPageDidReceiveTitleForFrameCallback                               didReceiveTitleForFrame;
    WKPageDidFirstLayoutForFrameCallback                                didFirstLayoutForFrame;
    WKPageDidFirstVisuallyNonEmptyLayoutForFrameCallback                didFirstVisuallyNonEmptyLayoutForFrame;
    WKPageDidRemoveFrameFromHierarchyCallback                           didRemoveFrameFromHierarchy;
    WKPageDidDisplayInsecureContentForFrameCallback                     didDisplayInsecureContentForFrame;
    WKPageDidRunInsecureContentForFrameCallback                         didRunInsecureContentForFrame;
    WKPageCanAuthenticateAgainstProtectionSpaceInFrameCallback          canAuthenticateAgainstProtectionSpaceInFrame;
    WKPageDidReceiveAuthenticationChallengeInFrameCallback              didReceiveAuthenticationChallengeInFrame;
    
    // FIXME: Move to progress client.
    WKPageLoaderClientCallback                                          didStartProgress;
    WKPageLoaderClientCallback                                          didChangeProgress;
    WKPageLoaderClientCallback                                          didFinishProgress;
    
    // FIXME: These three functions should not be part of this client.
    WKPageLoaderClientCallback                                          processDidBecomeUnresponsive;
    WKPageLoaderClientCallback                                          processDidBecomeResponsive;
    WKPageLoaderClientCallback                                          processDidCrash;
    WKPageDidChangeBackForwardListCallback                              didChangeBackForwardList;
    WKPageShouldGoToBackForwardListItemCallback                         shouldGoToBackForwardListItem;
    WKPageDidFailToInitializePluginCallback_deprecatedForUseWithV0      didFailToInitializePlugin_deprecatedForUseWithV0;
    
    // Version 1.
    WKPageDidDetectXSSForFrameCallback                                  didDetectXSSForFrame;
    
    void*                                                               didNewFirstVisuallyNonEmptyLayout_unavailable;
    
    WKPageWillGoToBackForwardListItemCallback                           willGoToBackForwardListItem;
    
    WKPageLoaderClientCallback                                          interactionOccurredWhileProcessUnresponsive;
    WKPagePluginDidFailCallback_deprecatedForUseWithV1                  pluginDidFail_deprecatedForUseWithV1;
    
    // Version 2.
    void                                                                (*didReceiveIntentForFrame_unavailable)(void);
    void                                                                (*registerIntentServiceForFrame_unavailable)(void);
    
    WKPageDidLayoutCallback                                             didLayout;
    WKPagePluginLoadPolicyCallback_deprecatedForUseWithV2               pluginLoadPolicy_deprecatedForUseWithV2;
    WKPagePluginDidFailCallback                                         pluginDidFail;
    
    // Version 3.
    WKPagePluginLoadPolicyCallback                                      pluginLoadPolicy;
    
    // Version 4
    WKPageWebGLLoadPolicyCallback                                       webGLLoadPolicy;
    WKPageWebGLLoadPolicyCallback                                       resolveWebGLLoadPolicy;
} WKPageLoaderClientV4;

typedef struct WKPageLoaderClientV5 {
    WKPageLoaderClientBase                                              base;

    // Version 0.
    WKPageDidStartProvisionalLoadForFrameCallback                       didStartProvisionalLoadForFrame;
    WKPageDidReceiveServerRedirectForProvisionalLoadForFrameCallback    didReceiveServerRedirectForProvisionalLoadForFrame;
    WKPageDidFailProvisionalLoadWithErrorForFrameCallback               didFailProvisionalLoadWithErrorForFrame;
    WKPageDidCommitLoadForFrameCallback                                 didCommitLoadForFrame;
    WKPageDidFinishDocumentLoadForFrameCallback                         didFinishDocumentLoadForFrame;
    WKPageDidFinishLoadForFrameCallback                                 didFinishLoadForFrame;
    WKPageDidFailLoadWithErrorForFrameCallback                          didFailLoadWithErrorForFrame;
    WKPageDidSameDocumentNavigationForFrameCallback                     didSameDocumentNavigationForFrame;
    WKPageDidReceiveTitleForFrameCallback                               didReceiveTitleForFrame;
    WKPageDidFirstLayoutForFrameCallback                                didFirstLayoutForFrame;
    WKPageDidFirstVisuallyNonEmptyLayoutForFrameCallback                didFirstVisuallyNonEmptyLayoutForFrame;
    WKPageDidRemoveFrameFromHierarchyCallback                           didRemoveFrameFromHierarchy;
    WKPageDidDisplayInsecureContentForFrameCallback                     didDisplayInsecureContentForFrame;
    WKPageDidRunInsecureContentForFrameCallback                         didRunInsecureContentForFrame;
    WKPageCanAuthenticateAgainstProtectionSpaceInFrameCallback          canAuthenticateAgainstProtectionSpaceInFrame;
    WKPageDidReceiveAuthenticationChallengeInFrameCallback              didReceiveAuthenticationChallengeInFrame;

    // FIXME: Move to progress client.
    WKPageLoaderClientCallback                                          didStartProgress;
    WKPageLoaderClientCallback                                          didChangeProgress;
    WKPageLoaderClientCallback                                          didFinishProgress;

    // FIXME: These three functions should not be part of this client.
    WKPageLoaderClientCallback                                          processDidBecomeUnresponsive;
    WKPageLoaderClientCallback                                          processDidBecomeResponsive;
    WKPageLoaderClientCallback                                          processDidCrash;
    WKPageDidChangeBackForwardListCallback                              didChangeBackForwardList;
    WKPageShouldGoToBackForwardListItemCallback                         shouldGoToBackForwardListItem;
    WKPageDidFailToInitializePluginCallback_deprecatedForUseWithV0      didFailToInitializePlugin_deprecatedForUseWithV0;

    // Version 1.
    WKPageDidDetectXSSForFrameCallback                                  didDetectXSSForFrame;

    void*                                                               didNewFirstVisuallyNonEmptyLayout_unavailable;

    WKPageWillGoToBackForwardListItemCallback                           willGoToBackForwardListItem;

    WKPageLoaderClientCallback                                          interactionOccurredWhileProcessUnresponsive;
    WKPagePluginDidFailCallback_deprecatedForUseWithV1                  pluginDidFail_deprecatedForUseWithV1;

    // Version 2.
    void                                                                (*didReceiveIntentForFrame_unavailable)(void);
    void                                                                (*registerIntentServiceForFrame_unavailable)(void);

    WKPageDidLayoutCallback                                             didLayout;
    WKPagePluginLoadPolicyCallback_deprecatedForUseWithV2               pluginLoadPolicy_deprecatedForUseWithV2;
    WKPagePluginDidFailCallback                                         pluginDidFail;

    // Version 3.
    WKPagePluginLoadPolicyCallback                                      pluginLoadPolicy;

    // Version 4.
    WKPageWebGLLoadPolicyCallback                                       webGLLoadPolicy;
    WKPageWebGLLoadPolicyCallback                                       resolveWebGLLoadPolicy;

    // Version 5.
    WKPageShouldKeepCurrentBackForwardListItemInListCallback            shouldKeepCurrentBackForwardListItemInList;
} WKPageLoaderClientV5;

typedef struct WKPageLoaderClientV6 {
    WKPageLoaderClientBase                                              base;

    // Version 0.
    WKPageDidStartProvisionalLoadForFrameCallback                       didStartProvisionalLoadForFrame;
    WKPageDidReceiveServerRedirectForProvisionalLoadForFrameCallback    didReceiveServerRedirectForProvisionalLoadForFrame;
    WKPageDidFailProvisionalLoadWithErrorForFrameCallback               didFailProvisionalLoadWithErrorForFrame;
    WKPageDidCommitLoadForFrameCallback                                 didCommitLoadForFrame;
    WKPageDidFinishDocumentLoadForFrameCallback                         didFinishDocumentLoadForFrame;
    WKPageDidFinishLoadForFrameCallback                                 didFinishLoadForFrame;
    WKPageDidFailLoadWithErrorForFrameCallback                          didFailLoadWithErrorForFrame;
    WKPageDidSameDocumentNavigationForFrameCallback                     didSameDocumentNavigationForFrame;
    WKPageDidReceiveTitleForFrameCallback                               didReceiveTitleForFrame;
    WKPageDidFirstLayoutForFrameCallback                                didFirstLayoutForFrame;
    WKPageDidFirstVisuallyNonEmptyLayoutForFrameCallback                didFirstVisuallyNonEmptyLayoutForFrame;
    WKPageDidRemoveFrameFromHierarchyCallback                           didRemoveFrameFromHierarchy;
    WKPageDidDisplayInsecureContentForFrameCallback                     didDisplayInsecureContentForFrame;
    WKPageDidRunInsecureContentForFrameCallback                         didRunInsecureContentForFrame;
    WKPageCanAuthenticateAgainstProtectionSpaceInFrameCallback          canAuthenticateAgainstProtectionSpaceInFrame;
    WKPageDidReceiveAuthenticationChallengeInFrameCallback              didReceiveAuthenticationChallengeInFrame;

    // FIXME: Move to progress client.
    WKPageLoaderClientCallback                                          didStartProgress;
    WKPageLoaderClientCallback                                          didChangeProgress;
    WKPageLoaderClientCallback                                          didFinishProgress;

    // FIXME: These three functions should not be part of this client.
    WKPageLoaderClientCallback                                          processDidBecomeUnresponsive;
    WKPageLoaderClientCallback                                          processDidBecomeResponsive;
    WKPageLoaderClientCallback                                          processDidCrash;
    WKPageDidChangeBackForwardListCallback                              didChangeBackForwardList;
    WKPageShouldGoToBackForwardListItemCallback                         shouldGoToBackForwardListItem;
    WKPageDidFailToInitializePluginCallback_deprecatedForUseWithV0      didFailToInitializePlugin_deprecatedForUseWithV0;

    // Version 1.
    WKPageDidDetectXSSForFrameCallback                                  didDetectXSSForFrame;

    void*                                                               didNewFirstVisuallyNonEmptyLayout_unavailable;

    WKPageWillGoToBackForwardListItemCallback                           willGoToBackForwardListItem;

    WKPageLoaderClientCallback                                          interactionOccurredWhileProcessUnresponsive;
    WKPagePluginDidFailCallback_deprecatedForUseWithV1                  pluginDidFail_deprecatedForUseWithV1;

    // Version 2.
    void                                                                (*didReceiveIntentForFrame_unavailable)(void);
    void                                                                (*registerIntentServiceForFrame_unavailable)(void);

    WKPageDidLayoutCallback                                             didLayout;
    WKPagePluginLoadPolicyCallback_deprecatedForUseWithV2               pluginLoadPolicy_deprecatedForUseWithV2;
    WKPagePluginDidFailCallback                                         pluginDidFail;

    // Version 3.
    WKPagePluginLoadPolicyCallback                                      pluginLoadPolicy;

    // Version 4.
    WKPageWebGLLoadPolicyCallback                                       webGLLoadPolicy;
    WKPageWebGLLoadPolicyCallback                                       resolveWebGLLoadPolicy;
    
    // Version 5.
    WKPageShouldKeepCurrentBackForwardListItemInListCallback            shouldKeepCurrentBackForwardListItemInList;

    // Version 6.
    WKPageNavigationGestureDidBeginCallback                             navigationGestureDidBegin;
    WKPageNavigationGestureWillEndCallback                              navigationGestureWillEnd;
    WKPageNavigationGestureDidEndCallback                               navigationGestureDidEnd;
} WKPageLoaderClientV6;

#ifdef __cplusplus
}
#endif

#endif // WKPageLoaderClient_h
