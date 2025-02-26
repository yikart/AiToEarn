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

#import <WebKit/WKWebExtensionControllerDelegate.h>

@class _WKWebExtensionSidebar;

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
@protocol WKWebExtensionControllerDelegatePrivate <WKWebExtensionControllerDelegate>
@optional

/*!
 @abstract Delegate for the `browser.test.assertTrue()`, `browser.test.assertFalse()`, `browser.test.assertThrows()`, and `browser.test.assertRejects()`  JavaScript testing APIs.
 @discussion Default implementation logs a message to the system console when `result` is `NO`.
 */
- (void)_webExtensionController:(WKWebExtensionController *)controller recordTestAssertionResult:(BOOL)result withMessage:(NSString *)message andSourceURL:(NSString *)sourceURL lineNumber:(unsigned)lineNumber;

/*!
 @abstract Delegate for the `browser.test.assertEq()` and `browser.test.assertDeepEq()` JavaScript testing APIs.
 @discussion Default implementation logs a message to the system console when `result` is `NO`.
 */
- (void)_webExtensionController:(WKWebExtensionController *)controller recordTestEqualityResult:(BOOL)result expectedValue:(NSString *)expectedValue actualValue:(NSString *)actualValue withMessage:(NSString *)message andSourceURL:(NSString *)sourceURL lineNumber:(unsigned)lineNumber;

/*!
 @abstract Delegate for the `browser.test.log()` JavaScript testing API.
 @discussion Default implementation always logs the message to the system console.
 */
- (void)_webExtensionController:(WKWebExtensionController *)controller recordTestMessage:(NSString *)message andSourceURL:(NSString *)sourceURL lineNumber:(unsigned)lineNumber;

/*!
 @abstract Delegate for the `browser.test.yield()` JavaScript testing API.
 @discussion Default implementation always logs the message to the system console. Test harnesses should use this to exit the run loop to preform other work before resuming extension execution.
 */
- (void)_webExtensionController:(WKWebExtensionController *)controller recordTestYieldedWithMessage:(NSString *)message andSourceURL:(NSString *)sourceURL lineNumber:(unsigned)lineNumber;

/*!
 @abstract Delegate for the `browser.test.sendMessage()` JavaScript testing API.
 @discussion Default implementation always logs the message and argument to the system console. Test harnesses should use this to process the received message and perform actions based on its contents.
 */
- (void)_webExtensionController:(WKWebExtensionController *)controller receivedTestMessage:(NSString *)message withArgument:(id)argument andSourceURL:(NSString *)sourceURL lineNumber:(unsigned)lineNumber;

/*!
 @abstract Delegate for the `browser.test.notifyPass()` and `browser.test.notifyFail()` JavaScript testing APIs.
 @discussion Default implementation logs a message to the system console when `result` is `NO`. Test harnesses should use this to exit the run loop and record a test pass or failure.
 */
- (void)_webExtensionController:(WKWebExtensionController *)controller recordTestFinishedWithResult:(BOOL)result message:(NSString *)message andSourceURL:(NSString *)sourceURL lineNumber:(unsigned)lineNumber;

/*!
 @abstract Delegate notification about the creation of the background web view in the web extension context.
 @discussion The app can use this to setup additional properties on the web view before it is loaded. Default implementation does nothing.
 */
- (void)_webExtensionController:(WKWebExtensionController *)controller didCreateBackgroundWebView:(WKWebView *)webView forExtensionContext:(WKWebExtensionContext *)context;

/*!
 @abstract Called when a sidebar is requested to be opened.
 @param controller The web extension controller initiating the request.
 @param sidebar The sidebar which should be displayed.
 @param context The context within which the web extension is running.
 @param completionHandler A block to be called once the sidebar has been opened.
 @discussion This method is called in response to the extension's scripts programmatically requesting the sidebar to open. Implementing this method
 is needed if the app intends to support programmatically showing the sidebar from the extension.
 */
- (void)_webExtensionController:(WKWebExtensionController * _Nonnull)controller presentSidebar:(_WKWebExtensionSidebar * _Nonnull)sidebar forExtensionContext:(WKWebExtensionContext * _Nonnull)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler;

/*!
 @abstract Called when a sidebar is requested to be closed.
 @param controller The web extension controller initiating the request.
 @param sidebar The sidebar which should be closed.
 @param context The context within which the web extension is running.
 @param completionHandler A block to be called once the sidebar has been closed.
 @discussion This method is called in response to the extension's scripts programmatically requesting the sidebar to close. Implementing this method is needed if the app intends to support programmatically closing the sidebar from the extension.
 */
- (void)_webExtensionController:(WKWebExtensionController * _Nonnull)controller closeSidebar:(_WKWebExtensionSidebar * _Nonnull)sidebar forExtensionContext:(WKWebExtensionContext * _Nonnull)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler;

/*!
 @abstract Called when a sidebar's properties must be re-queried by the browser.
 @param controller The web extension controller initiating the request.
 @param sidebar The sidebar whose properties must be re-queried.
 @param context The context within which the web extension is running.
 */
- (void)_webExtensionController:(WKWebExtensionController * _Nonnull)controller didUpdateSidebar:(_WKWebExtensionSidebar * _Nonnull)sidebar forExtensionContext:(WKWebExtensionContext * _Nonnull)context;

@end

WK_HEADER_AUDIT_END(nullability, sendability)
