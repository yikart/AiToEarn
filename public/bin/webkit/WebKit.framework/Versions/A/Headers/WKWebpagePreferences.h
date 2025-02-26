/*
 * Copyright (C) 2019-2020 Apple Inc. All rights reserved.
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

#import <Foundation/Foundation.h>
#import <WebKit/WKFoundation.h>

/*! @enum WKContentMode
 @abstract A content mode represents the type of content to load, as well as
 additional layout and rendering adaptations that are applied as a result of
 loading the content
 @constant WKContentModeRecommended  The recommended content mode for the current platform
 @constant WKContentModeMobile       Represents content targeting mobile browsers
 @constant WKContentModeDesktop      Represents content targeting desktop browsers
 @discussion WKContentModeRecommended behaves like WKContentModeMobile on iPhone and iPad mini
 and WKContentModeDesktop on other iPad models as well as Mac.
 */
typedef NS_ENUM(NSInteger, WKContentMode) {
    WKContentModeRecommended,
    WKContentModeMobile,
    WKContentModeDesktop
} WK_API_AVAILABLE(ios(13.0));

/*! @enum WKWebpagePreferencesUpgradeToHTTPSPolicy
 @abstract A secure navigation policy represents whether or not there is a
 preference for loading a webpage with https, and how failures should be
 handled.
 @constant WKWebpagePreferencesUpgradeToHTTPSPolicyKeepAsRequested             Maintains the current behavior without preferring https
 @constant WKWebpagePreferencesUpgradeToHTTPSPolicyAutomaticFallbackToHTTP     Upgrades http requests to https, and re-attempts the request with http on failure
 @constant WKWebpagePreferencesUpgradeToHTTPSPolicyUserMediatedFallbackToHTTP  Upgrades http requests to https, and shows a warning page on failure
 @constant WKWebpagePreferencesUpgradeToHTTPSPolicyErrorOnFailure              Upgrades http requests to https, and returns an error on failure
 */
typedef NS_ENUM(NSInteger, WKWebpagePreferencesUpgradeToHTTPSPolicy) {
    WKWebpagePreferencesUpgradeToHTTPSPolicyKeepAsRequested,
    WKWebpagePreferencesUpgradeToHTTPSPolicyAutomaticFallbackToHTTP,
    WKWebpagePreferencesUpgradeToHTTPSPolicyUserMediatedFallbackToHTTP,
    WKWebpagePreferencesUpgradeToHTTPSPolicyErrorOnFailure
} NS_SWIFT_NAME(WKWebpagePreferences.UpgradeToHTTPSPolicy) WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*! A WKWebpagePreferences object is a collection of properties that
 determine the preferences to use when loading and rendering a page.
 @discussion Contains properties used to determine webpage preferences.
 */
WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(10.15), ios(13.0))
@interface WKWebpagePreferences : NSObject

/*! @abstract A WKContentMode indicating the content mode to prefer
 when loading and rendering a webpage.
 @discussion The default value is WKContentModeRecommended. The stated
 preference is ignored on subframe navigation
 */
@property (nonatomic) WKContentMode preferredContentMode WK_API_AVAILABLE(ios(13.0));

/* @abstract A Boolean value indicating whether JavaScript from web content is enabled
 @discussion If this value is set to NO then JavaScript referenced by the web content will not execute.
 This includes JavaScript found in inline <script> elements, referenced by external JavaScript resources,
 "javascript:" URLs, and all other forms.

 Even if this value is set to NO your application can still execute JavaScript using:
 - [WKWebView evaluteJavaScript:completionHandler:]
 - [WKWebView evaluteJavaScript:inContentWorld:completionHandler:]
 - [WKWebView callAsyncJavaScript:arguments:inContentWorld:completionHandler:]
 - WKUserScripts

 The default value is YES.
*/
@property (nonatomic) BOOL allowsContentJavaScript WK_API_AVAILABLE(macos(11.0), ios(14.0));

/*! @abstract A boolean indicating whether lockdown mode is enabled.
 @discussion This mode trades off performance and compatibility in favor of security.
 The default value depends on the system setting.
 */
@property (nonatomic, getter=isLockdownModeEnabled) BOOL lockdownModeEnabled WK_API_AVAILABLE(macos(13.0), ios(16.0));

/*! @abstract A WKWebpagePreferencesUpgradeToHTTPSPolicy indicating the desired mode
 used when performing a top-level navigation to a webpage.
 @discussion The default value is WKWebpagePreferencesUpgradeToHTTPSPolicyKeepAsRequested.
 The stated preference is ignored on subframe navigation, and it may be ignored based on
 system configuration. The upgradeKnownHostsToHTTPS property on WKWebViewConfiguration
 supercedes this policy for known hosts.
 */
@property (nonatomic) WKWebpagePreferencesUpgradeToHTTPSPolicy preferredHTTPSNavigationPolicy WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

@end
