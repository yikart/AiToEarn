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

#import <WebKit/WKFoundation.h>

/*! A _WKInspectorDebuggableInfo object contains information about a debuggable target.
 @discussion An instance of this class is a transient, data-only object;
 it does not uniquely identify a debuggable across multiple method calls.
 */

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, _WKInspectorDebuggableType) {
    _WKInspectorDebuggableTypeITML,
    _WKInspectorDebuggableTypeJavaScript,
    _WKInspectorDebuggableTypeServiceWorker,
    _WKInspectorDebuggableTypePage,
    _WKInspectorDebuggableTypeWebPage,
} WK_API_AVAILABLE(macos(10.15.4), ios(13.4));

WK_CLASS_AVAILABLE(macos(10.15.4), ios(13.4))
@interface _WKInspectorDebuggableInfo : NSObject <NSCopying>
@property (nonatomic) _WKInspectorDebuggableType debuggableType;
@property (nonatomic, copy) NSString *targetPlatformName;
@property (nonatomic, copy) NSString *targetBuildVersion;
@property (nonatomic, copy) NSString *targetProductVersion;
@property (nonatomic) BOOL targetIsSimulator;
@end

NS_ASSUME_NONNULL_END
