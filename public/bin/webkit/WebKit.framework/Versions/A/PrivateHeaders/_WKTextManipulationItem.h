/*
 * Copyright (C) 2019-2020 Apple Inc. All rights reserved.
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

@class _WKTextManipulationToken;

NS_ASSUME_NONNULL_BEGIN

WK_CLASS_AVAILABLE(macos(10.15.4), ios(13.4))
@interface _WKTextManipulationItem : NSObject

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithIdentifier:(nullable NSString *)identifier tokens:(NSArray<_WKTextManipulationToken *> *)tokens;
- (instancetype)initWithIdentifier:(nullable NSString *)identifier tokens:(NSArray<_WKTextManipulationToken *> *)tokens isSubframe:(BOOL)isSubframe isCrossSiteSubframe:(BOOL)isCrossSiteSubframe WK_API_AVAILABLE(macos(14.0), ios(17.0));

@property (nonatomic, readonly, nullable, copy) NSString *identifier;
@property (nonatomic, readonly, copy) NSArray<_WKTextManipulationToken *> *tokens;
@property (nonatomic, readonly) BOOL isSubframe WK_API_AVAILABLE(macos(14.0), ios(17.0));
@property (nonatomic, readonly) BOOL isCrossSiteSubframe WK_API_AVAILABLE(macos(14.0), ios(17.0));

- (BOOL)isEqualToTextManipulationItem:(nullable _WKTextManipulationItem *)otherItem includingContentEquality:(BOOL)includingContentEquality;
@property (nonatomic, readonly, copy) NSString *debugDescription;

@end

WK_EXTERN NSString * const _WKTextManipulationItemErrorDomain WK_API_AVAILABLE(macos(11.0), ios(14.0));

typedef NS_ENUM(NSInteger, _WKTextManipulationItemErrorCode) {
    _WKTextManipulationItemErrorNotAvailable,
    _WKTextManipulationItemErrorContentChanged,
    _WKTextManipulationItemErrorInvalidItem,
    _WKTextManipulationItemErrorInvalidToken,
    _WKTextManipulationItemErrorExclusionViolation,
} WK_API_AVAILABLE(macos(11.0), ios(14.0));

WK_EXTERN NSErrorUserInfoKey const _WKTextManipulationItemErrorItemKey WK_API_AVAILABLE(macos(11.0), ios(14.0));

NS_ASSUME_NONNULL_END
