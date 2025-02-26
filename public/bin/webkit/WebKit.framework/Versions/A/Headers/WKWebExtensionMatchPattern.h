/*
 * Copyright (C) 2022-2024 Apple Inc. All rights reserved.
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

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

@class WKWebExtension;

/*! @abstract Indicates a ``WKWebExtensionMatchPattern`` error. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSErrorDomain const WKWebExtensionMatchPatternErrorDomain NS_SWIFT_NAME(WKWebExtensionMatchPattern.errorDomain) NS_SWIFT_NONISOLATED;

/*!
 @abstract Constants used by ``NSError`` to indicate errors in the ``WKWebExtensionMatchPattern`` domain.
 @constant WKWebExtensionMatchPatternErrorUnknown  Indicates that an unknown error occurred.
 @constant WKWebExtensionMatchPatternErrorInvalidScheme  Indicates that the scheme component was invalid.
 @constant WKWebExtensionMatchPatternErrorInvalidHost  Indicates that the host component was invalid.
 @constant WKWebExtensionMatchPatternErrorInvalidPath  Indicates that the path component was invalid.
 */
typedef NS_ERROR_ENUM(WKWebExtensionMatchPatternErrorDomain, WKWebExtensionMatchPatternError) {
    WKWebExtensionMatchPatternErrorUnknown = 1,
    WKWebExtensionMatchPatternErrorInvalidScheme,
    WKWebExtensionMatchPatternErrorInvalidHost,
    WKWebExtensionMatchPatternErrorInvalidPath,
} NS_SWIFT_NAME(WKWebExtensionMatchPattern.Error) WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*!
 @abstract Constants used by ``WKWebExtensionMatchPattern`` to indicate matching options.
 @constant WKWebExtensionMatchPatternOptionsNone  Indicates no special matching options.
 @constant WKWebExtensionMatchPatternOptionsIgnoreSchemes  Indicates that the scheme components should be ignored while matching.
 @constant WKWebExtensionMatchPatternOptionsIgnorePaths  Indicates that the host components should be ignored while matching.
 @constant WKWebExtensionMatchPatternOptionsMatchBidirectionally  Indicates that two patterns should be checked in either direction while matching (A matches B, or B matches A). Invalid for matching URLs.
 */
typedef NS_OPTIONS(NSUInteger, WKWebExtensionMatchPatternOptions) {
    WKWebExtensionMatchPatternOptionsNone                 = 0,
    WKWebExtensionMatchPatternOptionsIgnoreSchemes        = 1 << 0,
    WKWebExtensionMatchPatternOptionsIgnorePaths          = 1 << 1,
    WKWebExtensionMatchPatternOptionsMatchBidirectionally = 1 << 2,
} NS_SWIFT_NAME(WKWebExtensionMatchPattern.Options) WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*!
 @abstract A ``WKWebExtensionMatchPattern`` object represents a way to specify groups of URLs.
 @discussion All match patterns are specified as strings. Apart from the special `<all_urls>` pattern, match patterns
 consist of three parts: scheme, host, and path.
 */
WK_CLASS_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_SWIFT_UI_ACTOR NS_SWIFT_NAME(WKWebExtension.MatchPattern)
@interface WKWebExtensionMatchPattern : NSObject <NSSecureCoding, NSCopying>

+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;

/*!
 @abstract Registers a custom URL scheme that can be used in match patterns.
 @discussion This method should be used to register any custom URL schemes used by the app for the extension base URLs,
 other than `webkit-extension`, or if extensions should have access to other supported URL schemes when using `<all_urls>`.
 @param urlScheme The custom URL scheme to register.
*/
+ (void)registerCustomURLScheme:(NSString *)urlScheme;

/*! @abstract Returns a pattern object for `<all_urls>`. */
+ (instancetype)allURLsMatchPattern;

/*! @abstract Returns a pattern object that has `*` for scheme, host, and path. */
+ (instancetype)allHostsAndSchemesMatchPattern;

/*!
 @abstract Returns a pattern object for the specified pattern string.
 @result Returns `nil` if the pattern string is invalid.
 @seealso initWithString:error:
 */
+ (nullable instancetype)matchPatternWithString:(NSString *)string;

/*!
 @abstract Returns a pattern object for the specified scheme, host, and path strings.
 @result A pattern object, or `nil` if any of the strings are invalid.
 @seealso initWithScheme:host:path:error:
 */
+ (nullable instancetype)matchPatternWithScheme:(NSString *)scheme host:(NSString *)host path:(NSString *)path;

/*!
 @abstract Returns a pattern object for the specified pattern string.
 @param error Set to \c nil or an error instance if an error occurred.
 @result A pattern object, or `nil` if the pattern string is invalid and an error will be set.
 @seealso initWithString:
 */
- (nullable instancetype)initWithString:(NSString *)string error:(NSError **)error NS_DESIGNATED_INITIALIZER;

/*!
 @abstract Returns a pattern object for the specified scheme, host, and path strings.
 @param error Set to \c nil or an error instance if an error occurred.
 @result A pattern object, or `nil` if any of the strings are invalid and an error will be set.
 @seealso initWithScheme:host:path:
 */
- (nullable instancetype)initWithScheme:(NSString *)scheme host:(NSString *)host path:(NSString *)path error:(NSError **)error NS_DESIGNATED_INITIALIZER;

/*! @abstract The original pattern string. */
@property (nonatomic, readonly, copy) NSString *string;

/*! @abstract The scheme part of the pattern string, unless ``matchesAllURLs`` is `YES`. */
@property (nonatomic, nullable, readonly, copy) NSString *scheme;

/*! @abstract The host part of the pattern string, unless ``matchesAllURLs`` is `YES`. */
@property (nonatomic, nullable, readonly, copy) NSString *host;

/*! @abstract The path part of the pattern string, unless ``matchesAllURLs`` is `YES`. */
@property (nonatomic, nullable, readonly, copy) NSString *path;

/*! @abstract If the pattern is `<all_urls>`. */
@property (nonatomic, readonly) BOOL matchesAllURLs;

/*! @abstract If the pattern is `<all_urls>` or has `*` as the host. */
@property (nonatomic, readonly) BOOL matchesAllHosts;

/*!
 @abstract Matches the reciever pattern against the specified URL.
 @param url The URL to match the against the reciever pattern.
 @result A Boolean value indicating if pattern matches the specified URL.
 @seealso matchesURL:options:
 */
- (BOOL)matchesURL:(nullable NSURL *)url NS_SWIFT_NAME(matches(_:));

/*!
 @abstract Matches the reciever pattern against the specified URL with options.
 @param url The URL to match the against the reciever pattern.
 @param options The options to use while matching.
 @result A Boolean value indicating if pattern matches the specified URL.
 @seealso matchesURL:
 */
- (BOOL)matchesURL:(nullable NSURL *)url options:(WKWebExtensionMatchPatternOptions)options NS_SWIFT_NAME(matches(_:options:));

/*!
 @abstract Matches the receiver pattern against the specified pattern.
 @param pattern The pattern to match against the receiver pattern.
 @result A Boolean value indicating if receiver pattern matches the specified pattern.
 @seealso matchesPattern:options:
 */
- (BOOL)matchesPattern:(nullable WKWebExtensionMatchPattern *)pattern NS_SWIFT_NAME(matches(_:));

/*!
 @abstract Matches the receiver pattern against the specified pattern with options.
 @param pattern The pattern to match against the receiver pattern.
 @param options The options to use while matching.
 @result A Boolean value indicating if receiver pattern matches the specified pattern.
 @seealso matchesPattern:
 */
- (BOOL)matchesPattern:(nullable WKWebExtensionMatchPattern *)pattern options:(WKWebExtensionMatchPatternOptions)options NS_SWIFT_NAME(matches(_:options:));

@end

WK_HEADER_AUDIT_END(nullability, sendability)
