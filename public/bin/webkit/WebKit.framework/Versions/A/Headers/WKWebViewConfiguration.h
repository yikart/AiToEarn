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

#import <Foundation/Foundation.h>
#import <WebKit/WKDataDetectorTypes.h>
#import <WebKit/WKFoundation.h>

#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#else
#import <AppKit/AppKit.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@class WKPreferences;
@class WKProcessPool;
@class WKUserContentController;
@class WKWebExtensionController;
@class WKWebpagePreferences;
@class WKWebsiteDataStore;

@protocol WKURLSchemeHandler;

#if TARGET_OS_IPHONE

/*! @enum WKSelectionGranularity
 @abstract The granularity with which a selection can be created and modified interactively.
 @constant WKSelectionGranularityDynamic    Selection granularity varies automatically based on the selection.
 @constant WKSelectionGranularityCharacter  Selection endpoints can be placed at any character boundary.
 @discussion An example of how granularity may vary when WKSelectionGranularityDynamic is used is
 that when the selection is within a single block, the granularity may be single character, and when
 the selection is not confined to a single block, the selection granularity may be single block.
 */
typedef NS_ENUM(NSInteger, WKSelectionGranularity) {
    WKSelectionGranularityDynamic,
    WKSelectionGranularityCharacter,
} WK_API_AVAILABLE(ios(8.0));

#else

/*! @enum WKUserInterfaceDirectionPolicy
 @abstract The policy used to determine the directionality of user interface elements inside a web view.
 @constant WKUserInterfaceDirectionPolicyContent User interface directionality follows CSS / HTML / XHTML
 specifications.
 @constant WKUserInterfaceDirectionPolicySystem User interface directionality follows the view's
 userInterfaceLayoutDirection property
 @discussion When WKUserInterfaceDirectionPolicyContent is specified, the directionality of user interface
 elements is affected by the "dir" attribute or the "direction" CSS property. When
 WKUserInterfaceDirectionPolicySystem is specified, the directionality of user interface elements is
 affected by the direction of the view.
*/
typedef NS_ENUM(NSInteger, WKUserInterfaceDirectionPolicy) {
    WKUserInterfaceDirectionPolicyContent,
    WKUserInterfaceDirectionPolicySystem,
} WK_API_AVAILABLE(macos(10.12));

#endif

/*! @enum WKAudiovisualMediaTypes
 @abstract The types of audiovisual media which will require a user gesture to begin playing.
 @constant WKAudiovisualMediaTypeNone No audiovisual media will require a user gesture to begin playing.
 @constant WKAudiovisualMediaTypeAudio Audiovisual media containing audio will require a user gesture to begin playing.
 @constant WKAudiovisualMediaTypeVideo Audiovisual media containing video will require a user gesture to begin playing.
 @constant WKAudiovisualMediaTypeAll All audiovisual media will require a user gesture to begin playing.
*/
typedef NS_OPTIONS(NSUInteger, WKAudiovisualMediaTypes) {
    WKAudiovisualMediaTypeNone = 0,
    WKAudiovisualMediaTypeAudio = 1 << 0,
    WKAudiovisualMediaTypeVideo = 1 << 1,
    WKAudiovisualMediaTypeAll = NSUIntegerMax
} WK_API_AVAILABLE(macos(10.12), ios(10.0));

/*! A WKWebViewConfiguration object is a collection of properties with
 which to initialize a web view.
 @helps Contains properties used to configure a @link WKWebView @/link.
 */
WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface WKWebViewConfiguration : NSObject <NSSecureCoding, NSCopying>

/*! @abstract The process pool from which to obtain the view's web content
 process.
 @discussion When a web view is initialized, a new web content process
 will be created for it from the specified pool, or an existing process in
 that pool will be used.
*/
@property (nonatomic, strong) WKProcessPool *processPool;

/*! @abstract The preference settings to be used by the web view.
*/
@property (nonatomic, strong) WKPreferences *preferences;

/*! @abstract The user content controller to associate with the web view.
*/
@property (nonatomic, strong) WKUserContentController *userContentController;

/*! @abstract The web extension controller to associate with the web view.
*/
@property (nullable, nonatomic, strong) WKWebExtensionController *webExtensionController WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*! @abstract The website data store to be used by the web view.
 */
@property (nonatomic, strong) WKWebsiteDataStore *websiteDataStore WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @abstract A Boolean value indicating whether the web view suppresses
 content rendering until it is fully loaded into memory.
 @discussion The default value is NO.
 */
@property (nonatomic) BOOL suppressesIncrementalRendering;

/*! @abstract The name of the application as used in the user agent string.
*/
@property (nullable, nonatomic, copy) NSString *applicationNameForUserAgent WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @abstract A Boolean value indicating whether AirPlay is allowed.
 @discussion The default value is YES.
 */
@property (nonatomic) BOOL allowsAirPlayForMediaPlayback WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @abstract A Boolean value indicating whether HTTP requests to servers known to support HTTPS should be automatically upgraded to HTTPS requests.
 @discussion The default value is YES.
 */
@property (nonatomic) BOOL upgradeKnownHostsToHTTPS WK_API_AVAILABLE(macos(11.3), ios(14.5));

@property (nonatomic) WKAudiovisualMediaTypes mediaTypesRequiringUserActionForPlayback WK_API_AVAILABLE(macos(10.12), ios(10.0));

/*! @abstract The set of default webpage preferences to use when loading and rendering content.
 @discussion These default webpage preferences are additionally passed to the navigation delegate
 in -webView:decidePolicyForNavigationAction:preferences:decisionHandler:.
 */
@property (null_resettable, nonatomic, copy) WKWebpagePreferences *defaultWebpagePreferences WK_API_AVAILABLE(macos(10.15), ios(13.0));

@property (nonatomic) BOOL limitsNavigationsToAppBoundDomains WK_API_AVAILABLE(macos(11.0), ios(14.0));

/*! @abstract A Boolean value indicating whether inline predictions are allowed.
@discussion The default value is `NO`. If false, inline predictions
are disabled regardless of the system setting. If true, they are enabled based
on the system setting.
*/
@property (nonatomic) BOOL allowsInlinePredictions API_AVAILABLE(macos(14.0), ios(17.0));

#if TARGET_OS_IPHONE
/*! @abstract A Boolean value indicating whether HTML5 videos play inline
 (YES) or use the native full-screen controller (NO).
 @discussion The default value is NO.
 */
@property (nonatomic) BOOL allowsInlineMediaPlayback;

/*! @abstract The level of granularity with which the user can interactively
 select content in the web view.
 @discussion Possible values are described in WKSelectionGranularity.
 The default value is WKSelectionGranularityDynamic.
 */
@property (nonatomic) WKSelectionGranularity selectionGranularity;

/*! @abstract A Boolean value indicating whether HTML5 videos may play
 picture-in-picture.
 @discussion The default value is YES.
 */
@property (nonatomic) BOOL allowsPictureInPictureMediaPlayback WK_API_AVAILABLE(ios(9_0));

/*! @abstract An enum value indicating the type of data detection desired.
 @discussion The default value is WKDataDetectorTypeNone.
 An example of how this property may affect the content loaded in the WKWebView is that content like
 'Visit apple.com on July 4th or call 1 800 555-5545' will be transformed to add links around 'apple.com', 'July 4th' and '1 800 555-5545'
 if the dataDetectorTypes property is set to WKDataDetectorTypePhoneNumber | WKDataDetectorTypeLink | WKDataDetectorTypeCalendarEvent.

 */
@property (nonatomic) WKDataDetectorTypes dataDetectorTypes WK_API_AVAILABLE(ios(10.0));

/*! @abstract A Boolean value indicating whether the WKWebView should always allow scaling of the web page, regardless of author intent.
 @discussion This will override the user-scalable property.
 The default value is NO.
 */
@property (nonatomic) BOOL ignoresViewportScaleLimits WK_API_AVAILABLE(ios(10.0));

#else

/*! @abstract The directionality of user interface elements.
 @discussion Possible values are described in WKUserInterfaceDirectionPolicy.
 The default value is WKUserInterfaceDirectionPolicyContent.
 */
@property (nonatomic) WKUserInterfaceDirectionPolicy userInterfaceDirectionPolicy WK_API_AVAILABLE(macos(10.12));

#endif

/* @abstract Sets the URL scheme handler object for the given URL scheme.
 @param urlSchemeHandler The object to register.
 @param scheme The URL scheme the object will handle.
 @discussion Each URL scheme can only have one URL scheme handler object registered.
 An exception will be thrown if you try to register an object for a particular URL scheme more than once.
 URL schemes are case insensitive. e.g. "myprotocol" and "MyProtocol" are equivalent.
 Valid URL schemes must start with an ASCII letter and can only contain ASCII letters, numbers, the '+' character,
 the '-' character, and the '.' character.
 An exception will be thrown if you try to register a URL scheme handler for an invalid URL scheme.
 An exception will be thrown if you try to register a URL scheme handler for a URL scheme that WebKit handles internally.
 You can use +[WKWebView handlesURLScheme:] to check the availability of a given URL scheme.
 */
- (void)setURLSchemeHandler:(nullable id <WKURLSchemeHandler>)urlSchemeHandler forURLScheme:(NSString *)urlScheme WK_API_AVAILABLE(macos(10.13), ios(11.0));

/* @abstract Returns the currently registered URL scheme handler object for the given URL scheme.
 @param scheme The URL scheme to lookup.
 */
- (nullable id <WKURLSchemeHandler>)urlSchemeHandlerForURLScheme:(NSString *)urlScheme WK_API_AVAILABLE(macos(10.13), ios(11.0));

/*! @abstract A Boolean value indicating whether insertion of adaptive image glyphs is allowed.
    @discussion The default value is `NO`. If `NO`, adaptive image glyphs are inserted as regular
    images. If `YES`, they are inserted with the full adaptive sizing behavior.
    */
@property (nonatomic) BOOL supportsAdaptiveImageGlyph WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

#if (TARGET_OS_IOS && !TARGET_OS_VISION) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 180000
/*! @abstract The preferred behavior of Writing Tools.
    @discussion The default behavior is equivalent to `UIWritingToolsBehaviorLimited`.
    */
@property (nonatomic) UIWritingToolsBehavior writingToolsBehavior WK_API_AVAILABLE(ios(18.0));
#elif TARGET_OS_OSX && __MAC_OS_X_VERSION_MAX_ALLOWED >= 150000
/*! @abstract The preferred behavior of Writing Tools.
    @discussion The default behavior is equivalent to `NSWritingToolsBehaviorLimited`.
    */
@property (nonatomic) NSWritingToolsBehavior writingToolsBehavior WK_API_AVAILABLE(macos(15.0));
#endif

@end

#if TARGET_OS_IPHONE

@interface WKWebViewConfiguration (WKDeprecated)

@property (nonatomic) BOOL mediaPlaybackRequiresUserAction WK_API_DEPRECATED_WITH_REPLACEMENT("mediaTypesRequiringUserActionForPlayback", ios(8.0, 9.0));
@property (nonatomic) BOOL mediaPlaybackAllowsAirPlay WK_API_DEPRECATED_WITH_REPLACEMENT("allowsAirPlayForMediaPlayback", ios(8.0, 9.0));
@property (nonatomic) BOOL requiresUserActionForMediaPlayback WK_API_DEPRECATED_WITH_REPLACEMENT("mediaTypesRequiringUserActionForPlayback", ios(9.0, 10.0));

@end

#endif

NS_ASSUME_NONNULL_END
