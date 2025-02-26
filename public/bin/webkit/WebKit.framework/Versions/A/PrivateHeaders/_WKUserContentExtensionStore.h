/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

@class _WKUserContentFilter;

// FIXME: Remove this once rdar://100785999 is unblocked.
WK_CLASS_DEPRECATED_WITH_REPLACEMENT("WKContentRuleListStore", macos(10.11, 13.3), ios(9.0, 16.4))
@interface _WKUserContentExtensionStore : NSObject

+ (instancetype)defaultStore;
+ (instancetype)storeWithURL:(NSURL *)url;

- (void)compileContentExtensionForIdentifier:(NSString *)identifier encodedContentExtension:(NSString *) NS_RELEASES_ARGUMENT encodedContentExtension completionHandler:(void (^)(_WKUserContentFilter *, NSError *))completionHandler;
- (void)lookupContentExtensionForIdentifier:(NSString *)identifier completionHandler:(void (^)(_WKUserContentFilter *, NSError *))completionHandler;
- (void)removeContentExtensionForIdentifier:(NSString *)identifier completionHandler:(void (^)(NSError *))completionHandler;

@end

WK_EXTERN NSString * const _WKUserContentExtensionsDomain WK_API_AVAILABLE(macos(10.12), ios(10.0));

typedef NS_ENUM(NSInteger, _WKUserContentExtensionStoreErrorCode) {
    _WKUserContentExtensionStoreErrorLookupFailed,
    _WKUserContentExtensionStoreErrorVersionMismatch,
    _WKUserContentExtensionStoreErrorCompileFailed,
    _WKUserContentExtensionStoreErrorRemoveFailed,
} WK_API_AVAILABLE(macos(10.12), ios(10.0));
