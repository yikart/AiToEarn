/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#import <WebKit/WKNavigationAction.h>

@class WKNavigation;
@class _WKHitTestResult;
@class _WKUserInitiatedAction;

#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, WKSyntheticClickType) {
    WKSyntheticClickTypeNoTap,
    WKSyntheticClickTypeOneFingerTap,
    WKSyntheticClickTypeTwoFingerTap
} WK_API_AVAILABLE(ios(10.0));
#endif

@interface WKNavigationAction (WKPrivate)

@property (nonatomic, readonly) NSURL *_originalURL;
@property (nonatomic, readonly, getter=_isUserInitiated) BOOL _userInitiated;
@property (nonatomic, readonly) BOOL _canHandleRequest;
@property (nonatomic, readonly) BOOL _shouldOpenExternalSchemes WK_API_AVAILABLE(macos(10.11), ios(9.0));
@property (nonatomic, readonly) BOOL _shouldOpenAppLinks WK_API_AVAILABLE(macos(10.11), ios(9.0));
@property (nonatomic, readonly) BOOL _shouldPerformDownload WK_API_DEPRECATED_WITH_REPLACEMENT("downloadAttribute", macos(10.15, 12.0), ios(13.0, 15.0));
@property (nonatomic, readonly) NSString *_targetFrameName WK_API_AVAILABLE(macos(14.2), ios(17.2));

@property (nonatomic, readonly) BOOL _shouldOpenExternalURLs WK_API_DEPRECATED("use _shouldOpenExternalSchemes and _shouldOpenAppLinks", macos(10.11, 10.11), ios(9.0, 9.0));

@property (nonatomic, readonly) _WKUserInitiatedAction *_userInitiatedAction WK_API_AVAILABLE(macos(10.12), ios(10.0));

#if TARGET_OS_IPHONE
@property (nonatomic, readonly) WKSyntheticClickType _syntheticClickType WK_API_AVAILABLE(ios(10.0));
@property (nonatomic, readonly) CGPoint _clickLocationInRootViewCoordinates WK_API_AVAILABLE(ios(11.0));
#endif

@property (nonatomic, readonly) BOOL _isRedirect WK_API_AVAILABLE(macos(10.13), ios(11.0));
@property (nonatomic, readonly) WKNavigation *_mainFrameNavigation WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
- (void)_storeSKAdNetworkAttribution WK_API_AVAILABLE(macos(13.0), ios(16.1));

@property (nonatomic, readonly) _WKHitTestResult *_hitTestResult WK_API_AVAILABLE(macos(13.3), ios(16.4));

@property (nonatomic, readonly) BOOL _hasOpener WK_API_AVAILABLE(macos(13.3), ios(16.4));

@end
