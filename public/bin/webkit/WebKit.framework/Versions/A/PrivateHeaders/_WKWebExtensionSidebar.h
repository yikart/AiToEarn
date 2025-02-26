/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

@class WKWebExtensionContext;
@class WKWebView;
@protocol WKWebExtensionTab;
@protocol WKWebExtension;

#if TARGET_OS_IPHONE
@class UIImage;
@class UIViewController;
#else
@class NSImage;
@class NSViewController;
#endif

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

/*!
 @abstract A `_WKWebExtensionSidebar` object encapsulates the properties for a specific web extension sidebar.
 @discussion When this property is `nil`, it indicates that the action is the default action and not associated with a specific tab.
 */
WK_CLASS_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
NS_SWIFT_NAME(WKWebExtension.Sidebar)
@interface _WKWebExtensionSidebar : NSObject

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)new NS_UNAVAILABLE;

/*! @abstract The extension context to which this sidebar is related. */
@property (nonatomic, nullable, readonly, weak) WKWebExtensionContext *webExtensionContext;

/*! @abstract The tab that this sidebar is associated with, or `nil` if it is the default sidebar */
@property (nonatomic, nullable, readonly, weak) id <WKWebExtensionTab> associatedTab;

/*! @abstract The title of this sidebar. */
@property (nonatomic, readonly, copy) NSString *title;

/*!
 @abstract Get the sidebar icon of the given size.
 @param size The size to use when looking up the sidebar icon.
 @result The sidebar icon, or the action icon if the sidebar specifies no icon, or `nil` if the action icon was unable to be loaded.
 */
#if TARGET_OS_IPHONE
- (nullable UIImage *)iconForSize:(CGSize)size;
#else
- (nullable NSImage *)iconForSize:(CGSize)size;
#endif

/*! @abstract Whether this sidebar is enabled or not. */
@property (nonatomic, readonly, getter=isEnabled) BOOL enabled;

/*! @abstract The web view which should be displayed when this sidebar is opened, or `nil` if this sidebar is not a tab-specific sidebar. */
@property (nonatomic, nullable, readonly) WKWebView *webView;

#if TARGET_OS_IPHONE
/*!
 @abstract A view controller that presents a web view which will load the sidebar page for this sidebar, or `nil` if this sidebar
 is not a tab-specific sidebar.
 */
@property (nonatomic, nullable, readonly) UIViewController *viewController;
#endif

#if TARGET_OS_OSX
/*!
 @abstract The view controller that presents a web view which will load the sidebar page for this sidebar, or `nil` if this sidebar
 is not a tab-specific sidebar.
 */
@property (nonatomic, nullable, readonly) NSViewController *viewController;
#endif

/*!
 @abstract Indicate that the sidebar will be opened
 @discussion This method should be invoked by the browser when this sidebar will be opened due to some action by the user. If
 this method is not called before the sidebar is opened, then the ``WKWebView`` associated with this sidebar may not have a
 document loaded, and the extension may not receive the `activeTab` permission from this user interaction.
 */
- (void)willOpenSidebar;

/*!
 @abstract Indicate that the sidebar will be closed
 @discussion This method should be invoked by the browser when the sidebar will be closed -- i.e., its associated ``WKWebView`` will cease
 to be displayed. If this method is not called when the sidebar is closed, then the sidebar's associated ``WKWebView`` may remain active longer than
 necessary. Note that calling this method does not guarantee that the ``WKWebView`` associated with a particular sidebar will be deallocated, as the
 web view may be shared between mutliple sidebars.
 */
- (void)willCloseSidebar;

@end // interface _WKWebExtensionSidebar

WK_HEADER_AUDIT_END(nullability, sendability)
