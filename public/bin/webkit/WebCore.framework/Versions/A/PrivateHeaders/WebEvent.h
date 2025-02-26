/*
 * Copyright (C) 2009 Apple Inc. All rights reserved.
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

// FIXME: Rename this file to WebEventIOS.mm after we upstream the iOS port and remove the PLATFORM(IOS_FAMILY)-guard.
#ifndef WebEventIOS_h
#define WebEventIOS_h

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#if TARGET_OS_IPHONE

typedef enum {
    WebEventMouseDown,
    WebEventMouseUp,
    WebEventMouseMoved,
    
    WebEventScrollWheel,
    
    WebEventKeyDown,
    WebEventKeyUp,
    
    WebEventTouchBegin,
    WebEventTouchChange,
    WebEventTouchEnd,
    WebEventTouchCancel
} WebEventType;

typedef enum {
    WebEventTouchPhaseBegan,
    WebEventTouchPhaseMoved,
    WebEventTouchPhaseStationary,
    WebEventTouchPhaseEnded,
    WebEventTouchPhaseCancelled
} WebEventTouchPhaseType;

// These enum values correspond to the GraphicsServices kGSEvent* enumerators for compatibility.
enum {
    WebEventLeftCommandKey,
    WebEventLeftShiftKey,
    WebEventLeftCapsLockKey,
    WebEventLeftOptionKey,
    WebEventLeftControlKey,
    WebEventRightShiftKey,
    WebEventRightOptionKey,
    WebEventRightControlKey,
    WebEventRightCommandKey,
    WebEventDeadKey,
};

// These enum values correspond to the GraphicsServices kGSEventFlagMask* enumerators for compatibility.
typedef enum {
    WebEventFlagMaskLeftCommandKey = 1 << (WebEventLeftCommandKey + 16),
    WebEventFlagMaskLeftShiftKey = 1 << (WebEventLeftShiftKey + 16),
    WebEventFlagMaskLeftCapsLockKey = 1 << (WebEventLeftCapsLockKey + 16),
    WebEventFlagMaskLeftOptionKey = 1 << (WebEventLeftOptionKey + 16),
    WebEventFlagMaskLeftControlKey = 1 << (WebEventLeftControlKey + 16),
    WebEventFlagMaskRightControlKey = 1 << (WebEventRightControlKey + 16),
    WebEventFlagMaskRightShiftKey = 1 << (WebEventRightShiftKey + 16),
    WebEventFlagMaskRightOptionKey = 1 << (WebEventRightOptionKey + 16),
    WebEventFlagMaskRightCommandKey = 1 << (WebEventRightCommandKey + 16),
} WebEventFlagValues;
typedef unsigned WebEventFlags;

// These enum values correspond to the GraphicsServices kGSEventFlagMask* enumerators for compatibility.
enum {
    WebEventFlagMaskCommandKey = WebEventFlagMaskLeftCommandKey | WebEventFlagMaskRightCommandKey,
    WebEventFlagMaskOptionKey = WebEventFlagMaskLeftOptionKey | WebEventFlagMaskRightOptionKey,
    WebEventFlagMaskControlKey = WebEventFlagMaskLeftControlKey | WebEventFlagMaskRightControlKey,
    WebEventFlagMaskShiftKey = WebEventFlagMaskLeftShiftKey | WebEventFlagMaskRightShiftKey,
};

// These enum values correspond to the GraphicsServices kGSCharacterSet* constants for compatibility.
typedef enum {
    WebEventCharacterSetASCII           = 0,
    WebEventCharacterSetSymbol          = 1,
    WebEventCharacterSetDingbats        = 2,
    WebEventCharacterSetUnicode         = 253,
    WebEventCharacterSetFunctionKeys    = 254,
} WebEventCharacterSet;

// These enum values are copied directly from UIKit for compatibility.
typedef enum {
    WebEventKeyboardInputRepeat = 1 << 0,
    WebEventKeyboardInputModifierFlagsChanged = 1 << 5,
} WebKeyboardInputFlagValues;
typedef NSUInteger WebKeyboardInputFlags;

WEBCORE_EXPORT @interface WebEvent : NSObject {
@private
    WebEventType _type;
    CFTimeInterval _timestamp;
    
    CGPoint _locationInWindow;
    
    NSString *_characters;
    NSString *_charactersIgnoringModifiers;
    WebEventFlags _modifierFlags;
    BOOL _keyRepeating;
    WebKeyboardInputFlags _keyboardFlags;
    NSString *_inputManagerHint;
    uint16_t _keyCode;
    BOOL _tabKey;
    
    float _deltaX;
    float _deltaY;
    
    unsigned _touchCount;
    NSArray *_touchLocations;
    NSArray *_touchIdentifiers;
    NSArray *_touchPhases;

    BOOL _isGesture;
    float _gestureScale;
    float _gestureRotation;

    BOOL _wasHandled;
}

// Deprecated. Remove once UIKit adopts -initWithMouseEventType taking modifiers.
- (WebEvent *)initWithMouseEventType:(WebEventType)type
                           timeStamp:(CFTimeInterval)timeStamp
                            location:(CGPoint)point;

- (WebEvent *)initWithMouseEventType:(WebEventType)type timeStamp:(CFTimeInterval)timeStamp location:(CGPoint)point modifiers:(WebEventFlags)modifiers;

- (WebEvent *)initWithScrollWheelEventWithTimeStamp:(CFTimeInterval)timeStamp
                                           location:(CGPoint)point
                                              deltaX:(float)deltaX
                                              deltaY:(float)deltaY;

- (WebEvent *)initWithTouchEventType:(WebEventType)type
                           timeStamp:(CFTimeInterval)timeStamp
                            location:(CGPoint)point
                           modifiers:(WebEventFlags)modifiers
                          touchCount:(unsigned)touchCount
                      touchLocations:(NSArray *)touchLocations
                    touchIdentifiers:(NSArray *)touchIdentifiers
                         touchPhases:(NSArray *)touchPhases isGesture:(BOOL)isGesture
                        gestureScale:(float)gestureScale
                     gestureRotation:(float)gestureRotation;

- (WebEvent *)initWithKeyEventType:(WebEventType)type
                         timeStamp:(CFTimeInterval)timeStamp
                        characters:(NSString *)characters
       charactersIgnoringModifiers:(NSString *)charactersIgnoringModifiers
                         modifiers:(WebEventFlags)modifiers
                       isRepeating:(BOOL)repeating
                         withFlags:(WebKeyboardInputFlags)flags
              withInputManagerHint:(NSString *)hint
                           keyCode:(uint16_t)keyCode
                          isTabKey:(BOOL)tabKey;

@property(nonatomic, readonly) WebEventType type;
@property(nonatomic, readonly) CFTimeInterval timestamp;

// Mouse
@property(nonatomic, readonly) CGPoint locationInWindow;

// Keyboard
@property(nonatomic, readonly, retain) NSString *characters;
@property(nonatomic, readonly, retain) NSString *charactersIgnoringModifiers;
@property(nonatomic, readonly) WebEventFlags modifierFlags;
@property(nonatomic, readonly, getter = isKeyRepeating) BOOL keyRepeating;
@property(nonatomic, readonly, retain) NSString *inputManagerHint;

@property(nonatomic, readonly) WebKeyboardInputFlags keyboardFlags;
@property(nonatomic, readonly) uint16_t keyCode;
@property(nonatomic, readonly, getter = isTabKey) BOOL tabKey;

// Scroll Wheel
@property(nonatomic, readonly) float deltaX;
@property(nonatomic, readonly) float deltaY;

// Touch
@property(nonatomic, readonly) unsigned touchCount;
@property(nonatomic, readonly, retain) NSArray *touchLocations;
@property(nonatomic, readonly, retain) NSArray *touchIdentifiers;
@property(nonatomic, readonly, retain) NSArray *touchPhases;

// Gesture
@property(nonatomic, readonly) BOOL isGesture;
@property(nonatomic, readonly) float gestureScale;
@property(nonatomic, readonly) float gestureRotation;

@property(nonatomic) BOOL wasHandled;

@property (class, readonly) WebEventFlags modifierFlags;

@end

#endif // TARGET_OS_IPHONE
#endif // WebEventIOS_h
