/*
 * Copyright (C) 2023-2024 Apple Inc. All rights reserved.
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

@class WKWebView;
@class WKWebExtensionContext;
@protocol WKWebExtensionTab;

#if TARGET_OS_IPHONE
@class UIImage;
@class UIMenuElement;
@class UIViewController;
#else
@class NSImage;
@class NSMenuItem;
@class NSPopover;
#endif

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

/*!
 @abstract A ``WKWebExtensionAction`` object encapsulates the properties for an individual web extension action.
 @discussion Provides access to action properties such as popup, icon, and title, with tab-specific values.
 */
WK_CLASS_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_SWIFT_UI_ACTOR NS_SWIFT_NAME(WKWebExtension.Action)
@interface WKWebExtensionAction : NSObject

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)new NS_UNAVAILABLE;

/*! @abstract The extension context to which this action is related. */
@property (nonatomic, readonly, weak) WKWebExtensionContext *webExtensionContext;

/*!
 @abstract The tab that this action is associated with, or `nil` if it is the default action.
 @discussion When this property is `nil`, it indicates that the action is the default action and not associated with a specific tab.
 */
@property (nonatomic, readonly, nullable, weak) id <WKWebExtensionTab> associatedTab;

/*!
 @abstract Returns the action icon for the specified size.
 @param size The size to use when looking up the action icon.
 @result The action icon, or `nil` if the icon was unable to be loaded.
 @discussion This icon should represent the extension in action sheets or toolbars. The returned image will be the best match for the specified
 size that is available in the extension's action icon set. If no matching icon is available, the method will fall back to the extension's icon.
 */
#if TARGET_OS_IPHONE
- (nullable UIImage *)iconForSize:(CGSize)size;
#else
- (nullable NSImage *)iconForSize:(CGSize)size;
#endif

/*! @abstract The localized display label for the action. */
@property (nonatomic, readonly, copy) NSString *label;

/*!
 @abstract The badge text for the action.
 @discussion Provides the text that appears on the badge for the action. An empty string signifies that no badge should be shown.
 */
@property (nonatomic, readonly, copy) NSString *badgeText;

/*!
 @abstract A Boolean value indicating whether the badge text is unread.
 @discussion This property is automatically set to `YES` when ``badgeText`` changes and is not empty. If ``badgeText`` becomes empty or the
 popup associated with the action is presented, this property is automatically set to `NO`. Additionally, it should be set to `NO` by the app when the badge
 has been presented to the user. This property is useful for higher-level notification badges when extensions might be hidden behind an action sheet.
 */
@property (nonatomic) BOOL hasUnreadBadgeText;

/*!
 @abstract The name shown when inspecting the popup web view.
 @discussion This is the text that will appear when inspecting the popup web view.
 */
@property (nonatomic, nullable, copy) NSString *inspectionName;

/*! @abstract A Boolean value indicating whether the action is enabled. */
@property (nonatomic, readonly, getter=isEnabled) BOOL enabled;

/*!
 @abstract The menu items provided by the extension for this action.
 @discussion Provides menu items supplied by the extension, allowing the user to perform extension-defined actions.
 The app is responsible for displaying these menu items, typically in a context menu or a long-press menu on the action in action sheets or toolbars.
 @note The properties of the menu items, including the items themselves, can change dynamically. Therefore, the app should fetch the menu items
 on demand immediately before showing them, to ensure that the most current and relevant items are presented.
 */
#if TARGET_OS_IPHONE
@property (nonatomic, readonly, copy) NSArray<UIMenuElement *> *menuItems;
#else
@property (nonatomic, readonly, copy) NSArray<NSMenuItem *> *menuItems;
#endif

/*!
 @abstract A Boolean value indicating whether the action has a popup.
 @discussion Use this property to check if the action has a popup before attempting to show any popup views.
 */
@property (nonatomic, readonly) BOOL presentsPopup;

#if TARGET_OS_IPHONE
/*!
 @abstract A view controller that presents a web view loaded with the popup page for this action, or `nil` if no popup is specified.
 @discussion The view controller adaptively adjusts its presentation style based on where it is presented from, preferring popover.
 It contains a web view preloaded with the popup page and automatically adjusts its ``preferredContentSize`` to fit the web view's
 content size. The ``presentsPopup`` property should be checked to determine the availability of a popup before using this property.
 Dismissing the view controller will close the popup and unload the web view.
 @seealso presentsPopup
 */
@property (nonatomic, readonly, nullable) UIViewController *popupViewController;
#endif

#if TARGET_OS_OSX
/*!
 @abstract A popover that presents a web view loaded with the popup page for this action, or `nil` if no popup is specified.
 @discussion This popover contains a view controller with a web view preloaded with the popup page. It automatically adjusts its size to fit
 the web view's content size. The ``presentsPopup`` property should be checked to determine the availability of a popup before using this
 property.  Dismissing the popover will close the popup and unload the web view.
 @seealso presentsPopup
 */
@property (nonatomic, readonly, nullable) NSPopover *popupPopover;
#endif

/*!
 @abstract A web view loaded with the popup page for this action, or `nil` if no popup is specified.
 @discussion The web view will be preloaded with the popup page upon first access or after it has been unloaded. Use the ``presentsPopup``
 property to determine whether a popup should be displayed before using this property.
 @seealso presentsPopup
 */
@property (nonatomic, readonly, nullable) WKWebView *popupWebView;

/*!
 @abstract Triggers the dismissal process of the popup.
 @discussion Invoke this method to manage the popup's lifecycle, ensuring the web view is unloaded and resources are released once the
 popup closes. This method is automatically called upon the dismissal of the action's ``UIViewController`` or ``NSPopover``.  For custom
 scenarios where the popup's lifecycle is manually managed, it must be explicitly invoked to ensure proper closure.
 */
- (void)closePopup;

@end

WK_HEADER_AUDIT_END(nullability, sendability)
