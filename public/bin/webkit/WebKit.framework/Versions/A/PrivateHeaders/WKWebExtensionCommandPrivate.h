/*
 * Copyright (C) 2023-2024 Apple Inc. All rights reserved.
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

#import <WebKit/WKWebExtensionCommand.h>

@interface WKWebExtensionCommand ()

/*!
 @abstract Represents the shortcut for the web extension, formatted according to web extension specification.
 @discussion Provides a string representation of the shortcut, incorporating any customizations made to the ``activationKey``
 and ``modifierFlags`` properties. It will be empty if no shortcut is defined for the command.
 */
@property (nonatomic, readonly, copy) NSString *_shortcut;

/*!
 @abstract Represents the user visible shortcut for the web extension, formatted according to the system.
 @discussion Provides a string representation of the shortcut, incorporating any customizations made to the ``activationKey``
 and ``modifierFlags`` properties. It will be empty if no shortcut is defined for the command.
 */
@property (nonatomic, readonly, copy) NSString *_userVisibleShortcut;

/*! @abstract Represents whether or not this command is the action command for the extension. */
@property (nonatomic, readonly) BOOL _isActionCommand;

#if TARGET_OS_OSX
/*!
 @abstract Determines whether an event matches the command's activation key and modifier flags.
 @discussion This method can be used to check if a given keyboard event corresponds to the command's activation key and modifiers, if any.
 The app can use this during event handling in the app, without showing the command in a menu.
 @param event The event to be checked against the command's activation key and modifiers.
 @result A Boolean value indicating whether the event matches the command's shortcut.
 */
- (BOOL)_matchesEvent:(NSEvent *)event;
#endif // TARGET_OS_OSX

@end
