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

@class WKWebExtensionContext;
@protocol WKWebExtensionTab;

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

/*!
 @abstract Constants used by ``WKWebExtensionWindow`` to indicate the type of a window.
 @constant WKWebExtensionWindowTypeNormal  Indicates a normal window.
 @constant WKWebExtensionWindowTypePopup  Indicates a popup window.
 */
typedef NS_ENUM(NSInteger, WKWebExtensionWindowType) {
    WKWebExtensionWindowTypeNormal,
    WKWebExtensionWindowTypePopup,
} NS_SWIFT_NAME(WKWebExtension.WindowType) WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*!
 @abstract Constants used by ``WKWebExtensionWindow`` to indicate possible states of a window.
 @constant WKWebExtensionWindowStateNormal  Indicates a window is in its normal state.
 @constant WKWebExtensionWindowStateMinimized  Indicates a window is minimized.
 @constant WKWebExtensionWindowStateMaximized  Indicates a window is maximized.
 @constant WKWebExtensionWindowStateFullscreen  Indicates a window is in fullscreen mode.
 */
typedef NS_ENUM(NSInteger, WKWebExtensionWindowState) {
    WKWebExtensionWindowStateNormal,
    WKWebExtensionWindowStateMinimized,
    WKWebExtensionWindowStateMaximized,
    WKWebExtensionWindowStateFullscreen,
} NS_SWIFT_NAME(WKWebExtension.WindowState) WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*! @abstract A class conforming to the ``WKWebExtensionWindow`` protocol represents a window to web extensions. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA)) WK_SWIFT_UI_ACTOR
@protocol WKWebExtensionWindow <NSObject>
@optional

/*!
 @abstract Called when the tabs are needed for the window.
 @param context The context in which the web extension is running.
 @return An array of tabs in the window.
 @discussion Defaults to an empty array if not implemented.
 */
- (NSArray<id <WKWebExtensionTab>> *)tabsForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(tabs(for:));

/*!
 @abstract Called when the active tab is needed for the window.
 @param context The context in which the web extension is running.
 @return The active tab in the window, which represents the frontmost tab currently in view.
 @discussion Defaults to `nil` if not implemented.
 */
- (nullable id <WKWebExtensionTab>)activeTabForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(activeTab(for:));

/*!
 @abstract Called when the type of the window is needed.
 @param context The context in which the web extension is running.
 @return The type of the window.
 @discussion Defaults to``WKWebExtensionWindowTypeNormal`` if not implemented.
 */
- (WKWebExtensionWindowType)windowTypeForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(windowType(for:));

/*!
 @abstract Called when the state of the window is needed.
 @param context The context in which the web extension is running.
 @return The state of the window.
 @discussion Defaults to``WKWebExtensionWindowStateNormal`` if not implemented.
 */
- (WKWebExtensionWindowState)windowStateForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(windowState(for:));

/*!
 @abstract Called to set the state of the window.
 @param context The context in which the web extension is running.
 @param state The new state of the window.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion The implementation of ``windowStateForWebExtensionContext:`` is a prerequisite.
 Without it, this method will not be called.
 @seealso windowStateForWebExtensionContext:
 */
- (void)setWindowState:(WKWebExtensionWindowState)state forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(setWindowState(_:for:completionHandler:));

/*!
 @abstract Called when the private state of the window is needed.
 @param context The context in which the web extension is running.
 @return `YES` if the window is private, `NO` otherwise.
 @discussion Defaults to `NO` if not implemented. This value is cached and will not change for the duration of the window or its contained tabs.
 @note To ensure proper isolation between private and non-private data, web views associated with private data must use a
 different ``WKUserContentController``. Likewise, to be identified as a private web view and to ensure that cookies and other
 website data is not shared, private web views must be configured to use a non-persistent ``WKWebsiteDataStore``.
 */
- (BOOL)isPrivateForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(isPrivate(for:));

#if TARGET_OS_OSX
/*!
 @abstract Called when the screen frame containing the window is needed.
 @param context The context associated with the running web extension.
 @return The frame for the screen containing the window.
 @discussion Defaults to ``CGRectNull`` if not implemented.
 */
- (CGRect)screenFrameForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(screenFrame(for:));
#endif // TARGET_OS_OSX

/*!
 @abstract Called when the frame of the window is needed.
 @param context The context in which the web extension is running.
 @return The frame of the window, in screen coordinates
 @discussion Defaults to ``CGRectNull`` if not implemented.
 */
- (CGRect)frameForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(frame(for:));

/*!
 @abstract Called to set the frame of the window.
 @param context The context in which the web extension is running.
 @param frame The new frame of the window, in screen coordinates.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion On macOS, the implementation of both ``frameForWebExtensionContext:`` and ``screenFrameForWebExtensionContext:``
 are prerequisites. On iOS, iPadOS, and visionOS, only ``frameForWebExtensionContext:`` is a prerequisite. Without the respective method(s),
 this method will not be called.
 @seealso frameForWebExtensionContext:
 @seealso screenFrameForWebExtensionContext:
 */
- (void)setFrame:(CGRect)frame forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(setFrame(_:for:completionHandler:));

/*!
 @abstract Called to focus the window.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion No action is performed if not implemented.
 */
- (void)focusForWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(focus(for:completionHandler:));

/*!
 @abstract Called to close the window.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion No action is performed if not implemented.
 */
- (void)closeForWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(close(for:completionHandler:));

@end

WK_HEADER_AUDIT_END(nullability, sendability)
