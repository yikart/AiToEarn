/*
 * Copyright (C) 2014-2022 Apple Inc. All rights reserved.
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

#import <WebKit/WKFoundation.h>

#import <Foundation/Foundation.h>
#import <WebKit/WKPreviewActionItem.h>

NS_ASSUME_NONNULL_BEGIN

@class WKFrameInfo;
@class WKNavigationAction;
@class WKOpenPanelParameters;
@class WKPreviewElementInfo;
@class WKSecurityOrigin;
@class WKWebView;
@class WKWebViewConfiguration;
@class WKWindowFeatures;

#if TARGET_OS_IOS || (defined(TARGET_OS_VISION) && TARGET_OS_VISION)
@class WKContextMenuElementInfo;
@class UIContextMenuConfiguration;
@protocol UIContextMenuInteractionCommitAnimating;
@protocol UIEditMenuInteractionAnimating;
#endif

typedef NS_ENUM(NSInteger, WKPermissionDecision) {
    WKPermissionDecisionPrompt,
    WKPermissionDecisionGrant,
    WKPermissionDecisionDeny,
} WK_API_AVAILABLE(macos(12.0), ios(15.0));

typedef NS_ENUM(NSInteger, WKMediaCaptureType) {
    WKMediaCaptureTypeCamera,
    WKMediaCaptureTypeMicrophone,
    WKMediaCaptureTypeCameraAndMicrophone,
} WK_API_AVAILABLE(macos(12.0), ios(15.0));

/*! @enum WKDialogResult
@abstract Constants returned by showLockdownModeFirstUseMessage to indicate how WebKit should treat first use.
@constant WKDialogResultShowDefault Indicates that the client did not display a first use message. WebKit should show the default.
@constant WKDialogResultAskAgain Indicates the client handled the message, but wants to be checked if other WKWebViews are used.
@constant WKDialogResultHandled Indicates the client handled the message and no further checks are needed.
*/
typedef NS_ENUM(NSInteger, WKDialogResult) {
    WKDialogResultShowDefault = 1,
    WKDialogResultAskAgain,
    WKDialogResultHandled
} WK_API_AVAILABLE(ios(16.0));

/*! A class conforming to the WKUIDelegate protocol provides methods for
 presenting native UI on behalf of a webpage.
 */
WK_SWIFT_UI_ACTOR
@protocol WKUIDelegate <NSObject>

@optional

/*! @abstract Creates a new web view.
 @param webView The web view invoking the delegate method.
 @param configuration The configuration to use when creating the new web
 view. This configuration is a copy of webView.configuration.
 @param navigationAction The navigation action causing the new web view to
 be created.
 @param windowFeatures Window features requested by the webpage.
 @result A new web view or nil.
 @discussion The web view returned must be created with the specified configuration. WebKit will load the request in the returned web view.

 If you do not implement this method, the web view will cancel the navigation.
 */
- (nullable WKWebView *)webView:(WKWebView *)webView createWebViewWithConfiguration:(WKWebViewConfiguration *)configuration forNavigationAction:(WKNavigationAction *)navigationAction windowFeatures:(WKWindowFeatures *)windowFeatures;

/*! @abstract Notifies your app that the DOM window object's close() method completed successfully.
  @param webView The web view invoking the delegate method.
  @discussion Your app should remove the web view from the view hierarchy and update
  the UI as needed, such as by closing the containing browser tab or window.
  */
- (void)webViewDidClose:(WKWebView *)webView WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @abstract Displays a JavaScript alert panel.
 @param webView The web view invoking the delegate method.
 @param message The message to display.
 @param frame Information about the frame whose JavaScript initiated this
 call.
 @param completionHandler The completion handler to call after the alert
 panel has been dismissed.
 @discussion For user security, your app should call attention to the fact
 that a specific website controls the content in this panel. A simple forumla
 for identifying the controlling website is frame.request.URL.host.
 The panel should have a single OK button.

 If you do not implement this method, the web view will behave as if the user selected the OK button.
 */
- (void)webView:(WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(WK_SWIFT_UI_ACTOR void (^)(void))completionHandler;

/*! @abstract Displays a JavaScript confirm panel.
 @param webView The web view invoking the delegate method.
 @param message The message to display.
 @param frame Information about the frame whose JavaScript initiated this call.
 @param completionHandler The completion handler to call after the confirm
 panel has been dismissed. Pass YES if the user chose OK, NO if the user
 chose Cancel.
 @discussion For user security, your app should call attention to the fact
 that a specific website controls the content in this panel. A simple forumla
 for identifying the controlling website is frame.request.URL.host.
 The panel should have two buttons, such as OK and Cancel.

 If you do not implement this method, the web view will behave as if the user selected the Cancel button.
 */
- (void)webView:(WKWebView *)webView runJavaScriptConfirmPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(WK_SWIFT_UI_ACTOR void (^)(BOOL result))completionHandler;

/*! @abstract Displays a JavaScript text input panel.
 @param webView The web view invoking the delegate method.
 @param prompt The prompt to display.
 @param defaultText The initial text to display in the text entry field.
 @param frame Information about the frame whose JavaScript initiated this call.
 @param completionHandler The completion handler to call after the text
 input panel has been dismissed. Pass the entered text if the user chose
 OK, otherwise nil.
 @discussion For user security, your app should call attention to the fact
 that a specific website controls the content in this panel. A simple forumla
 for identifying the controlling website is frame.request.URL.host.
 The panel should have two buttons, such as OK and Cancel, and a field in
 which to enter text.

 If you do not implement this method, the web view will behave as if the user selected the Cancel button.
 */
- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(nullable NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(WK_SWIFT_UI_ACTOR void (^)(NSString * _Nullable result))completionHandler;

/*! @abstract Handle a JavaScript dialog.
 @param webView The web view invoking the delegate method.
 @param accept Whether to accept the dialog.
 @param value Value to use for prompt dialog.
 */
- (void)webView:(WKWebView *)webView handleJavaScriptDialog:(BOOL)accept value:(nullable NSString *)value;

/*! @abstract A delegate to request permission for microphone audio and camera video access.
 @param webView The web view invoking the delegate method.
 @param origin The origin of the page.
 @param frame Information about the frame whose JavaScript initiated this call.
 @param type The type of capture (camera, microphone).
 @param decisionHandler The completion handler to call once the decision is made
 @discussion If not implemented, the result is the same as calling the decisionHandler with WKPermissionDecisionPrompt.
 */
- (void)webView:(WKWebView *)webView requestMediaCapturePermissionForOrigin:(WKSecurityOrigin *)origin initiatedByFrame:(WKFrameInfo *)frame type:(WKMediaCaptureType)type decisionHandler:(WK_SWIFT_UI_ACTOR void (^)(WKPermissionDecision decision))decisionHandler WK_SWIFT_ASYNC_NAME(webView(_:decideMediaCapturePermissionsFor:initiatedBy:type:)) WK_SWIFT_ASYNC(5) WK_API_AVAILABLE(macos(12.0), ios(15.0));

/*! @abstract Allows your app to determine whether or not the given security origin should have access to the device's orientation and motion.
 @param securityOrigin The security origin which requested access to the device's orientation and motion.
 @param frame The frame that initiated the request.
 @param decisionHandler The decision handler to call once the app has made its decision.
 */
- (void)webView:(WKWebView *)webView requestDeviceOrientationAndMotionPermissionForOrigin:(WKSecurityOrigin *)origin initiatedByFrame:(WKFrameInfo *)frame decisionHandler:(WK_SWIFT_UI_ACTOR void (^)(WKPermissionDecision decision))decisionHandler WK_API_AVAILABLE(ios(15.0)) WK_API_UNAVAILABLE(macos);

#if TARGET_OS_IPHONE

/*! @abstract Allows your app to determine whether or not the given element should show a preview.
 @param webView The web view invoking the delegate method.
 @param elementInfo The elementInfo for the element the user has started touching.
 @discussion To disable previews entirely for the given element, return NO. Returning NO will prevent 
 webView:previewingViewControllerForElement:defaultActions: and webView:commitPreviewingViewController:
 from being invoked.
 
 This method will only be invoked for elements that have default preview in WebKit, which is
 limited to links. In the future, it could be invoked for additional elements.
 */
- (BOOL)webView:(WKWebView *)webView shouldPreviewElement:(WKPreviewElementInfo *)elementInfo WK_API_DEPRECATED_WITH_REPLACEMENT("webView:contextMenuConfigurationForElement:completionHandler:", ios(10.0, 13.0));

/*! @abstract Allows your app to provide a custom view controller to show when the given element is peeked.
 @param webView The web view invoking the delegate method.
 @param elementInfo The elementInfo for the element the user is peeking.
 @param defaultActions An array of the actions that WebKit would use as previewActionItems for this element by 
 default. These actions would be used if allowsLinkPreview is YES but these delegate methods have not been 
 implemented, or if this delegate method returns nil.
 @discussion Returning a view controller will result in that view controller being displayed as a peek preview.
 To use the defaultActions, your app is responsible for returning whichever of those actions it wants in your 
 view controller's implementation of -previewActionItems.
 
 Returning nil will result in WebKit's default preview behavior. webView:commitPreviewingViewController: will only be invoked
 if a non-nil view controller was returned.
 */
- (nullable UIViewController *)webView:(WKWebView *)webView previewingViewControllerForElement:(WKPreviewElementInfo *)elementInfo defaultActions:(NSArray<id <WKPreviewActionItem>> *)previewActions WK_API_DEPRECATED_WITH_REPLACEMENT("webView:contextMenuConfigurationForElement:completionHandler:", ios(10.0, 13.0));

/*! @abstract Allows your app to pop to the view controller it created.
 @param webView The web view invoking the delegate method.
 @param previewingViewController The view controller that is being popped.
 */
- (void)webView:(WKWebView *)webView commitPreviewingViewController:(UIViewController *)previewingViewController WK_API_DEPRECATED_WITH_REPLACEMENT("webView:contextMenuForElement:willCommitWithAnimator:", ios(10.0, 13.0));
#endif // TARGET_OS_IPHONE

#if TARGET_OS_IOS || (defined(TARGET_OS_VISION) && TARGET_OS_VISION)

/**
 * @abstract Called when a context menu interaction begins.
 *
 * @param webView The web view invoking the delegate method.
 * @param elementInfo The elementInfo for the element the user is touching.
 * @param completionHandler A completion handler to call once a it has been decided whether or not to show a context menu.
 * Pass a valid UIContextMenuConfiguration to show a context menu, or pass nil to not show a context menu.
 */

- (void)webView:(WKWebView *)webView contextMenuConfigurationForElement:(WKContextMenuElementInfo *)elementInfo completionHandler:(WK_SWIFT_UI_ACTOR void (^)(UIContextMenuConfiguration * _Nullable configuration))completionHandler WK_SWIFT_ASYNC_NAME(webView(_:contextMenuConfigurationFor:)) WK_API_AVAILABLE(ios(13.0));

/**
 * @abstract Called when the context menu will be presented.
 *
 * @param webView The web view invoking the delegate method.
 * @param elementInfo The elementInfo for the element the user is touching.
 */

- (void)webView:(WKWebView *)webView contextMenuWillPresentForElement:(WKContextMenuElementInfo *)elementInfo WK_API_AVAILABLE(ios(13.0));

/**
 * @abstract Called when the context menu configured by the UIContextMenuConfiguration from
 * webView:contextMenuConfigurationForElement:completionHandler: is committed. That is, when
 * the user has selected the view provided in the UIContextMenuContentPreviewProvider.
 *
 * @param webView The web view invoking the delegate method.
 * @param elementInfo The elementInfo for the element the user is touching.
 * @param animator The animator to use for the commit animation.
 */

- (void)webView:(WKWebView *)webView contextMenuForElement:(WKContextMenuElementInfo *)elementInfo willCommitWithAnimator:(id <UIContextMenuInteractionCommitAnimating>)animator WK_API_AVAILABLE(ios(13.0));

/**
 * @abstract Called when the context menu ends, either by being dismissed or when a menu action is taken.
 *
 * @param webView The web view invoking the delegate method.
 * @param elementInfo The elementInfo for the element the user is touching.
 */

- (void)webView:(WKWebView *)webView contextMenuDidEndForElement:(WKContextMenuElementInfo *)elementInfo WK_API_AVAILABLE(ios(13.0));

/*! @abstract Displays a Lockdown Mode warning panel.
 @param webView The web view invoking the delegate method.
 @param message The message WebKit would display if this delegate were not invoked.
 @param completionHandler The completion handler you must invoke to resume after the first use message is displayed.
 @discussion The panel should have a single OK button.

 If you do not implement this method, the web view will display the default Lockdown Mode message.
 */
- (void)webView:(WKWebView *)webView showLockdownModeFirstUseMessage:(NSString *)message completionHandler:(WK_SWIFT_UI_ACTOR void (^)(WKDialogResult))completionHandler WK_API_AVAILABLE(ios(13.0));

#endif // TARGET_OS_IOS || (defined(TARGET_OS_VISION) && TARGET_OS_VISION)

#if TARGET_OS_IOS || (defined(TARGET_OS_VISION) && TARGET_OS_VISION) || (defined(TARGET_OS_TV) && TARGET_OS_TV)

/**
 * @abstract Called when the web view is about to present its edit menu.
 *
 * @param webView The web view displaying the menu.
 * @param animator Appearance animator. Add animations to this object to run them alongside the appearance transition.
 */
- (void)webView:(WKWebView *)webView willPresentEditMenuWithAnimator:(id<UIEditMenuInteractionAnimating>)animator WK_API_AVAILABLE(ios(16.4));

/**
 * @abstract Called when the web view is about to dismiss its edit menu.
 *
 * @param webView The web view displaying the menu.
 * @param animator Dismissal animator. Add animations to this object to run them alongside the dismissal transition.
 */
- (void)webView:(WKWebView *)webView willDismissEditMenuWithAnimator:(id<UIEditMenuInteractionAnimating>)animator WK_API_AVAILABLE(ios(16.4));

#endif // TARGET_OS_IOS || (defined(TARGET_OS_VISION) && TARGET_OS_VISION) || (defined(TARGET_OS_TV) && TARGET_OS_TV)

/*! @abstract Displays a file upload panel.
 @param webView The web view invoking the delegate method.
 @param parameters Parameters describing the file upload control.
 @param frame Information about the frame whose file upload control initiated this call.
 @param completionHandler The completion handler to call after open panel has been dismissed. Pass the selected URLs if the user chose OK, otherwise nil.

 If you do not implement this method on macOS, the web view will behave as if the user selected the Cancel button.
 If you do not implement this method on iOS, the web view will match the file upload behavior of Safari. If you desire
 the web view to act as if the user selected the Cancel button on iOS, immediately call the completion handler with nil.
 */
- (void)webView:(WKWebView *)webView runOpenPanelWithParameters:(WKOpenPanelParameters *)parameters initiatedByFrame:(WKFrameInfo *)frame completionHandler:(WK_SWIFT_UI_ACTOR void (^)(NSArray<NSURL *> * _Nullable URLs))completionHandler WK_API_AVAILABLE(macos(10.12), ios(WK_IOS_TBA));

@end

NS_ASSUME_NONNULL_END
