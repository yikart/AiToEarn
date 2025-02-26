/*
 * Copyright (C) 2011 Apple Inc. All rights reserved.
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

#ifndef WKPagePrivateMac_h
#define WKPagePrivateMac_h

#include <WebKit/WKBase.h>
#include <sys/types.h>

#ifdef __cplusplus
extern "C" {
#endif

#ifdef __OBJC__

@class WKWebView;
@class _WKRemoteObjectRegistry;

@protocol _WKObservablePageState

@property (nonatomic, readonly, copy) NSString *title;
@property (nonatomic, readonly, copy) NSURL *URL;
@property (nonatomic, readonly, getter=isLoading) BOOL loading;
@property (nonatomic, readonly) double estimatedProgress;
@property (nonatomic, readonly) BOOL hasOnlySecureContent;
@property (nonatomic, readonly) BOOL _webProcessIsResponsive;

// Not KVO compliant.
@property (nonatomic, readonly) NSURL *unreachableURL;
@property (nonatomic, readonly) SecTrustRef serverTrust;

@end

WK_EXPORT id <_WKObservablePageState> WKPageCreateObservableState(WKPageRef page) NS_RETURNS_RETAINED;
WK_EXPORT _WKRemoteObjectRegistry *WKPageGetObjectRegistry(WKPageRef page);

@protocol _WKFullscreenDelegate;
WK_EXPORT void WKPageSetFullscreenDelegate(WKPageRef page, id <_WKFullscreenDelegate>);
WK_EXPORT id <_WKFullscreenDelegate> WKPageGetFullscreenDelegate(WKPageRef page);

@class WKNavigation;
WK_EXPORT WKNavigation *WKPageLoadURLRequestReturningNavigation(WKPageRef page, WKURLRequestRef request);
WK_EXPORT WKNavigation *WKPageLoadFileReturningNavigation(WKPageRef page, WKURLRef fileURL, WKURLRef resourceDirectoryURL);

WK_EXPORT WKWebView *WKPageGetWebView(WKPageRef page);

#endif // __OBJC__

WK_EXPORT bool WKPageIsURLKnownHSTSHost(WKPageRef page, WKURLRef url);

#if !TARGET_OS_IPHONE
WK_EXPORT bool WKPageIsPlayingVideoInEnhancedFullscreen(WKPageRef page);
#endif

#ifdef __cplusplus
}
#endif

#endif /* WKPagePrivateMac_h */
