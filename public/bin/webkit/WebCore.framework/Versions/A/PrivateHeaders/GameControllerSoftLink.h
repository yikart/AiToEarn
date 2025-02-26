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

#pragma once

#if ENABLE(GAMEPAD) && PLATFORM(COCOA)

#import "GameControllerSPI.h"
#import <wtf/SoftLinking.h>

SOFT_LINK_FRAMEWORK_FOR_HEADER(WebCore, GameController)
SOFT_LINK_CLASS_FOR_HEADER(WebCore, GCController)
SOFT_LINK_CLASS_FOR_HEADER(WebCore, GCControllerButtonInput)

SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputButtonA, NSString *)
#define GCInputButtonA WebCore::get_GameController_GCInputButtonA()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputButtonB, NSString *)
#define GCInputButtonB WebCore::get_GameController_GCInputButtonB()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputButtonX, NSString *)
#define GCInputButtonX WebCore::get_GameController_GCInputButtonX()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputButtonY, NSString *)
#define GCInputButtonY WebCore::get_GameController_GCInputButtonY()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputButtonHome, NSString *)
#define GCInputButtonHome WebCore::get_GameController_GCInputButtonHome()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputButtonMenu, NSString *)
#define GCInputButtonMenu WebCore::get_GameController_GCInputButtonMenu()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputButtonOptions, NSString *)
#define GCInputButtonOptions WebCore::get_GameController_GCInputButtonOptions()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputDirectionPad, NSString *)
#define GCInputDirectionPad WebCore::get_GameController_GCInputDirectionPad()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputLeftShoulder, NSString *)
#define GCInputLeftShoulder WebCore::get_GameController_GCInputLeftShoulder()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputLeftTrigger, NSString *)
#define GCInputLeftTrigger WebCore::get_GameController_GCInputLeftTrigger()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputLeftThumbstick, NSString *)
#define GCInputLeftThumbstick WebCore::get_GameController_GCInputLeftThumbstick()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputLeftThumbstickButton, NSString *)
#define GCInputLeftThumbstickButton WebCore::get_GameController_GCInputLeftThumbstickButton()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputRightShoulder, NSString *)
#define GCInputRightShoulder WebCore::get_GameController_GCInputRightShoulder()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputRightTrigger, NSString *)
#define GCInputRightTrigger WebCore::get_GameController_GCInputRightTrigger()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputRightThumbstick, NSString *)
#define GCInputRightThumbstick WebCore::get_GameController_GCInputRightThumbstick()
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCInputRightThumbstickButton, NSString *)
#define GCInputRightThumbstickButton WebCore::get_GameController_GCInputRightThumbstickButton()

SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCControllerDidConnectNotification, NSString *)
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCControllerDidDisconnectNotification, NSString *)

SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCHapticsLocalityLeftHandle, NSString *)
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCHapticsLocalityRightHandle, NSString *)
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCHapticsLocalityLeftTrigger, NSString *)
SOFT_LINK_CONSTANT_MAY_FAIL_FOR_HEADER(WebCore, GameController, GCHapticsLocalityRightTrigger, NSString *)

#if HAVE(MULTIGAMEPADPROVIDER_SUPPORT)
SOFT_LINK_FUNCTION_FOR_HEADER(WebCore, GameController, ControllerClassForService, Class, (IOHIDServiceClientRef service), (service))
#endif

#if PLATFORM(VISION) && __has_include(<GameController/GCEventInteraction.h>)
#import <GameController/GCEventInteraction.h>

SOFT_LINK_CLASS_FOR_HEADER(WebCore, GCEventInteraction)
#endif

#if USE(APPLE_INTERNAL_SDK) && __has_include(<WebKitAdditions/GameControllerSoftLinkAdditions.h>)
#import <WebKitAdditions/GameControllerSoftLinkAdditions.h>
#endif

#endif // ENABLE(GAMEPAD) && PLATFORM(COCOA)
