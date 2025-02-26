/*
 * Copyright (C) 2015, 2019 Apple Inc. All rights reserved.
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

#if TARGET_OS_IPHONE

#import <CoreGraphics/CGGeometry.h>
#import <WebKit/WKFoundation.h>

NS_ASSUME_NONNULL_BEGIN

@class UIWindow;
typedef struct __IOHIDEvent * IOHIDEventRef;

WK_CLASS_AVAILABLE(ios(13.0))
@interface _WKTouchEventGenerator : NSObject
+ (_WKTouchEventGenerator *)sharedTouchEventGenerator;

// The 'location' parameter is in screen coordinates, as used by IOHIDEvent.
- (void)touchDown:(CGPoint)location window:(UIWindow *)window completionBlock:(void (^)(void))completionBlock;
- (void)liftUp:(CGPoint)location window:(UIWindow *)window completionBlock:(void (^)(void))completionBlock;
- (void)moveToPoint:(CGPoint)location duration:(NSTimeInterval)seconds window:(UIWindow *)window completionBlock:(void (^)(void))completionBlock;

// Clients must call this method whenever a HID event is delivered to the UIApplication.
// It is used to detect when all synthesized touch events have been successfully delivered.
- (void)receivedHIDEvent:(IOHIDEventRef)event;
@end

NS_ASSUME_NONNULL_END

#endif // TARGET_OS_IPHONE
