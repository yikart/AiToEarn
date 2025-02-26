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

#import <WebKit/WKFoundation.h>

#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#else
#import <AppKit/AppKit.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@class WKFrameInfo;

/*! @enum WKNavigationType
 @abstract The type of action triggering a navigation.
 @constant WKNavigationTypeLinkActivated    A link with an href attribute was activated.
 @constant WKNavigationTypeFormSubmitted    A form was submitted.
 @constant WKNavigationTypeBackForward      An item from the back-forward list was requested.
 @constant WKNavigationTypeReload           The webpage was reloaded.
 @constant WKNavigationTypeFormResubmitted  A form was resubmitted (for example by going back, going forward, or reloading).
 @constant WKNavigationTypeOther            Navigation is taking place for some other reason.
 */
typedef NS_ENUM(NSInteger, WKNavigationType) {
    WKNavigationTypeLinkActivated,
    WKNavigationTypeFormSubmitted,
    WKNavigationTypeBackForward,
    WKNavigationTypeReload,
    WKNavigationTypeFormResubmitted,
    WKNavigationTypeOther = -1,
} WK_API_AVAILABLE(macos(10.10), ios(8.0));

/*! 
A WKNavigationAction object contains information about an action that may cause a navigation, used for making policy decisions.
 */
WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface WKNavigationAction : NSObject

/*! @abstract The frame requesting the navigation.
 */
@property (nonatomic, readonly, copy) WKFrameInfo *sourceFrame;

/*! @abstract The target frame, or nil if this is a new window navigation.
 */
@property (nullable, nonatomic, readonly, copy) WKFrameInfo *targetFrame;

/*! @abstract The type of action that triggered the navigation.
 @discussion The value is one of the constants of the enumerated type WKNavigationType.
 */
@property (nonatomic, readonly) WKNavigationType navigationType;

/*! @abstract The navigation's request.
 */
@property (nonatomic, readonly, copy) NSURLRequest *request;

/*! @abstract A value indicating whether the web content used a download attribute to indicate that this should be downloaded.
*/
@property (nonatomic, readonly) BOOL shouldPerformDownload WK_API_AVAILABLE(macos(11.3), ios(14.5));

#if TARGET_OS_IPHONE

/*! @abstract The modifier keys that were in effect when the navigation was requested.
 */
@property (nonatomic, readonly) UIKeyModifierFlags modifierFlags WK_API_AVAILABLE(ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*! @abstract The button mask of the index of the mouse button causing the navigation to be requested.
 */
@property (nonatomic, readonly) UIEventButtonMask buttonNumber WK_API_AVAILABLE(ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

#else

/*! @abstract The modifier keys that were in effect when the navigation was requested.
 */
@property (nonatomic, readonly) NSEventModifierFlags modifierFlags;

/*! @abstract The number of the mouse button causing the navigation to be requested.
 */
@property (nonatomic, readonly) NSInteger buttonNumber;

#endif

@end

NS_ASSUME_NONNULL_END
