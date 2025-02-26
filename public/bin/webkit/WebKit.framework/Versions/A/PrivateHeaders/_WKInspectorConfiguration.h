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

@class WKProcessPool;
@protocol WKURLSchemeHandler;

WK_CLASS_AVAILABLE(macos(12.0))
@interface _WKInspectorConfiguration : NSObject <NSCopying>
/**
 * @abstract Sets the URL scheme handler object for the given URL scheme.
 * @param urlSchemeHandler The object to register.
 * @param scheme The URL scheme the object will handle.
 * @discussion This is used to register additional schemes for loading resources in the inspector page,
 * such as to register schemes used by extensions. This method has the same behavior and restrictions as
 * described in the documentation of -[WKWebView setURLSchemeHandler:forURLScheme:].
 */
- (void)setURLSchemeHandler:(id <WKURLSchemeHandler>)urlSchemeHandler forURLScheme:(NSString *)urlScheme;

/*! @abstract The process pool from which to obtain web content processes on behalf of Web Inspector.
 @discussion When a Web Inspector instance opens, a new web content process
 will be created for it from the specified pool, or an existing process in that pool will be used.
 This process pool is also used to obtain web content processes for tabs created via _WKInspectorExtension.
 If unspecified, all Web Inspector instances will use a private process pool that is separate from web content.
*/
@property (nonatomic, strong, nullable) WKProcessPool *processPool;

/*! @abstract An identifier that is set for all pages associated with this inspector configuration.
 @discussion This can be used to uniquely identify Web Inspector-related pages from within the injected bundle.
 If unspecified, all Web Inspector instances will use a private group identifier that is separate from web content.
*/
@property (nonatomic, copy, nullable) NSString *groupIdentifier;
@end

NS_ASSUME_NONNULL_END
