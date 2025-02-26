/*
 * Copyright (C) 2020-2021 Apple Inc. All rights reserved.
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

NS_ASSUME_NONNULL_BEGIN

@class WKWebView;
@class _WKInspectorExtension;

@protocol _WKInspectorExtensionHost <NSObject>
@optional

/**
 * @abstract Registers a Web Extension with the associated Web Inspector.
 * @param extensionID A unique identifier for the extension.
 * @param extensionBundleIdentifier A bundle identifier for the extension.
 * @param displayName A localized display name for the extension.
 * @param completionHandler The completion handler to be called when registration succeeds or fails.
 *
 * Web Extensions in Web Inspector are active as soon as they are registered.
 */
- (void)registerExtensionWithID:(NSString *)extensionID extensionBundleIdentifier:(NSString *)extensionBundleIdentifier displayName:(NSString *)displayName completionHandler:(void(^)(NSError * _Nullable, _WKInspectorExtension * _Nullable))completionHandler;

/**
 * @abstract Unregisters a Web Extension with the associated Web Inspector.
 * @param extensionID A unique identifier for the extension.
 * @param completionHandler The completion handler to be called when unregistering succeeds or fails.
 *
 * Unregistering an extension will automatically close any associated sidebars/tabs.
 */
- (void)unregisterExtension:(_WKInspectorExtension *)extension completionHandler:(void(^)(NSError * _Nullable))completionHandler;

/**
 * @abstract Opens the specified extension tab in the associated Web Inspector.
 * @param extensionTabIdentifier An identifier for an extension tab created using WKInspectorExtension methods.
 * @param completionHandler The completion handler to be called when the request to show the tab succeeds or fails.
 * @discussion This method has no effect if the extensionTabIdentifier is invalid.
 * It is an error to call this method prior to calling -[_WKInspectorIBActions show].
 */
- (void)showExtensionTabWithIdentifier:(NSString *)extensionTabIdentifier completionHandler:(void(^)(NSError * _Nullable))completionHandler;

/**
 * @abstract Loads the extension tab with a specified URL.
 * @param extensionTabIdentifier An identifier for an extension tab created using WKInspectorExtension methods.
 * @param url The URL that the should be loaded in the extension tab.
 * @param completionHandler The completion handler to be called when the load succeeds or fails.
 * @discussion This method has no effect if the extensionTabIdentifier is invalid.
 * It is an error to call this method prior to calling -[_WKInspectorIBActions show].
 */
- (void)navigateExtensionTabWithIdentifier:(NSString *)extensionTabIdentifier toURL:(NSURL *)url completionHandler:(void(^)(NSError * _Nullable))completionHandler;

/**
 * @abstract The web view that is used to host extension tabs created via _WKInspectorExtension.
 * @discussion Browsing contexts for extension tabs are loaded in subframes of this web view.
 */
@property (nonatomic, nullable, readonly) WKWebView *extensionHostWebView;
@end

NS_ASSUME_NONNULL_END
