/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

NS_ASSUME_NONNULL_BEGIN

/*! @abstract A WKContentWorldConfiguration object allows you to specify configuration for WKContentWorld.
@discussion WKContentWorldConfiguration allows applications to specify ways by which extra JavaScript capabilities should be exposed to the script in the environment.
For example:
- If your scripts have to access autofill capabilities, you may want to set allowAutofill to YES. */
WK_SWIFT_UI_ACTOR
NS_SWIFT_SENDABLE
WK_CLASS_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
@interface _WKContentWorldConfiguration : NSObject<NSCopying, NSSecureCoding>

@property (nonatomic, copy) NSString *name;

/*! @abstract A boolean value indicating whether every shadow root should be treated as open mode shadow root or not. */
@property (nonatomic) BOOL allowAccessToClosedShadowRoots;

/*! @abstract A boolean value indicating whether the capability to trigger autofill is exposed to scripts or not. */
@property (nonatomic) BOOL allowAutofill;

/*! @abstract A boolean value indicating whether the ability to attach user info on an element is exposed to scripts or not. */
@property (nonatomic) BOOL allowElementUserInfo;

/*! @abstract A boolean value indicating whether the behavior that elements with a name attribute overrides builtin methods on document object should be disabled or not. */
@property (nonatomic) BOOL disableLegacyBuiltinOverrides;

@end

NS_ASSUME_NONNULL_END
