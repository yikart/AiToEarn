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

#import <WebKit/WKWebExtensionMatchPattern.h>
#import <WebKit/WKWebExtensionPermission.h>

#if TARGET_OS_IPHONE
@class UIImage;
#else
@class NSImage;
#endif

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

/*! @abstract Indicates a ``WKWebExtension`` error. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSErrorDomain const WKWebExtensionErrorDomain NS_SWIFT_NAME(WKWebExtension.errorDomain) NS_SWIFT_NONISOLATED;

/*!
 @abstract Constants used by ``NSError`` to indicate errors in the ``WKWebExtension`` domain.
 @constant WKWebExtensionErrorUnknown  Indicates that an unknown error occurred.
 @constant WKWebExtensionErrorResourceNotFound  Indicates that a specified resource was not found on disk.
 @constant WKWebExtensionErrorInvalidResourceCodeSignature  Indicates that a resource failed the bundle's code signature checks.
 @constant WKWebExtensionErrorInvalidManifest  Indicates that an invalid `manifest.json` was encountered.
 @constant WKWebExtensionErrorUnsupportedManifestVersion  Indicates that the manifest version is not supported.
 @constant WKWebExtensionErrorInvalidManifestEntry  Indicates that an invalid manifest entry was encountered.
 @constant WKWebExtensionErrorInvalidDeclarativeNetRequestEntry  Indicates that an invalid declarative net request entry was encountered.
 @constant WKWebExtensionErrorInvalidBackgroundPersistence  Indicates that the extension specified background persistence that was not compatible with the platform or features requested.
 @constant WKWebExtensionErrorInvalidArchive  Indicates that the archive file is invalid or corrupt.
 */
typedef NS_ERROR_ENUM(WKWebExtensionErrorDomain, WKWebExtensionError) {
    WKWebExtensionErrorUnknown = 1,
    WKWebExtensionErrorResourceNotFound,
    WKWebExtensionErrorInvalidResourceCodeSignature,
    WKWebExtensionErrorInvalidManifest,
    WKWebExtensionErrorUnsupportedManifestVersion,
    WKWebExtensionErrorInvalidManifestEntry,
    WKWebExtensionErrorInvalidDeclarativeNetRequestEntry,
    WKWebExtensionErrorInvalidBackgroundPersistence,
    WKWebExtensionErrorInvalidArchive,
} NS_SWIFT_NAME(WKWebExtension.Error) WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*!
 @abstract A ``WKWebExtension`` object encapsulates a web extension’s resources that are defined by a `manifest.json`` file.
 @discussion This class handles the reading and parsing of the manifest file along with the supporting resources like icons and localizations.
 */
WK_CLASS_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA)) WK_SWIFT_UI_ACTOR
@interface WKWebExtension : NSObject

+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;

/*!
 @abstract Returns a web extension initialized with a specified app extension bundle.
 @param appExtensionBundle The bundle to use for the new web extension.
 @param completionHandler A block to be called with an initialized web extension, or \c nil if the object could not be initialized due to an error.
 @discussion The app extension bundle must contain a `manifest.json` file in its resources directory. If the manifest is invalid or missing,
 or the bundle is otherwise improperly configured, an error will be returned.
 */
+ (void)extensionWithAppExtensionBundle:(NSBundle *)appExtensionBundle completionHandler:(void (^)(WKWebExtension * WK_NULLABLE_RESULT extension, NSError * _Nullable error))completionHandler WK_SWIFT_ASYNC_THROWS_ON_FALSE(1);

/*!
 @abstract Returns a web extension initialized with a specified resource base URL, which can point to either a directory or a ZIP archive.
 @param resourceBaseURL The file URL to use for the new web extension.
 @param completionHandler A block to be called with an initialized web extension, or \c nil if the object could not be initialized due to an error.
 @discussion The URL must be a file URL that points to either a directory with a `manifest.json` file or a ZIP archive containing a `manifest.json` file.
 If the manifest is invalid or missing, or the URL points to an unsupported format or invalid archive, an error will be returned.
 */
+ (void)extensionWithResourceBaseURL:(NSURL *)resourceBaseURL completionHandler:(void (^)(WKWebExtension * WK_NULLABLE_RESULT extension, NSError * _Nullable error))completionHandler WK_SWIFT_ASYNC_THROWS_ON_FALSE(1);

/*!
 @abstract An array of all errors that occurred during the processing of the extension.
 @discussion Provides an array of all parse-time errors for the extension, with repeat errors consolidated into a single entry for the original
 occurrence only. If no errors occurred, an empty array is returned.
 @note Once the extension is loaded, use the ``errors`` property on an extension context to monitor any runtime errors, as they can occur
 after the extension is loaded.
 */
@property (nonatomic, readonly, copy) NSArray<NSError *> *errors;

/*! @abstract The parsed manifest as a dictionary. */
@property (nonatomic, readonly, copy) NSDictionary<NSString *, id> *manifest;

/*!
 @abstract The parsed manifest version, or `0` if there is no version specified in the manifest.
 @note An ``WKWebExtensionErrorUnsupportedManifestVersion`` error will be reported if the manifest version isn't specified.
 */
@property (nonatomic, readonly) double manifestVersion;

/*!
 @abstract Checks if a manifest version is supported by the extension.
 @param manifestVersion The version number to check.
 @result Returns `YES` if the extension specified a manifest version that is greater than or equal to `manifestVersion`.
 */
- (BOOL)supportsManifestVersion:(double)manifestVersion;

/*! @abstract The default locale for the extension. Returns `nil` if there was no default locale specified. */
@property (nonatomic, nullable, readonly, copy) NSLocale *defaultLocale;

/*! @abstract The localized extension name. Returns `nil` if there was no name specified. */
@property (nonatomic, nullable, readonly, copy) NSString *displayName;

/*! @abstract The localized extension short name. Returns `nil` if there was no short name specified. */
@property (nonatomic, nullable, readonly, copy) NSString *displayShortName;

/*! @abstract The localized extension display version. Returns `nil` if there was no display version specified. */
@property (nonatomic, nullable, readonly, copy) NSString *displayVersion;

/*! @abstract The localized extension description. Returns `nil` if there was no description specified. */
@property (nonatomic, nullable, readonly, copy) NSString *displayDescription;

/*!
 @abstract The default localized extension action label. Returns `nil` if there was no default action label specified.
 @discussion This label serves as a default and should be used to represent the extension in contexts like action sheets or toolbars prior to
 the extension being loaded into an extension context. Once the extension is loaded, use the ``actionForTab:`` API to get the tab-specific label.
 */
@property (nonatomic, nullable, readonly, copy) NSString *displayActionLabel;

/*! @abstract The extension version. Returns `nil` if there was no version specified. */
@property (nonatomic, nullable, readonly, copy) NSString *version;

/*!
 @abstract Returns the extension's icon image for the specified size.
 @param size The size to use when looking up the icon.
 @result The extension's icon image, or `nil` if the icon was unable to be loaded.
 @discussion This icon should represent the extension in settings or other areas that show the extension. The returned image will be the best
 match for the specified size that is available in the extension's icon set. If no matching icon can be found, the method will return `nil`.
 @seealso actionIconForSize:
 */
#if TARGET_OS_IPHONE
- (nullable UIImage *)iconForSize:(CGSize)size;
#else
- (nullable NSImage *)iconForSize:(CGSize)size;
#endif

/*!
 @abstract Returns the default action icon for the specified size.
 @param size The size to use when looking up the action icon.
 @result The action icon, or `nil` if the icon was unable to be loaded.
 @discussion This icon serves as a default and should be used to represent the extension in contexts like action sheets or toolbars prior to
 the extension being loaded into an extension context. Once the extension is loaded, use the ``actionForTab:`` API to get the tab-specific icon.
 The returned image will be the best match for the specified size that is available in the extension's action icon set. If no matching icon is available,
 the method will fall back to the extension's icon.
 @seealso iconForSize:
 */
#if TARGET_OS_IPHONE
- (nullable UIImage *)actionIconForSize:(CGSize)size;
#else
- (nullable NSImage *)actionIconForSize:(CGSize)size;
#endif

/*! @abstract The set of permissions that the extension requires for its base functionality. */
@property (nonatomic, readonly, copy) NSSet<WKWebExtensionPermission> *requestedPermissions;

/*! @abstract The set of permissions that the extension may need for optional functionality. These permissions can be requested by the extension at a later time. */
@property (nonatomic, readonly, copy) NSSet<WKWebExtensionPermission> *optionalPermissions;

/*! @abstract The set of websites that the extension requires access to for its base functionality. */
@property (nonatomic, readonly, copy) NSSet<WKWebExtensionMatchPattern *> *requestedPermissionMatchPatterns;

/*! @abstract The set of websites that the extension may need access to for optional functionality. These match patterns can be requested by the extension at a later time. */
@property (nonatomic, readonly, copy) NSSet<WKWebExtensionMatchPattern *> *optionalPermissionMatchPatterns;

/*! @abstract The set of websites that the extension requires access to for injected content and for receiving messages from websites. */
@property (nonatomic, readonly, copy) NSSet<WKWebExtensionMatchPattern *> *allRequestedMatchPatterns;

/*!
 @abstract A Boolean value indicating whether the extension has background content that can run when needed.
 @discussion If this property is `YES`, the extension can run in the background even when no webpages are open.
 */
@property (nonatomic, readonly) BOOL hasBackgroundContent;

/*!
 @abstract A Boolean value indicating whether the extension has background content that stays in memory as long as the extension is loaded.
 @note Note that extensions are only allowed to have persistent background content on macOS. An ``WKWebExtensionErrorInvalidBackgroundPersistence``
 error will be reported on iOS, iPadOS, and visionOS if an attempt is made to load a persistent extension.
 */
@property (nonatomic, readonly) BOOL hasPersistentBackgroundContent;

/*!
 @abstract A Boolean value indicating whether the extension has script or stylesheet content that can be injected into webpages.
 @discussion If this property is `YES`, the extension has content that can be injected by matching against the extension's requested match patterns.
 @note Once the extension is loaded, use the ``hasInjectedContent`` property on an extension context, as the injectable content can change after the extension is loaded.
 */
@property (nonatomic, readonly) BOOL hasInjectedContent;

/*!
 @abstract A Boolean value indicating whether the extension has an options page.
 @discussion If this property is `YES`, the extension includes a dedicated options page where users can customize settings.
 The app should provide access to this page through a user interface element, which can be accessed via ``optionsPageURL`` on an extension context.
 */
@property (nonatomic, readonly) BOOL hasOptionsPage;

/*!
 @abstract A Boolean value indicating whether the extension provides an alternative to the default new tab page.
 @discussion If this property is `YES`, the extension can specify a custom page that can be displayed when a new tab is opened in the app, instead of the default new tab page.
 The app should prompt the user for permission to use the extension's new tab page as the default, which can be accessed via ``overrideNewTabPageURL`` on an extension context.
 */
@property (nonatomic, readonly) BOOL hasOverrideNewTabPage;

/*!
 @abstract A Boolean value indicating whether the extension includes commands that users can invoke.
 @discussion If this property is `YES`, the extension contains one or more commands that can be performed by the user. These commands should be accessible via keyboard shortcuts,
 menu items, or other user interface elements provided by the app. The list of commands can be accessed via ``commands`` on an extension context, and invoked via ``performCommand:``.
 */
@property (nonatomic, readonly) BOOL hasCommands;

/*! @abstract A boolean value indicating whether the extension includes rules used for content modification or blocking. */
@property (nonatomic, readonly) BOOL hasContentModificationRules;

@end

WK_HEADER_AUDIT_END(nullability, sendability)
