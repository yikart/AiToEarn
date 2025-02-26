/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

typedef NS_ENUM(NSUInteger, _WKNotificationAlert) {
    _WKNotificationAlertDefault,
    _WKNotificationAlertSilent,
    _WKNotificationAlertEnabled
};

typedef NS_ENUM(NSUInteger, _WKNotificationDirection) {
    _WKNotificationDirectionAuto,
    _WKNotificationDirectionLTR,
    _WKNotificationDirectionRTL
};

WK_CLASS_AVAILABLE(macos(13.3), ios(16.4))
@interface _WKNotificationData : NSObject
- (instancetype)init NS_UNAVAILABLE;

@property (nonatomic, readonly) NSString *title;
@property (nonatomic, readonly) _WKNotificationDirection dir;
@property (nonatomic, readonly) NSString *lang;
@property (nonatomic, readonly) NSString *body;
@property (nonatomic, readonly) NSString *tag;
@property (nonatomic, readonly) _WKNotificationAlert alert;
@property (nonatomic, readonly) NSData *data;

@property (nonatomic, readonly) NSString *origin;
@property (nonatomic, readonly) NSURL *securityOrigin;
@property (nonatomic, readonly) NSURL *serviceWorkerRegistrationURL;

@property (nonatomic, readonly) NSString *identifier;
@property (nonatomic, readonly) NSUUID *uuid;
@property (nonatomic, readonly, copy) NSDictionary *userInfo;

- (NSDictionary *)dictionaryRepresentation;

@end

WK_CLASS_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA))
@interface _WKMutableNotificationData : _WKNotificationData
- (instancetype)init;

@property (nonatomic, readwrite, copy) NSString *title;
@property (nonatomic, readwrite) _WKNotificationDirection dir;
@property (nonatomic, readwrite, copy) NSString *lang;
@property (nonatomic, readwrite, copy) NSString *body;
@property (nonatomic, readwrite, copy) NSString *tag;
@property (nonatomic, readwrite) _WKNotificationAlert alert;
@property (nonatomic, readwrite, copy) NSData *data;
@property (nonatomic, readwrite, copy) NSURL *securityOrigin;
@property (nonatomic, readwrite, copy) NSURL *serviceWorkerRegistrationURL;
@property (nonatomic, readwrite, copy) NSUUID *uuid;
@end
