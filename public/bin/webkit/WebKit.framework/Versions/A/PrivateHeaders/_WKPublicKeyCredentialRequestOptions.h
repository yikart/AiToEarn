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

#import <WebKit/WKFoundation.h>

#import <Foundation/Foundation.h>
#import <WebKit/_WKAuthenticatorAttachment.h>
#import <WebKit/_WKUserVerificationRequirement.h>

NS_ASSUME_NONNULL_BEGIN

@class _WKAuthenticationExtensionsClientInputs;
@class _WKPublicKeyCredentialDescriptor;

WK_CLASS_AVAILABLE(macos(12.0), ios(15.0))
@interface _WKPublicKeyCredentialRequestOptions : NSObject

@property (nullable, nonatomic, copy) NSNumber *timeout;
@property (nullable, nonatomic, copy) NSString *relyingPartyIdentifier;
@property (nullable, nonatomic, copy) NSArray<_WKPublicKeyCredentialDescriptor *> *allowCredentials;
/*!@discussion The default value is _WKUserVerificationRequirementPreferred.*/
@property (nonatomic) _WKUserVerificationRequirement userVerification;
/*!@discussion The default value is _WKAuthenticatorAttachmentAll.*/
@property (nonatomic) _WKAuthenticatorAttachment authenticatorAttachment;
@property (nullable, nonatomic, strong) _WKAuthenticationExtensionsClientInputs *extensions;
@property (nullable, nonatomic, copy) NSData *extensionsCBOR;

@end

NS_ASSUME_NONNULL_END
