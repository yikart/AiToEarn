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

#import <WebKit/WKWebExtensionContext.h>

@class _WKWebExtensionSidebar;

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

@interface WKWebExtensionContext ()

/*! @abstract The extension background view used for the extension, or `nil` if the extension does not have background content or it is currently unloaded. */
@property (nonatomic, nullable, readonly) WKWebView *_backgroundWebView;

/*! @abstract The extension background content URL for the extension, or `nil` if the extension does not have background content. */
@property (nonatomic, nullable, readonly) NSURL *_backgroundContentURL;

/*!
 @abstract Sends a message to the JavaScript `browser.test.onMessage` API.
 @discussion Allows code to trigger a `browser.test.onMessage` event, enabling bidirectional communication during testing.
 @param message The message string to send.
 @param argument The optional JSON-serializable argument to include with the message. Must be JSON-serializable according to \c NSJSONSerialization.
 */
- (void)_sendTestMessage:(NSString *)message withArgument:(nullable id)argument;

/*!
 @abstract Retrieves the extension sidebar for a given tab, or the default sidebar if `nil` is passed.
 @param tab The tab for which to retrieve the extension sidebar, or `nil` to get the default sidebar.
 @discussion The returned object represents the sidebar specific to the tab when provided; otherwise, it returns the default sidebar.
 The default sidebar should not be directly displayed. When possible, specify the tab to get the most context-relevant sidebar.
 */
- (nullable _WKWebExtensionSidebar *)sidebarForTab:(nullable id <WKWebExtensionTab>)tab NS_SWIFT_NAME(sidebar(for:));

@end

WK_HEADER_AUDIT_END(nullability, sendability)
