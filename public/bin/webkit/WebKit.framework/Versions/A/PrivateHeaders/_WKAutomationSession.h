/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#import <Foundation/Foundation.h>

@class _WKAutomationSessionConfiguration;
@protocol _WKAutomationSessionDelegate;

NS_ASSUME_NONNULL_BEGIN

WK_CLASS_AVAILABLE(macos(10.12), ios(10.0))
@interface _WKAutomationSession : NSObject

@property (nonatomic, copy) NSString *sessionIdentifier;
@property (nonatomic, readonly, copy) _WKAutomationSessionConfiguration *configuration;

@property (nonatomic, weak) id <_WKAutomationSessionDelegate> delegate;
@property (nonatomic, readonly, getter=isPaired) BOOL paired;
@property (nonatomic, readonly, getter=isPendingTermination) BOOL pendingTermination WK_API_AVAILABLE(macos(13.0), ios(16.0));

@property (nonatomic, readonly, getter=isSimulatingUserInteraction) BOOL simulatingUserInteraction WK_API_AVAILABLE(macos(10.13.4), ios(11.3));

- (instancetype)initWithConfiguration:(_WKAutomationSessionConfiguration *)configuration NS_DESIGNATED_INITIALIZER;

- (void)terminate WK_API_AVAILABLE(macos(10.14), ios(12.0));

#if !TARGET_OS_IPHONE
- (BOOL)wasEventSynthesizedForAutomation:(NSEvent *)event;
- (void)markEventAsSynthesizedForAutomation:(NSEvent *)event;
#endif

@end

NS_ASSUME_NONNULL_END
