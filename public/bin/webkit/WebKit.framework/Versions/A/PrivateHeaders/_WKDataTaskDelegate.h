/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

@class _WKDataTask;

typedef NS_ENUM(NSInteger, _WKDataTaskRedirectPolicy) {
    _WKDataTaskRedirectPolicyCancel,
    _WKDataTaskRedirectPolicyAllow,
} WK_API_AVAILABLE(macos(13.0), ios(16.0));

typedef NS_ENUM(NSInteger, _WKDataTaskResponsePolicy) {
    _WKDataTaskResponsePolicyCancel,
    _WKDataTaskResponsePolicyAllow,
} WK_API_AVAILABLE(macos(13.0), ios(16.0));

NS_ASSUME_NONNULL_BEGIN

@protocol _WKDataTaskDelegate <NSObject>

@optional

- (void)dataTask:(_WKDataTask *)dataTask didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential * _Nullable))completionHandler;
- (void)dataTask:(_WKDataTask *)dataTask willPerformHTTPRedirection:(NSHTTPURLResponse *)response newRequest:(NSURLRequest *)request decisionHandler:(void (^)(_WKDataTaskRedirectPolicy))decisionHandler;
- (void)dataTask:(_WKDataTask *)dataTask didReceiveResponse:(NSURLResponse *)response decisionHandler:(void (^)(_WKDataTaskResponsePolicy))decisionHandler;
- (void)dataTask:(_WKDataTask *)dataTask didReceiveData:(NSData *)data;
- (void)dataTask:(_WKDataTask *)dataTask didCompleteWithError:(nullable NSError *)error;

@end

NS_ASSUME_NONNULL_END
