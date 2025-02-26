/*
 * Copyright (C) 2017-2020 Apple Inc. All rights reserved.
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

#import <WebKit/WKURLSchemeTask.h>

@class WKFrameInfo;

WK_API_AVAILABLE(macos(10.13), ios(11.0))
@protocol WKURLSchemeTaskPrivate <WKURLSchemeTask>

/*! @abstract Indicate the task was redirected.
 @param response The response causing a redirect to a new URL.
 @param newRequest The new proposed request to handle the redirection.
 @param completionHandler A completion handler called with the request you should use to commit to the redirection.
 @discussion When performing a load of a URL over a network, the server might decide a different URL should be loaded instead.
 A common example is an HTTP redirect.
 When this happens, you should notify WebKit by sending the servers response and a proposed new request to the WKURLSchemeTask.
 WebKit might decide that changes need to be make to the proposed request.
 This is communicated through the completionHandler which tells you the request you should make to commit to the redirection.

 An exception will be thrown if you make any other callbacks to the WKURLSchemeTask while this completionHandler is pending, other than didFailWithError:.
 An exception will be thrown if your app has been told to stop loading this task via the registered WKURLSchemeHandler object.
 */
- (void)_willPerformRedirection:(NSURLResponse *)response newRequest:(NSURLRequest *)request completionHandler:(void (^)(NSURLRequest *))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_didPerformRedirection:(NSURLResponse *)response newRequest:(NSURLRequest *)request;

@property (nonatomic, readonly) BOOL _requestOnlyIfCached WK_API_AVAILABLE(macos(10.15), ios(13.0));
@property (nonatomic, readonly) WKFrameInfo *_frame WK_API_AVAILABLE(macos(11.0), ios(14.0));

@end
