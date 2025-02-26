/*
 * Copyright (C) 2013-2020 Apple Inc. All rights reserved.
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

WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface _WKRemoteObjectInterface : NSObject

+ (instancetype)remoteObjectInterfaceWithProtocol:(Protocol *)protocol;

- (id)initWithProtocol:(Protocol *)protocol identifier:(NSString *)identifier;

@property (readonly, nonatomic) Protocol *protocol;
@property (readonly, nonatomic) NSString *identifier;

- (NSSet *)classesForSelector:(SEL)selector argumentIndex:(NSUInteger)argumentIndex ofReply:(BOOL)ofReply;
- (void)setClasses:(NSSet *)classes forSelector:(SEL)selector argumentIndex:(NSUInteger)argumentIndex ofReply:(BOOL)ofReply;

- (NSSet *)classesForSelector:(SEL)selector argumentIndex:(NSUInteger)argumentIndex WK_API_DEPRECATED_WITH_REPLACEMENT("-classesForSelector:argumentIndex:ofReply:", macos(10.10, 12.0), ios(8.0, 15.0));
- (void)setClasses:(NSSet *)classes forSelector:(SEL)selector argumentIndex:(NSUInteger)argumentIndex WK_API_DEPRECATED_WITH_REPLACEMENT("-setClasses:forSelector:argumentIndex:ofReply:", macos(10.10, 12.0), ios(8.0, 15.0));

@end
