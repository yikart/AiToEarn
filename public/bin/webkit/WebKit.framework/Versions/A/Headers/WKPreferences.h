/*
 * Copyright (C) 2014-2020 Apple Inc. All rights reserved.
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

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <WebKit/WKFoundation.h>

/*! A WKPreferences object encapsulates the preference settings for a web
 view. The preferences object associated with a web view is specified by
 its web view configuration.
 */
WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface WKPreferences : NSObject <NSSecureCoding>

/*! @abstract The minimum font size in points.
 @discussion The default value is 0.
 */
@property (nonatomic) CGFloat minimumFontSize;

/*! @abstract A Boolean value indicating whether JavaScript can open
 windows without user interaction.
 @discussion The default value is NO in iOS and YES in OS X.
 */
@property (nonatomic) BOOL javaScriptCanOpenWindowsAutomatically;

/*! @abstract A Boolean value indicating whether warnings should be
 shown for suspected fraudulent content such as phishing or malware.
 @discussion The default value is YES.
 */
@property (nonatomic, getter=isFraudulentWebsiteWarningEnabled) BOOL fraudulentWebsiteWarningEnabled WK_API_AVAILABLE(macos(10.15), ios(13.0));

/*! @abstract A Boolean value indicating whether the web view should include backgrounds when printing.
 @discussion The default value is `NO`.
 */
@property (nonatomic) BOOL shouldPrintBackgrounds WK_API_AVAILABLE(macos(13.3), ios(16.4));

#if !TARGET_OS_IPHONE
/*!
 @property tabFocusesLinks
 @abstract If tabFocusesLinks is YES, the tab key will focus links and form controls.
 The Option key temporarily reverses this preference.
 */
@property (nonatomic) BOOL tabFocusesLinks WK_API_AVAILABLE(macos(10.12.4));
#endif

/*! @abstract A Boolean value indicating whether text interaction is disabled.
*/
@property (nonatomic, getter=isTextInteractionEnabled) BOOL textInteractionEnabled WK_API_AVAILABLE(macos(11.3), ios(14.5));

/*! @abstract A Boolean value indicating whether WebKit will apply built-in workarounds (quirks)
 to improve compatibility with certain known websites. You can disable site-specific quirks
 to help test your website without these workarounds. Enabled by default.
 */
@property (nonatomic, getter=isSiteSpecificQuirksModeEnabled) BOOL siteSpecificQuirksModeEnabled WK_API_AVAILABLE(macos(12.3), ios(15.4));

/*! @abstract A Boolean value indicating whether Fullscreen API is enabled.
 @discussion The default value is NO. We can set it to YES to enable support for the fullscreen API.
 */
@property (nonatomic, getter=isElementFullscreenEnabled) BOOL elementFullscreenEnabled WK_API_AVAILABLE(macos(12.3), ios(15.4), tvos(17.0));

/*
@enum WKInactiveSchedulingPolicy
@abstract An enum that represents the available options for scheduling behavior when a web view is idle and detached from all windows.
@discussion The WKInactiveSchedulingSuspend case indicates that the web view should be fully suspended when idle. The WKInactiveSchedulingThrottle case indicates that the web view should be CPU-throttled when idle, but not fully suspended. The WKInactiveSchedulingNone case indicates that no special scheduling behavior should be applied, and the web view should continue running normally even when idle.
*/
typedef NS_ENUM(NSInteger, WKInactiveSchedulingPolicy) {
    WKInactiveSchedulingPolicySuspend,
    WKInactiveSchedulingPolicyThrottle,
    WKInactiveSchedulingPolicyNone
} NS_SWIFT_NAME(WKPreferences.InactiveSchedulingPolicy) WK_API_AVAILABLE(macos(14.0), ios(17.0));

/*! @abstract Specify the scheduling policy for the web view when it is inactive
 and detached from the view hierarchy. Web views are not considered idle when playing media or loading web pages.
 A suspended web view will pause JavaScript execution and page layout.
 */
@property (nonatomic) WKInactiveSchedulingPolicy inactiveSchedulingPolicy WK_API_AVAILABLE(macos(14.0), ios(17.0));

@end

@interface WKPreferences (WKDeprecated)

#if !TARGET_OS_IPHONE
@property (nonatomic) BOOL javaEnabled WK_API_DEPRECATED("Java is no longer supported", macos(10.10, 10.15));
@property (nonatomic) BOOL plugInsEnabled WK_API_DEPRECATED("Plug-ins are no longer supported", macos(10.10, 10.15));
#endif

@property (nonatomic) BOOL javaScriptEnabled WK_API_DEPRECATED("Use WKWebpagePreferences.allowsContentJavaScript to disable content JavaScript on a per-navigation basis", macos(10.10, 11.0), ios(8.0, 14.0));



@end
