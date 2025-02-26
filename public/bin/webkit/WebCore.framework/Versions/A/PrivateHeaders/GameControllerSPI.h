/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#if ENABLE(GAMEPAD) && PLATFORM(COCOA)

#import <GameController/GCController.h>

typedef void (^GCPhysicalInputProfileThumbstickUserIntentHandler)(__kindof GCPhysicalInputProfile *profile, GCControllerElement *element);
@interface GCPhysicalInputProfile ()
-(void) setThumbstickUserIntentHandler:(GCPhysicalInputProfileThumbstickUserIntentHandler)handler;
@end

#if !HAVE(GCCONTROLLER_HID_DEVICE_CHECK)
@class _GCCControllerHIDServiceInfo;
#endif

@interface GCController ()
+ (void)__openXPC_and_CBApplicationDidBecomeActive__;
#if !HAVE(GCCONTROLLER_HID_DEVICE_CHECK)
@property (nonatomic, retain, readonly) NSArray<_GCCControllerHIDServiceInfo *> *hidServices;
#endif
@end

#if HAVE(MULTIGAMEPADPROVIDER_SUPPORT)
#if USE(APPLE_INTERNAL_SDK)

WTF_EXTERN_C_BEGIN
#import <GameController/GCUtility.h>
WTF_EXTERN_C_END

#else

WTF_EXTERN_C_BEGIN
typedef struct CF_BRIDGED_TYPE(id) __IOHIDServiceClient * IOHIDServiceClientRef;
Class ControllerClassForService(IOHIDServiceClientRef);
WTF_EXTERN_C_END

#endif // USE(APPLE_INTERNAL_SDK)

#if !HAVE(GCCONTROLLER_HID_DEVICE_CHECK)
@interface _GCCControllerHIDServiceInfo : NSObject
@property (nonatomic, readonly) IOHIDServiceClientRef service;
@end
#endif

#endif // HAVE(MULTIGAMEPADPROVIDER_SUPPORT)
#endif // ENABLE(GAMEPAD) && PLATFORM(COCOA)
