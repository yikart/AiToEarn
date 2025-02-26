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

#import <WebKit/WKWebExtensionPermission.h>

@class WKWebExtensionAction;
@class WKWebExtensionContext;
@class WKWebExtensionController;
@class WKWebExtensionMatchPattern;
@class WKWebExtensionMessagePort;
@class WKWebExtensionTabConfiguration;
@class WKWebExtensionWindowConfiguration;
@protocol WKWebExtensionTab;
@protocol WKWebExtensionWindow;

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA)) WK_SWIFT_UI_ACTOR
@protocol WKWebExtensionControllerDelegate <NSObject>
@optional

/*!
 @abstract Called when an extension context requests the list of ordered open windows.
 @param controller The web extension controller that is managing the extension.
 @param extensionContext The context in which the web extension is running.
 @return The array of ordered open windows.
 @discussion This method should be implemented by the app to provide the extension with the ordered open windows. Depending on your
 app's requirements, you may return different windows for each extension or the same windows for all extensions. The first window in the returned
 array must correspond to the currently focused window and match the result of ``webExtensionController:focusedWindowForExtensionContext:``.
 If ``webExtensionController:focusedWindowForExtensionContext:`` returns `nil`, indicating that no window has focus or the focused
 window is not visible to the extension, the first window in the list returned by this method will be considered the presumed focused window. An empty result
 indicates no open windows are available for the extension. Defaults to an empty array if not implemented.
 @seealso webExtensionController:focusedWindowForExtensionContext:
 */
- (NSArray<id <WKWebExtensionWindow>> *)webExtensionController:(WKWebExtensionController *)controller openWindowsForExtensionContext:(WKWebExtensionContext *)extensionContext NS_SWIFT_NAME(webExtensionController(_:openWindowsFor:));

/*!
 @abstract Called when an extension context requests the currently focused window.
 @param controller The web extension controller that is managing the extension.
 @param extensionContext The context in which the web extension is running.
 @return The window that is currently focused, or `nil` if no window is focused or the focused window is not visible to the extension.
 @discussion This method can be optionally implemented by the app to designate the window currently in focus to the extension.
 If not implemented, the first window in the result of ``webExtensionController:openWindowsForExtensionContext:`` is used.
 @seealso webExtensionController:openWindowsForExtensionContext:
 */
- (nullable id <WKWebExtensionWindow>)webExtensionController:(WKWebExtensionController *)controller focusedWindowForExtensionContext:(WKWebExtensionContext *)extensionContext NS_SWIFT_NAME(webExtensionController(_:focusedWindowFor:));

/*!
 @abstract Called when an extension context requests a new window to be opened.
 @param controller The web extension controller that is managing the extension.
 @param configuration The configuration specifying how the new window should be created.
 @param extensionContext The context in which the web extension is running.
 @param completionHandler A block to be called with the newly created window or \c nil if the window wasn't created. An error should be
 provided if any errors occurred.
 @discussion This method should be implemented by the app to handle requests to open new windows. The app can decide how to handle the
 process based on the provided configuration and existing windows. Once handled, the app should call the completion handler with the opened window
 or `nil` if the request was declined or failed. If not implemented, the extension will be unable to open new windows.
 */
- (void)webExtensionController:(WKWebExtensionController *)controller openNewWindowUsingConfiguration:(WKWebExtensionWindowConfiguration *)configuration forExtensionContext:(WKWebExtensionContext *)extensionContext completionHandler:(void (^)(id <WKWebExtensionWindow> WK_NULLABLE_RESULT newWindow, NSError * _Nullable error))completionHandler NS_SWIFT_NAME(webExtensionController(_:openNewWindowUsing:for:completionHandler:));

/*!
 @abstract Called when an extension context requests a new tab to be opened.
 @param controller The web extension controller that is managing the extension.
 @param configuration The configuration specifying how the new tab should be created.
 @param extensionContext The context in which the web extension is running.
 @param completionHandler A block to be called with the newly created tab or \c nil if the tab wasn't created. An error should be
 provided if any errors occurred.
 @discussion This method should be implemented by the app to handle requests to open new tabs. The app can decide how to handle the
 process based on the provided configuration and existing tabs. Once handled, the app should call the completion handler with the opened tab
 or `nil` if the request was declined or failed. If not implemented, the extension will be unable to open new tabs.
 */
- (void)webExtensionController:(WKWebExtensionController *)controller openNewTabUsingConfiguration:(WKWebExtensionTabConfiguration *)configuration forExtensionContext:(WKWebExtensionContext *)extensionContext completionHandler:(void (^)(id <WKWebExtensionTab> WK_NULLABLE_RESULT newTab, NSError * _Nullable error))completionHandler NS_SWIFT_NAME(webExtensionController(_:openNewTabUsing:for:completionHandler:));

/*!
 @abstract Called when an extension context requests its options page to be opened.
 @param controller The web extension controller that is managing the extension.
 @param extensionContext The context in which the web extension is running.
 @param completionHandler A block to be called once the options page has been displayed or with an error if the page could not be shown.
 @discussion This method should be implemented by the app to handle requests to display the extension's options page. The app can decide
 how and where to display the options page (e.g., in a new tab or a separate window). The app should call the completion handler once the options
 page is visible to the user, or with an error if the operation was declined or failed. If not implemented, the options page will be opened in a new tab
 using the ``webExtensionController:openNewTabUsingConfiguration:forExtensionContext:completionHandler:`` delegate method.
 */
- (void)webExtensionController:(WKWebExtensionController *)controller openOptionsPageForExtensionContext:(WKWebExtensionContext *)extensionContext completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(webExtensionController(_:openOptionsPageFor:completionHandler:));

/*!
 @abstract Called when an extension context requests permissions.
 @param controller The web extension controller that is managing the extension.
 @param permissions The set of permissions being requested by the extension.
 @param tab The tab in which the extension is running, or \c nil if the request is not specific to a tab.
 @param extensionContext The context in which the web extension is running.
 @param completionHandler A block to be called with the set of allowed permissions and an optional expiration date.
 @discussion This method should be implemented by the app to prompt the user for permission and call the completion handler with the
 set of permissions that were granted and an optional expiration date. If not implemented or the completion handler is not called within a reasonable
 amount of time, the request is assumed to have been denied. The expiration date can be used to specify when the permissions expire. If `nil`,
 permissions are assumed to not expire.
 */
- (void)webExtensionController:(WKWebExtensionController *)controller promptForPermissions:(NSSet<WKWebExtensionPermission> *)permissions inTab:(nullable id <WKWebExtensionTab>)tab forExtensionContext:(WKWebExtensionContext *)extensionContext completionHandler:(void (^)(NSSet<WKWebExtensionPermission> *allowedPermissions, NSDate * _Nullable expirationDate))completionHandler NS_SWIFT_NAME(webExtensionController(_:promptForPermissions:in:for:completionHandler:));

/*!
 @abstract Called when an extension context requests access to a set of URLs.
 @param controller The web extension controller that is managing the extension.
 @param urls The set of URLs that the extension is requesting access to.
 @param tab The tab in which the extension is running, or \c nil if the request is not specific to a tab.
 @param extensionContext The context in which the web extension is running.
 @param completionHandler A block to be called with the set of allowed URLs and an optional expiration date.
 @discussion This method should be implemented by the app to prompt the user for permission and call the completion handler with the
 set of URLs that were granted access to and an optional expiration date. If not implemented or the completion handler is not called within a
 reasonable amount of time, the request is assumed to have been denied. The expiration date can be used to specify when the URLs expire.
 If `nil`, URLs are assumed to not expire.
 */
- (void)webExtensionController:(WKWebExtensionController *)controller promptForPermissionToAccessURLs:(NSSet<NSURL *> *)urls inTab:(nullable id <WKWebExtensionTab>)tab forExtensionContext:(WKWebExtensionContext *)extensionContext completionHandler:(void (^)(NSSet<NSURL *> *allowedURLs, NSDate * _Nullable expirationDate))completionHandler NS_SWIFT_NAME(webExtensionController(_:promptForPermissionToAccess:in:for:completionHandler:));

/*!
 @abstract Called when an extension context requests access to a set of match patterns.
 @param controller The web extension controller that is managing the extension.
 @param matchPatterns The set of match patterns that the extension is requesting access to.
 @param tab The tab in which the extension is running, or \c nil if the request is not specific to a tab.
 @param extensionContext The context in which the web extension is running.
 @param completionHandler A block to be called with the set of allowed match patterns and an optional expiration date.
 @discussion This method should be implemented by the app to prompt the user for permission and call the completion handler with the
 set of match patterns that were granted access to and an optional expiration date. If not implemented or the completion handler is not called
 within a reasonable amount of time, the request is assumed to have been denied. The expiration date can be used to specify when the match
 patterns expire. If `nil`, match patterns are assumed to not expire.
 */
- (void)webExtensionController:(WKWebExtensionController *)controller promptForPermissionMatchPatterns:(NSSet<WKWebExtensionMatchPattern *> *)matchPatterns inTab:(nullable id <WKWebExtensionTab>)tab forExtensionContext:(WKWebExtensionContext *)extensionContext completionHandler:(void (^)(NSSet<WKWebExtensionMatchPattern *> *allowedMatchPatterns, NSDate * _Nullable expirationDate))completionHandler NS_SWIFT_NAME(webExtensionController(_:promptForPermissionMatchPatterns:in:for:completionHandler:));

/*!
 @abstract Called when an action's properties are updated.
 @param controller The web extension controller initiating the request.
 @param action The web extension action whose properties are updated.
 @param context The context within which the web extension is running.
 @discussion This method is called when an action's properties are updated and should be reflected in the app's user interface.
 The app should ensure that any visible changes, such as icons and labels, are updated accordingly.
 */
- (void)webExtensionController:(WKWebExtensionController *)controller didUpdateAction:(WKWebExtensionAction *)action forExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(webExtensionController(_:didUpdate:forExtensionContext:));

/*!
 @abstract Called when a popup is requested to be displayed for a specific action.
 @param controller The web extension controller initiating the request.
 @param action The action for which the popup is requested.
 @param context The context within which the web extension is running.
 @param completionHandler A block to be called once the popup display operation is completed.
 @discussion This method is called in response to the extension's scripts or when invoking ``performActionForTab:`` if the action has a popup.
 The associated tab, if applicable, can be located through the ``associatedTab`` property of the ``action`` parameter. This delegate method is
 called when the web view for the popup is fully loaded and ready to display. Implementing this method is needed if the app intends to support
 programmatically showing the popup by the extension, although it is recommended for handling both programmatic and user-initiated cases.
 */
- (void)webExtensionController:(WKWebExtensionController *)controller presentPopupForAction:(WKWebExtensionAction *)action forExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(webExtensionController(_:presentActionPopup:for:completionHandler:));

/*!
 @abstract Called when an extension context wants to send a one-time message to an application.
 @param controller The web extension controller that is managing the extension.
 @param message The message to be sent.
 @param applicationIdentifier The unique identifier for the application, or \c nil if none was specified.
 @param extensionContext The context in which the web extension is running.
 @param replyHandler A block to be called with a JSON-serializable reply message or an error.
 @discussion This method should be implemented by the app to handle one-off messages to applications.
 If not implemented, the default behavior is to pass the message to the app extension handler within the extension's bundle,
 if the extension was loaded from an app extension bundle; otherwise, no action is performed if not implemented.
 @note The reply message must be JSON-serializable according to ``NSJSONSerialization``.
 */
- (void)webExtensionController:(WKWebExtensionController *)controller sendMessage:(id)message toApplicationWithIdentifier:(nullable NSString *)applicationIdentifier forExtensionContext:(WKWebExtensionContext *)extensionContext replyHandler:(void (^)(id WK_NULLABLE_RESULT replyMessage, NSError * _Nullable error))replyHandler NS_SWIFT_NAME(webExtensionController(_:sendMessage:toApplicationWithIdentifier:for:replyHandler:)) WK_SWIFT_ASYNC(5);

/*!
 @abstract Called when an extension context wants to establish a persistent connection to an application.
 @param controller The web extension controller that is managing the extension.
 @param extensionContext The context in which the web extension is running.
 @param port A port object for handling the message exchange.
 @param completionHandler A block to be called when the connection is ready to use, taking an optional error.
 If the connection is successfully established, the error should be \c nil.
 @discussion This method should be implemented by the app to handle establishing connections to applications.
 The provided ``WKWebExtensionPort`` object can be used to handle message sending, receiving, and disconnection.
 You should retain the port object for as long as the connection remains active. Releasing the port will disconnect it.
 If not implemented, the default behavior is to pass the messages to the app extension handler within the extension's bundle,
 if the extension was loaded from an app extension bundle; otherwise, no action is performed if not implemented.
 */
- (void)webExtensionController:(WKWebExtensionController *)controller connectUsingMessagePort:(WKWebExtensionMessagePort *)port forExtensionContext:(WKWebExtensionContext *)extensionContext completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(webExtensionController(_:connectUsing:for:completionHandler:));

@end

WK_HEADER_AUDIT_END(nullability, sendability)
