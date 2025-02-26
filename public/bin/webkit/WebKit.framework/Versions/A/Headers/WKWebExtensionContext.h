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
#import <WebKit/WKWebExtensionTab.h>

@class WKWebViewConfiguration;
@class WKWebExtension;
@class WKWebExtensionAction;
@class WKWebExtensionCommand;
@class WKWebExtensionController;

#if TARGET_OS_IPHONE
@class UIMenuElement;
@class UIKeyCommand;
#else
@class NSEvent;
@class NSMenuItem;
#endif

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

/*! @abstract Indicates a ``WKWebExtensionContext`` error. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSErrorDomain const WKWebExtensionContextErrorDomain NS_SWIFT_NAME(WKWebExtensionContext.errorDomain) NS_SWIFT_NONISOLATED;

/*!
 @abstract Constants used by ``NSError`` to indicate errors in the ``WKWebExtensionContext`` domain.
 @constant WKWebExtensionContextErrorUnknown  Indicates that an unknown error occurred.
 @constant WKWebExtensionContextErrorAlreadyLoaded  Indicates that the context is already loaded by a ``WKWebExtensionController``.
 @constant WKWebExtensionContextErrorNotLoaded  Indicates that the context is not loaded by a ``WKWebExtensionController``.
 @constant WKWebExtensionContextErrorBaseURLAlreadyInUse  Indicates that another context is already using the specified base URL.
 @constant WKWebExtensionContextErrorNoBackgroundContent  Indicates that the extension does not have background content.
 @constant WKWebExtensionContextErrorBackgroundContentFailedToLoad  Indicates that an error occurred loading the background content.
 */
typedef NS_ERROR_ENUM(WKWebExtensionContextErrorDomain, WKWebExtensionContextError) {
    WKWebExtensionContextErrorUnknown = 1,
    WKWebExtensionContextErrorAlreadyLoaded,
    WKWebExtensionContextErrorNotLoaded,
    WKWebExtensionContextErrorBaseURLAlreadyInUse,
    WKWebExtensionContextErrorNoBackgroundContent,
    WKWebExtensionContextErrorBackgroundContentFailedToLoad,
} NS_SWIFT_NAME(WKWebExtensionContext.Error) WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*! @abstract This notification is sent whenever a ``WKWebExtensionContext`` has new errors or errors were cleared. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSNotificationName const WKWebExtensionContextErrorsDidUpdateNotification NS_SWIFT_NAME(WKWebExtensionContext.errorsDidUpdateNotification) NS_SWIFT_NONISOLATED;

/*!
 @abstract Constants used to indicate permission status in ``WKWebExtensionContext``.
 @constant WKWebExtensionContextPermissionStatusDeniedExplicitly  Indicates that the permission was explicitly denied.
 @constant WKWebExtensionContextPermissionStatusDeniedImplicitly  Indicates that the permission was implicitly denied because of another explicitly denied permission.
 @constant WKWebExtensionContextPermissionStatusRequestedImplicitly  Indicates that the permission was implicitly requested because of another explicitly requested permission.
 @constant WKWebExtensionContextPermissionStatusUnknown  Indicates that an unknown permission status.
 @constant WKWebExtensionContextPermissionStatusRequestedExplicitly  Indicates that the permission was explicitly requested.
 @constant WKWebExtensionContextPermissionStatusGrantedImplicitly  Indicates that the permission was implicitly granted because of another explicitly granted permission.
 @constant WKWebExtensionContextPermissionStatusGrantedExplicitly  Indicates that the permission was explicitly granted permission.
 */
typedef NS_ENUM(NSInteger, WKWebExtensionContextPermissionStatus) {
    WKWebExtensionContextPermissionStatusDeniedExplicitly    = -3,
    WKWebExtensionContextPermissionStatusDeniedImplicitly    = -2,
    WKWebExtensionContextPermissionStatusRequestedImplicitly = -1,
    WKWebExtensionContextPermissionStatusUnknown             =  0,
    WKWebExtensionContextPermissionStatusRequestedExplicitly =  1,
    WKWebExtensionContextPermissionStatusGrantedImplicitly   =  2,
    WKWebExtensionContextPermissionStatusGrantedExplicitly   =  3,
} NS_SWIFT_NAME(WKWebExtensionContext.PermissionStatus) WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*! @abstract This notification is sent whenever a ``WKWebExtensionContext`` has newly granted permissions. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSNotificationName const WKWebExtensionContextPermissionsWereGrantedNotification NS_SWIFT_NAME(WKWebExtensionContext.permissionsWereGrantedNotification) NS_SWIFT_NONISOLATED;

/*! @abstract This notification is sent whenever a ``WKWebExtensionContext`` has newly denied permissions. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSNotificationName const WKWebExtensionContextPermissionsWereDeniedNotification NS_SWIFT_NAME(WKWebExtensionContext.permissionsWereDeniedNotification) NS_SWIFT_NONISOLATED;

/*! @abstract This notification is sent whenever a ``WKWebExtensionContext`` has newly removed granted permissions. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSNotificationName const WKWebExtensionContextGrantedPermissionsWereRemovedNotification NS_SWIFT_NAME(WKWebExtensionContext.grantedPermissionsWereRemovedNotification) NS_SWIFT_NONISOLATED;

/*! @abstract This notification is sent whenever a ``WKWebExtensionContext`` has newly removed denied permissions. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSNotificationName const WKWebExtensionContextDeniedPermissionsWereRemovedNotification NS_SWIFT_NAME(WKWebExtensionContext.deniedPermissionsWereRemovedNotification) NS_SWIFT_NONISOLATED;

/*! @abstract This notification is sent whenever a ``WKWebExtensionContext`` has newly granted permission match patterns. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSNotificationName const WKWebExtensionContextPermissionMatchPatternsWereGrantedNotification NS_SWIFT_NAME(WKWebExtensionContext.permissionMatchPatternsWereGrantedNotification) NS_SWIFT_NONISOLATED;

/*! @abstract This notification is sent whenever a ``WKWebExtensionContext`` has newly denied permission match patterns. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSNotificationName const WKWebExtensionContextPermissionMatchPatternsWereDeniedNotification NS_SWIFT_NAME(WKWebExtensionContext.permissionMatchPatternsWereDeniedNotification) NS_SWIFT_NONISOLATED;

/*! @abstract This notification is sent whenever a ``WKWebExtensionContext`` has newly removed granted permission match patterns. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSNotificationName const WKWebExtensionContextGrantedPermissionMatchPatternsWereRemovedNotification NS_SWIFT_NAME(WKWebExtensionContext.grantedPermissionMatchPatternsWereRemovedNotification) NS_SWIFT_NONISOLATED;

/*! @abstract This notification is sent whenever a ``WKWebExtensionContext`` has newly removed denied permission match patterns. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSNotificationName const WKWebExtensionContextDeniedPermissionMatchPatternsWereRemovedNotification NS_SWIFT_NAME(WKWebExtensionContext.deniedPermissionMatchPatternsWereRemovedNotification) NS_SWIFT_NONISOLATED;

/*! @abstract Constants for specifying ``WKWebExtensionContext`` information in notifications. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
typedef NSString * WKWebExtensionContextNotificationUserInfoKey NS_TYPED_EXTENSIBLE_ENUM NS_SWIFT_NAME(WKWebExtensionContext.NotificationUserInfoKey);

/*! @abstract The corresponding value represents the affected permissions in ``WKWebExtensionContext`` notifications. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN WKWebExtensionContextNotificationUserInfoKey const WKWebExtensionContextNotificationUserInfoKeyPermissions NS_SWIFT_NONISOLATED;

/*! @abstract The corresponding value represents the affected permission match patterns in ``WKWebExtensionContext`` notifications. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN WKWebExtensionContextNotificationUserInfoKey const WKWebExtensionContextNotificationUserInfoKeyMatchPatterns NS_SWIFT_NONISOLATED;

/*!
 @abstract A ``WKWebExtensionContext`` object represents the runtime environment for a web extension.
 @discussion This class provides methods for managing the extension's permissions, allowing it to inject content, run
 background logic, show popovers, and display other web-based UI to the user.
 */
WK_CLASS_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA)) WK_SWIFT_UI_ACTOR
@interface WKWebExtensionContext : NSObject

+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;

/*!
 @abstract Returns a web extension context initialized with the specified extension.
 @param extension The extension to use for the new web extension context.
 @result An initialized web extension context.
 */
+ (instancetype)contextForExtension:(WKWebExtension *)extension;

/*!
 @abstract Returns a web extension context initialized with a specified extension.
 @param extension The extension to use for the new web extension context.
 @result An initialized web extension context.
 @discussion This is a designated initializer.
 */
- (instancetype)initForExtension:(WKWebExtension *)extension NS_DESIGNATED_INITIALIZER;

/*! @abstract The extension this context represents. */
@property (nonatomic, readonly, strong) WKWebExtension *webExtension;

/*! @abstract The extension controller this context is loaded in, otherwise `nil` if it isn't loaded. */
@property (nonatomic, readonly, weak, nullable) WKWebExtensionController *webExtensionController;

/*! @abstract A Boolean value indicating if this context is loaded in an extension controller. */
@property (nonatomic, readonly, getter=isLoaded) BOOL loaded;

/*!
 @abstract All errors that occurred in the extension context.
 @discussion Provides an array of all parse-time and runtime errors for the extension and extension context, with repeat errors
 consolidated into a single entry for the original occurrence. If no errors occurred, an empty array is returned.
 */
@property (nonatomic, readonly, copy) NSArray<NSError *> *errors;

/*!
 @abstract The base URL the context uses for loading extension resources or injecting content into webpages.
 @discussion The default value is a unique URL using the `webkit-extension` scheme.
 The base URL can be set to any URL, but only the scheme and host will be used. The scheme cannot be a scheme that is
 already supported by ``WKWebView`` (e.g. http, https, etc.) Setting is only allowed when the context is not loaded.
 */
@property (nonatomic, copy) NSURL *baseURL;

/*!
 @abstract A unique identifier used to distinguish the extension from other extensions and target it for messages.
 @discussion The default value is a unique value that matches the host in the default base URL. The identifier can be any
 value that is unique. Setting is only allowed when the context is not loaded. This value is accessible by the extension via
 `browser.runtime.id` and is used for messaging the extension via `browser.runtime.sendMessage()`.
 */
@property (nonatomic, copy) NSString *uniqueIdentifier;

/*!
 @abstract Determines whether Web Inspector can inspect the ``WKWebView`` instances for this context.
 @discussion A context can control multiple ``WKWebView`` instances, from the background content, to the popover.
 You should set this to `YES` when needed for debugging purposes. The default value is `NO`.
*/
@property (nonatomic, getter=isInspectable) BOOL inspectable;

/*!
 @abstract The name shown when inspecting the background web view.
 @discussion This is the text that will appear when inspecting the background web view.
 */
@property (nonatomic, nullable, copy) NSString *inspectionName;

/*!
 @abstract Specifies unsupported APIs for this extension, making them `undefined` in JavaScript.
 @discussion This property allows the app to specify a subset of web extension APIs that it chooses not to support, effectively making
 these APIs `undefined` within the extension's JavaScript contexts. This enables extensions to employ feature detection techniques
 for unsupported APIs, allowing them to adapt their behavior based on the APIs actually supported by the app. Setting is only allowed when
 the context is not loaded. Only certain APIs can be specified here, particularly those within the `browser` namespace and other dynamic
 functions and properties, anything else will be silently ignored.
 @note For example, specifying `"browser.windows.create"` and `"browser.storage"` in this set will result in the
 `browser.windows.create()` function and `browser.storage` property being `undefined`.
 */
@property (nonatomic, null_resettable, copy) NSSet<NSString *> *unsupportedAPIs;

/*!
 @abstract The web view configuration to use for web views that load pages from this extension.
 @discussion Returns a customized copy of the configuration, originally set in the web extension controller configuration, for this extension.
 The app must use this configuration when initializing web views intended to navigate to a URL originating from this extension's base URL.
 The app must also swap web views in tabs when navigating to and from web extension URLs. This property returns `nil` if the context isn't
 associated with a web extension controller. The returned configuration copy can be customized prior to web view initialization.
 @note Navigations will fail if a web view using this configuration attempts to navigate to a URL that doesn't originate from this extension's
 base URL. Similarly, navigations will be canceled if a web view not configured with this configuration attempts to navigate to a URL that does
 originate from this extension's base URL.
 */
@property (nonatomic, readonly, copy, nullable) WKWebViewConfiguration *webViewConfiguration;

/*!
 @abstract The URL of the extension's options page, if the extension has one.
 @discussion Provides the URL for the dedicated options page, if provided by the extension; otherwise `nil` if no page is defined.
 The app should provide access to this page through a user interface element.
 @note Navigation to the options page is only possible after this extension has been loaded.
 @seealso webViewConfiguration
 */
@property (nonatomic, readonly, copy, nullable) NSURL *optionsPageURL;

/*!
 @abstract The URL to use as an alternative to the default new tab page, if the extension has one.
 @discussion Provides the URL for a new tab page, if provided by the extension; otherwise `nil` if no page is defined.
 The app should prompt the user for permission to use the extension's new tab page as the default.
 @note Navigation to the override new tab page is only possible after this extension has been loaded.
 @seealso webViewConfiguration
 */
@property (nonatomic, readonly, copy, nullable) NSURL *overrideNewTabPageURL;

/*!
 @abstract The currently granted permissions and their expiration dates.
 @discussion Permissions that don't expire will have a distant future date. This will never include expired entries at time of access.
 Setting this property will replace all existing entries. Use this property for saving and restoring permission status in bulk.
 Permissions in this dictionary should be explicitly granted by the user before being added. Any permissions in this collection will not be
 presented for approval again until they expire. This value should be saved and restored as needed by the app.
 @seealso setPermissionStatus:forPermission:
 @seealso setPermissionStatus:forPermission:expirationDate:
 */
@property (nonatomic, copy) NSDictionary<WKWebExtensionPermission, NSDate *> *grantedPermissions;

/*!
 @abstract The currently granted permission match patterns and their expiration dates.
 @discussion Match patterns that don't expire will have a distant future date. This will never include expired entries at time of access.
 Setting this property will replace all existing entries. Use this property for saving and restoring permission status in bulk.
 Match patterns in this dictionary should be explicitly granted by the user before being added. Any match pattern in this collection will not be
 presented for approval again until they expire. This value should be saved and restored as needed by the app.
 @seealso setPermissionStatus:forMatchPattern:
 @seealso setPermissionStatus:forMatchPattern:expirationDate:
 */
@property (nonatomic, copy) NSDictionary<WKWebExtensionMatchPattern *, NSDate *> *grantedPermissionMatchPatterns;

/*!
 @abstract The currently denied permissions and their expiration dates.
 @discussion Permissions that don't expire will have a distant future date. This will never include expired entries at time of access.
 Setting this property will replace all existing entries. Use this property for saving and restoring permission status in bulk.
 Permissions in this dictionary should be explicitly denied by the user before being added. Any match pattern in this collection will not be
 presented for approval again until they expire. This value should be saved and restored as needed by the app.
 @seealso setPermissionStatus:forPermission:
 @seealso setPermissionStatus:forPermission:expirationDate:
 */
@property (nonatomic, copy) NSDictionary<WKWebExtensionPermission, NSDate *> *deniedPermissions;

/*!
 @abstract The currently denied permission match patterns and their expiration dates.
 @discussion Match patterns that don't expire will have a distant future date. This will never include expired entries at time of access.
 Setting this property will replace all existing entries. Use this property for saving and restoring permission status in bulk.
 Match patterns in this dictionary should be explicitly denied by the user before being added. Any match pattern in this collection will not be
 presented for approval again until they expire. This value should be saved and restored as needed by the app.
 @seealso setPermissionStatus:forMatchPattern:
 @seealso setPermissionStatus:forMatchPattern:expirationDate:
 */
@property (nonatomic, copy) NSDictionary<WKWebExtensionMatchPattern *, NSDate *> *deniedPermissionMatchPatterns;

/*!
 @abstract A Boolean value indicating if the extension has requested optional access to all hosts.
 @discussion If this property is `YES`, the extension has asked for access to all hosts in a call to `browser.runtime.permissions.request()`,
 and future permission checks will present discrete hosts for approval as being implicitly requested. This value should be saved and restored as needed by the app.
 */
@property (nonatomic) BOOL hasRequestedOptionalAccessToAllHosts;

/*!
 @abstract A Boolean value indicating if the extension has access to private data.
 @discussion If this property is `YES`, the extension is granted permission to interact with private windows, tabs, and cookies. Access to private data
 should be explicitly allowed by the user before setting this property. This value should be saved and restored as needed by the app.
 @note To ensure proper isolation between private and non-private data, web views associated with private data must use a
 different ``WKUserContentController``. Likewise, to be identified as a private web view and to ensure that cookies and other
 website data is not shared, private web views must be configured to use a non-persistent ``WKWebsiteDataStore``.
 */
@property (nonatomic) BOOL hasAccessToPrivateData;

/*!
 @abstract The currently granted permissions that have not expired.
 @seealso grantedPermissions
 */
@property (nonatomic, readonly, copy) NSSet<WKWebExtensionPermission> *currentPermissions;

/*!
 @abstract The currently granted permission match patterns that have not expired.
 @seealso grantedPermissionMatchPatterns
 */
@property (nonatomic, readonly, copy) NSSet<WKWebExtensionMatchPattern *> *currentPermissionMatchPatterns;

/*!
 @abstract Checks the specified permission against the currently granted permissions.
 @param permission The permission for which to return the status.
 @seealso currentPermissions
 @seealso hasPermission:inTab:
 @seealso permissionStatusForPermission:
 @seealso permissionStatusForPermission:inTab:
*/
- (BOOL)hasPermission:(WKWebExtensionPermission)permission NS_SWIFT_NAME(hasPermission(_:));

/*!
 @abstract Checks the specified permission against the currently granted permissions in a specific tab.
 @param permission The permission for which to return the status.
 @param tab The tab in which to return the permission status, or \c nil if the tab is not known or the global status is desired.
 @discussion Permissions can be granted on a per-tab basis. When the tab is known, permission checks should always use this method.
 @seealso currentPermissions
 @seealso hasPermission:
 @seealso permissionStatusForPermission:
 @seealso permissionStatusForPermission:inTab:
 */
- (BOOL)hasPermission:(WKWebExtensionPermission)permission inTab:(nullable id <WKWebExtensionTab>)tab NS_SWIFT_NAME(hasPermission(_:in:));

/*!
 @abstract Checks the specified URL against the currently granted permission match patterns.
 @param url The URL for which to return the status.
 @seealso currentPermissionMatchPatterns
 @seealso hasAccessToURL:inTab:
 @seealso permissionStatusForURL:
 @seealso permissionStatusForURL:inTab:
 @seealso permissionStatusForMatchPattern:
 @seealso permissionStatusForMatchPattern:inTab:
 */
- (BOOL)hasAccessToURL:(NSURL *)url NS_SWIFT_NAME(hasAccess(to:));

/*!
 @abstract Checks the specified URL against the currently granted permission match patterns in a specific tab.
 @param url The URL for which to return the status.
 @param tab The tab in which to return the permission status, or \c nil if the tab is not known or the global status is desired.
 @discussion Some match patterns can be granted on a per-tab basis. When the tab is known, access checks should always use this method.
 @seealso currentPermissionMatchPatterns
 @seealso hasAccessToURL:
 @seealso permissionStatusForURL:
 @seealso permissionStatusForURL:inTab:
 @seealso permissionStatusForMatchPattern:
 @seealso permissionStatusForMatchPattern:inTab:
 */
- (BOOL)hasAccessToURL:(NSURL *)url inTab:(nullable id <WKWebExtensionTab>)tab NS_SWIFT_NAME(hasAccess(to:in:));

/*!
 @abstract A Boolean value indicating if the currently granted permission match patterns set contains the `<all_urls>` pattern.
 @discussion This does not check for any `*` host patterns. In most cases you should use the broader ``hasAccessToAllHosts``.
 @seealso currentPermissionMatchPatterns
 @seealso hasAccessToAllHosts
 */
@property (nonatomic, readonly) BOOL hasAccessToAllURLs;

/*!
 @abstract A Boolean value indicating if the currently granted permission match patterns set contains the `<all_urls>` pattern or any `*` host patterns.
 @seealso currentPermissionMatchPatterns
 @seealso hasAccessToAllURLs
 */
@property (nonatomic, readonly) BOOL hasAccessToAllHosts;

/*!
 @abstract A Boolean value indicating whether the extension has script or stylesheet content that can be injected into webpages.
 @discussion If this property is `YES`, the extension has content that can be injected by matching against the extension's requested match patterns.
 @seealso hasInjectedContentForURL:
 */
@property (nonatomic, readonly) BOOL hasInjectedContent;

/*!
 @abstract Checks if the extension has script or stylesheet content that can be injected into the specified URL.
 @param url The webpage URL to check.
 @result Returns `YES` if the extension has content that can be injected by matching the URL against the extension's requested match patterns.
 @discussion The extension context will still need to be loaded and have granted website permissions for its content to actually be injected.
 */
- (BOOL)hasInjectedContentForURL:(NSURL *)url NS_SWIFT_NAME(hasInjectedContent(for:));

/*!
 @abstract A boolean value indicating whether the extension includes rules used for content modification or blocking.
 @discussion This includes both static rules available in the extension's manifest and dynamic rules applied during a browsing session.
 */
@property (nonatomic, readonly) BOOL hasContentModificationRules;

/*!
 @abstract Checks the specified permission against the currently denied, granted, and requested permissions.
 @param permission The permission for which to return the status.
 @discussion Permissions can be granted on a per-tab basis. When the tab is known, access checks should always use the method that checks in a tab.
 @seealso permissionStatusForPermission:inTab:
 @seealso hasPermission:
*/
- (WKWebExtensionContextPermissionStatus)permissionStatusForPermission:(WKWebExtensionPermission)permission NS_SWIFT_NAME(permissionStatus(for:));

/*!
 @abstract Checks the specified permission against the currently denied, granted, and requested permissions.
 @param permission The permission for which to return the status.
 @param tab The tab in which to return the permission status, or \c nil if the tab is not known or the global status is desired.
 @discussion Permissions can be granted on a per-tab basis. When the tab is known, access checks should always specify the tab.
 @seealso permissionStatusForPermission:
 @seealso hasPermission:inTab:
*/
- (WKWebExtensionContextPermissionStatus)permissionStatusForPermission:(WKWebExtensionPermission)permission inTab:(nullable id <WKWebExtensionTab>)tab NS_SWIFT_NAME(permissionStatus(for:in:));

/*!
 @abstract Sets the status of a permission with a distant future expiration date.
 @param status The new permission status to set for the given permission.
 @param permission The permission for which to set the status.
 @discussion This method will update ``grantedPermissions`` and ``deniedPermissions``. Use this method for changing a single permission's status.
 Only ``WKWebExtensionContextPermissionStatusDeniedExplicitly``, ``WKWebExtensionContextPermissionStatusUnknown``, and ``WKWebExtensionContextPermissionStatusGrantedExplicitly``
 states are allowed to be set using this method.
 @seealso setPermissionStatus:forPermission:expirationDate:
 @seealso setPermissionStatus:forPermission:inTab:
*/
- (void)setPermissionStatus:(WKWebExtensionContextPermissionStatus)status forPermission:(WKWebExtensionPermission)permission NS_SWIFT_NAME(setPermissionStatus(_:for:));

/*!
 @abstract Sets the status of a permission with a specific expiration date.
 @param status The new permission status to set for the given permission.
 @param permission The permission for which to set the status.
 @param expirationDate The expiration date for the new permission status, or \c nil for distant future.
 @discussion This method will update ``grantedPermissions`` and ``deniedPermissions``. Use this method for changing a single permission's status.
 Passing a `nil` expiration date will be treated as a distant future date. Only ``WKWebExtensionContextPermissionStatusDeniedExplicitly``, ``WKWebExtensionContextPermissionStatusUnknown``,
 and ``WKWebExtensionContextPermissionStatusGrantedExplicitly`` states are allowed to be set using this method.
 @seealso setPermissionStatus:forPermission:
 @seealso setPermissionStatus:forPermission:inTab:
*/
- (void)setPermissionStatus:(WKWebExtensionContextPermissionStatus)status forPermission:(WKWebExtensionPermission)permission expirationDate:(nullable NSDate *)expirationDate NS_SWIFT_NAME(setPermissionStatus(_:for:expirationDate:));

/*!
 @abstract Checks the specified URL against the currently denied, granted, and requested permission match patterns.
 @param url The URL for which to return the status.
 @discussion URLs and match patterns can be granted on a per-tab basis. When the tab is known, access checks should always use the method that checks in a tab.
 @seealso permissionStatusForURL:inTab:
 @seealso hasAccessToURL:
*/
- (WKWebExtensionContextPermissionStatus)permissionStatusForURL:(NSURL *)url NS_SWIFT_NAME(permissionStatus(for:));

/*!
 @abstract Checks the specified URL against the currently denied, granted, and requested permission match patterns.
 @param url The URL for which to return the status.
 @param tab The tab in which to return the permission status, or \c nil if the tab is not known or the global status is desired.
 @discussion URLs and match patterns can be granted on a per-tab basis. When the tab is known, access checks should always use this method.
 @seealso permissionStatusForURL:
 @seealso hasAccessToURL:inTab:
*/
- (WKWebExtensionContextPermissionStatus)permissionStatusForURL:(NSURL *)url inTab:(nullable id <WKWebExtensionTab>)tab NS_SWIFT_NAME(permissionStatus(for:in:));

/*!
 @abstract Sets the permission status of a URL with a distant future expiration date.
 @param status The new permission status to set for the given URL.
 @param url The URL for which to set the status.
 @discussion The URL is converted into a match pattern and will update ``grantedPermissionMatchPatterns`` and ``deniedPermissionMatchPatterns``. Use this method for changing a single URL's status.
 Only ``WKWebExtensionContextPermissionStatusDeniedExplicitly``, ``WKWebExtensionContextPermissionStatusUnknown``, and ``WKWebExtensionContextPermissionStatusGrantedExplicitly``
 states are allowed to be set using this method.
 @seealso setPermissionStatus:forURL:expirationDate:
 @seealso setPermissionStatus:forURL:inTab:
*/
- (void)setPermissionStatus:(WKWebExtensionContextPermissionStatus)status forURL:(NSURL *)url NS_SWIFT_NAME(setPermissionStatus(_:for:));

/*!
 @abstract Sets the permission status of a URL with a distant future expiration date.
 @param status The new permission status to set for the given URL.
 @param url The URL for which to set the status.
 @param expirationDate The expiration date for the new permission status, or \c nil for distant future.
 @discussion The URL is converted into a match pattern and will update ``grantedPermissionMatchPatterns`` and ``deniedPermissionMatchPatterns``. Use this method for changing a single URL's status.
 Passing a `nil` expiration date will be treated as a distant future date. Only ``WKWebExtensionContextPermissionStatusDeniedExplicitly``, ``WKWebExtensionContextPermissionStatusUnknown``,
 and ``WKWebExtensionContextPermissionStatusGrantedExplicitly`` states are allowed to be set using this method.
 @seealso setPermissionStatus:forURL:
 @seealso setPermissionStatus:forURL:inTab:
*/
- (void)setPermissionStatus:(WKWebExtensionContextPermissionStatus)status forURL:(NSURL *)url expirationDate:(nullable NSDate *)expirationDate NS_SWIFT_NAME(setPermissionStatus(_:for:expirationDate:));

/*!
 @abstract Checks the specified match pattern against the currently denied, granted, and requested permission match patterns.
 @param pattern The pattern for which to return the status.
 @discussion Match patterns can be granted on a per-tab basis. When the tab is known, access checks should always use the method that checks in a tab.
 @seealso permissionStatusForMatchPattern:inTab:
 @seealso hasAccessToURL:inTab:
*/
- (WKWebExtensionContextPermissionStatus)permissionStatusForMatchPattern:(WKWebExtensionMatchPattern *)pattern NS_SWIFT_NAME(permissionStatus(for:));

/*!
 @abstract Checks the specified match pattern against the currently denied, granted, and requested permission match patterns.
 @param pattern The pattern for which to return the status.
 @param tab The tab in which to return the permission status, or \c nil if the tab is not known or the global status is desired.
 @discussion Match patterns can be granted on a per-tab basis. When the tab is known, access checks should always use this method.
 @seealso permissionStatusForMatchPattern:
 @seealso hasAccessToURL:inTab:
*/
- (WKWebExtensionContextPermissionStatus)permissionStatusForMatchPattern:(WKWebExtensionMatchPattern *)pattern inTab:(nullable id <WKWebExtensionTab>)tab NS_SWIFT_NAME(permissionStatus(for:in:));

/*!
 @abstract Sets the status of a match pattern with a distant future expiration date.
 @param status The new permission status to set for the given match pattern.
 @param pattern The match pattern for which to set the status.
 @discussion This method will update ``grantedPermissionMatchPatterns`` and ``deniedPermissionMatchPatterns``. Use this method for changing a single match pattern's status.
 Only ``WKWebExtensionContextPermissionStatusDeniedExplicitly``, ``WKWebExtensionContextPermissionStatusUnknown``, and ``WKWebExtensionContextPermissionStatusGrantedExplicitly``
 states are allowed to be set using this method.
 @seealso setPermissionStatus:forMatchPattern:expirationDate:
 @seealso setPermissionStatus:forMatchPattern:inTab:
*/
- (void)setPermissionStatus:(WKWebExtensionContextPermissionStatus)status forMatchPattern:(WKWebExtensionMatchPattern *)pattern NS_SWIFT_NAME(setPermissionStatus(_:for:));

/*!
 @abstract Sets the status of a match pattern with a specific expiration date.
 @param status The new permission status to set for the given match pattern.
 @param pattern The match pattern for which to set the status.
 @param expirationDate The expiration date for the new permission status, or \c nil for distant future.
 @discussion This method will update ``grantedPermissionMatchPatterns`` and ``deniedPermissionMatchPatterns``. Use this method for changing a single match pattern's status.
 Passing a `nil` expiration date will be treated as a distant future date. Only ``WKWebExtensionContextPermissionStatusDeniedExplicitly``, ``WKWebExtensionContextPermissionStatusUnknown``,
 and ``WKWebExtensionContextPermissionStatusGrantedExplicitly`` states are allowed to be set using this method.
 @seealso setPermissionStatus:forMatchPattern:
 @seealso setPermissionStatus:forMatchPattern:inTab:
*/
- (void)setPermissionStatus:(WKWebExtensionContextPermissionStatus)status forMatchPattern:(WKWebExtensionMatchPattern *)pattern expirationDate:(nullable NSDate *)expirationDate NS_SWIFT_NAME(setPermissionStatus(_:for:expirationDate:));

/*!
 @abstract Loads the background content if needed for the extension.
 @param completionHandler A block to be called upon completion of the loading process, with an optional error.
 @discussion This method forces the loading of the background content for the extension that will otherwise be loaded on-demand during specific events.
 It is useful when the app requires the background content to be loaded for other reasons. If the background content is already loaded, the completion handler
 will be called immediately. An error will occur if the extension does not have any background content to load or loading fails.
 */
- (void)loadBackgroundContentWithCompletionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(loadBackgroundContent(completionHandler:));

/*!
 @abstract Retrieves the extension action for a given tab, or the default action if `nil` is passed.
 @param tab The tab for which to retrieve the extension action, or `nil` to get the default action.
 @discussion The returned object represents the action specific to the tab when provided; otherwise, it returns the default action. The default
 action is useful when the context is unrelated to a specific tab. When possible, specify the tab to get the most context-relevant action.
 @seealso performActionForTab:
 */
- (nullable WKWebExtensionAction *)actionForTab:(nullable id <WKWebExtensionTab>)tab NS_SWIFT_NAME(action(for:));

/*!
 @abstract Performs the extension action associated with the specified tab or performs the default action if `nil` is passed.
 @param tab The tab for which to perform the extension action, or `nil` to perform the default action.
 @discussion Performing the action will mark the tab, if specified, as having an active user gesture. When the ``tab`` parameter is `nil`,
 the default action is performed. The action can either trigger an event or display a popup, depending on how the extension is configured.
 If the action is configured to display a popup, implementing the appropriate web extension controller delegate method is required; otherwise,
 no action is performed for popup actions.
 */
- (void)performActionForTab:(nullable id <WKWebExtensionTab>)tab NS_SWIFT_NAME(performAction(for:));

/*!
 @abstract The commands associated with the extension.
 @discussion Provides all commands registered within the extension. Each command represents an action or behavior available for the web extension.
 @seealso performCommand:
 */
@property (nonatomic, readonly, copy) NSArray<WKWebExtensionCommand *> *commands;

/*!
 @abstract Performs the specified command, triggering events specific to this extension.
 @param command The command to be performed.
 @discussion This method performs the given command as if it was triggered by a user gesture within the context of the focused window and active tab.
 */
- (void)performCommand:(WKWebExtensionCommand *)command NS_SWIFT_NAME(performCommand(_:));

#if TARGET_OS_IPHONE
/*!
 @abstract Performs the command associated with the given key command.
 @discussion This method checks for a command corresponding to the provided ``UIKeyCommand`` and performs it, if available. The app should use this method to perform
 any extension commands at an appropriate time in the app's responder object that handles the ``performWebExtensionCommandForKeyCommand:`` action.
 @param keyCommand The key command received by the first responder.
 @result Returns `YES` if a command corresponding to the UIKeyCommand was found and performed, `NO` otherwise.
 */
- (BOOL)performCommandForKeyCommand:(UIKeyCommand *)keyCommand NS_SWIFT_NAME(performCommand(for:));
#endif

#if TARGET_OS_OSX
/*!
 @abstract Performs the command associated with the given event.
 @discussion This method checks for a command corresponding to the provided event and performs it, if available. The app should use this method to perform
 any extension commands at an appropriate time in the app's event handling, like in ``sendEvent:`` of ``NSApplication`` or ``NSWindow`` subclasses.
 @param event The event representing the user input.
 @result Returns `YES` if a command corresponding to the event was found and performed, `NO` otherwise.
 */
- (BOOL)performCommandForEvent:(NSEvent *)event NS_SWIFT_NAME(performCommand(for:));

/*!
 @abstract Retrieves the command associated with the given event without performing it.
 @discussion Returns the command that corresponds to the provided event, if such a command exists. This provides a way to programmatically
 determine what action would occur for a given event, without triggering the command.
 @param event The event for which to retrieve the corresponding command.
 @result The command associated with the event, or `nil` if there is no such command.
 */
- (nullable WKWebExtensionCommand *)commandForEvent:(NSEvent *)event NS_SWIFT_NAME(command(for:));
#endif // TARGET_OS_OSX

/*!
 @abstract Retrieves the menu items for a given tab.
 @param tab The tab for which to retrieve the menu items.
 @discussion Returns menu items provided by the extension, allowing the user to perform extension-defined actions on the tab.
 The app is responsible for displaying these menu items, typically in a context menu or a long-press menu on the tab.
 @note The properties of the menu items, including the items themselves, can change dynamically. Therefore, the app should fetch the menu items immediately
 before showing them, to ensure that the most current and relevant items are presented.
 */
#if TARGET_OS_IPHONE
- (NSArray<UIMenuElement *> *)menuItemsForTab:(id <WKWebExtensionTab>)tab NS_SWIFT_NAME(menuItems(for:));
#else
- (NSArray<NSMenuItem *> *)menuItemsForTab:(id <WKWebExtensionTab>)tab NS_SWIFT_NAME(menuItems(for:));
#endif

/*!
 @abstract Should be called by the app when a user gesture is performed in a specific tab.
 @param tab The tab in which the user gesture was performed.
 @discussion When a user gesture is performed in a tab, this method should be called to update the extension context.
 This enables the extension to be aware of the user gesture, potentially granting it access to features that require user interaction,
 such as `activeTab`. Not required if using ``performActionForTab:``.
 @seealso hasActiveUserGestureInTab:
 */
- (void)userGesturePerformedInTab:(id <WKWebExtensionTab>)tab NS_SWIFT_NAME(userGesturePerformed(in:));

/*!
 @abstract Indicates if a user gesture is currently active in the specified tab.
 @param tab The tab for which to check for an active user gesture.
 @discussion An active user gesture may influence the availability of certain permissions, such as `activeTab`. User gestures can
 be triggered by various user interactions with the web extension, including clicking on extension menu items, executing extension commands,
 or interacting with extension actions. A tab as having an active user gesture enables the extension to access features that require user interaction.
 @seealso userGesturePerformedInTab:
 */
- (BOOL)hasActiveUserGestureInTab:(id <WKWebExtensionTab>)tab NS_SWIFT_NAME(hasActiveUserGesture(in:));

/*!
 @abstract Should be called by the app to clear a user gesture in a specific tab.
 @param tab The tab from which the user gesture should be cleared.
 @discussion When a user gesture is no longer relevant in a tab, this method should be called to update the extension context.
 This will revoke the extension's access to features that require active user interaction, such as `activeTab`. User gestures are
 automatically cleared during navigation in certain scenarios; this method is needed if the app intends to clear the gesture more aggressively.
 @seealso userGesturePerformedInTab:
 */
- (void)clearUserGestureInTab:(id <WKWebExtensionTab>)tab NS_SWIFT_NAME(clearUserGesture(in:));

/*!
 @abstract The open windows that are exposed to this extension.
 @discussion Provides the windows that are open and visible to the extension, as updated by the ``didOpenWindow:`` and ``didCloseWindow:`` methods.
 Initially populated by the windows returned by the extension controller delegate method ``webExtensionController:openWindowsForExtensionContext:``.
 @seealso didOpenWindow:
 @seealso didCloseWindow:
 */
@property (nonatomic, readonly, copy) NSArray<id <WKWebExtensionWindow>> *openWindows;

/*!
 @abstract The window that currently has focus for this extension.
 @discussion Provides the window that currently has focus, as set by the ``didFocusWindow:`` method.
 It will be `nil` if no window has focus or if a window has focus that is not visible to the extension. Initially populated by the window
 returned by the extension controller delegate method ``webExtensionController:focusedWindowForExtensionContext:``.
 @seealso didFocusWindow:
 */
@property (nonatomic, readonly, weak, nullable) id <WKWebExtensionWindow> focusedWindow;

/*!
 @abstract A set of open tabs in all open windows that are exposed to this extension.
 @discussion Provides a set of tabs in all open windows that are visible to the extension, as updated by the ``didOpenTab:`` and ``didCloseTab:`` methods.
 Initially populated by the tabs in the windows returned by the extension controller delegate method ``webExtensionController:openWindowsForExtensionContext:``.
 @seealso didOpenTab:
 @seealso didCloseTab:
 */
@property (nonatomic, readonly, copy) NSSet<id <WKWebExtensionTab>> *openTabs;

/*!
 @abstract Should be called by the app when a new window is opened to fire appropriate events with only this extension.
 @param newWindow The newly opened window.
 @discussion This method informs only the specific extension of the opening of a new window. If the intention is to inform all loaded
 extensions consistently, you should use the respective method on the extension controller instead.
 @seealso didCloseWindow:
 @seealso openWindows
 */
- (void)didOpenWindow:(id <WKWebExtensionWindow>)newWindow NS_SWIFT_NAME(didOpenWindow(_:));

/*!
 @abstract Should be called by the app when a window is closed to fire appropriate events with only this extension.
 @param newWindow The window that was closed.
 @discussion This method informs only the specific extension of the closure of a window. If the intention is to inform all loaded
 extensions consistently, you should use the respective method on the extension controller instead.
 @seealso didOpenWindow:
 @seealso openWindows
 */
- (void)didCloseWindow:(id <WKWebExtensionWindow>)closedWindow NS_SWIFT_NAME(didCloseWindow(_:));

/*!
 @abstract Should be called by the app when a window gains focus to fire appropriate events with only this extension.
 @param focusedWindow The window that gained focus, or \c nil if no window has focus or a window has focus that is not visible to this extension.
 @discussion This method informs only the specific extension that a window has gained focus. If the intention is to inform all loaded
 extensions consistently, you should use the respective method on the extension controller instead.
 */
- (void)didFocusWindow:(nullable id <WKWebExtensionWindow>)focusedWindow NS_SWIFT_NAME(didFocusWindow(_:));

/*!
 @abstract Should be called by the app when a new tab is opened to fire appropriate events with only this extension.
 @param newTab The newly opened tab.
 @discussion This method informs only the specific extension of the opening of a new tab. If the intention is to inform all loaded
 extensions consistently, you should use the respective method on the extension controller instead.
 @seealso didCloseTab:
 @seealso openTabs
 */
- (void)didOpenTab:(id <WKWebExtensionTab>)newTab NS_SWIFT_NAME(didOpenTab(_:));

/*!
 @abstract Should be called by the app when a tab is closed to fire appropriate events with only this extension.
 @param closedTab The tab that was closed.
 @param windowIsClosing A boolean value indicating whether the window containing the tab is also closing.
 @discussion This method informs only the specific extension of the closure of a tab. If the intention is to inform all loaded
 extensions consistently, you should use the respective method on the extension controller instead.
 @seealso didOpenTab:
 @seealso openTabs
 */
- (void)didCloseTab:(id <WKWebExtensionTab>)closedTab windowIsClosing:(BOOL)windowIsClosing NS_REFINED_FOR_SWIFT;

/*!
 @abstract Should be called by the app when a tab is activated to notify only this specific extension.
 @param activatedTab The tab that has become active.
 @param previousTab The tab that was active before. This parameter can be \c nil if there was no previously active tab.
 @discussion This method informs only the specific extension of the tab activation. If the intention is to inform all loaded
 extensions consistently, you should use the respective method on the extension controller instead.
 */
- (void)didActivateTab:(id<WKWebExtensionTab>)activatedTab previousActiveTab:(nullable id<WKWebExtensionTab>)previousTab NS_REFINED_FOR_SWIFT;

/*!
 @abstract Should be called by the app when tabs are selected to fire appropriate events with only this extension.
 @param selectedTabs The set of tabs that were selected.
 @discussion This method informs only the specific extension that tabs have been selected. If the intention is to inform all loaded
 extensions consistently, you should use the respective method on the extension controller instead.
 */
- (void)didSelectTabs:(NSArray<id <WKWebExtensionTab>> *)selectedTabs NS_SWIFT_NAME(didSelectTabs(_:));

/*!
 @abstract Should be called by the app when tabs are deselected to fire appropriate events with only this extension.
 @param deselectedTabs The set of tabs that were deselected.
 @discussion This method informs only the specific extension that tabs have been deselected. If the intention is to inform all loaded
 extensions consistently, you should use the respective method on the extension controller instead.
 */
- (void)didDeselectTabs:(NSArray<id <WKWebExtensionTab>> *)deselectedTabs NS_SWIFT_NAME(didDeselectTabs(_:));

/*!
 @abstract Should be called by the app when a tab is moved to fire appropriate events with only this extension.
 @param movedTab The tab that was moved.
 @param index The old index of the tab within the window.
 @param oldWindow The window that the tab was moved from, or \c nil if the tab is moving from no open window.
 @discussion If the window is staying the same, the current window should be specified. This method informs only the specific extension
 that a tab has been moved. If the intention is to inform all loaded extensions consistently, you should use the respective method on
 the extension controller instead.
 */
- (void)didMoveTab:(id <WKWebExtensionTab>)movedTab fromIndex:(NSUInteger)index inWindow:(nullable id <WKWebExtensionWindow>)oldWindow NS_REFINED_FOR_SWIFT;

/*!
 @abstract Should be called by the app when a tab is replaced by another tab to fire appropriate events with only this extension.
 @param oldTab The tab that was replaced.
 @param newTab The tab that replaced the old tab.
 @discussion This method informs only the specific extension that a tab has been replaced. If the intention is to inform all loaded
 extensions consistently, you should use the respective method on the extension controller instead.
 */
- (void)didReplaceTab:(id <WKWebExtensionTab>)oldTab withTab:(id <WKWebExtensionTab>)newTab NS_SWIFT_NAME(didReplaceTab(_:with:));

/*!
 @abstract Should be called by the app when the properties of a tab are changed to fire appropriate events with only this extension.
 @param properties The properties of the tab that were changed.
 @param changedTab The tab whose properties were changed.
 @discussion This method informs only the specific extension of the changes to a tab's properties. If the intention is to inform all loaded
 extensions consistently, you should use the respective method on the extension controller instead.
 */
- (void)didChangeTabProperties:(WKWebExtensionTabChangedProperties)properties forTab:(id <WKWebExtensionTab>)changedTab NS_SWIFT_NAME(didChangeTabProperties(_:for:));

@end

WK_HEADER_AUDIT_END(nullability, sendability)
