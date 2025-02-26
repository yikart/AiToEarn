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

#ifdef __cplusplus

#import <WebKit/_WKWebAuthenticationPanel.h>

namespace WebCore {
struct PublicKeyCredentialCreationOptions;
struct PublicKeyCredentialRequestOptions;
}

WK_CLASS_AVAILABLE(macos(12.0), ios(15.0))
@interface _WKWebAuthenticationPanel (WKTesting)

+ (WebCore::PublicKeyCredentialCreationOptions)convertToCoreCreationOptionsWithOptions:(_WKPublicKeyCredentialCreationOptions *)options WK_API_AVAILABLE(macos(12.0), ios(15.0));
+ (WebCore::PublicKeyCredentialRequestOptions)convertToCoreRequestOptionsWithOptions:(_WKPublicKeyCredentialRequestOptions *)options WK_API_AVAILABLE(macos(12.0), ios(15.0));

+ (NSArray<NSDictionary *> *)getAllLocalAuthenticatorCredentialsWithAccessGroup:(NSString *)accessGroup WK_API_AVAILABLE(macos(12.0), ios(15.0));

+ (NSArray<NSDictionary *> *)getAllLocalAuthenticatorCredentialsWithRPIDAndAccessGroup:(NSString *)accessGroup rpID:(NSString *)rpID WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (NSArray<NSDictionary *> *)getAllLocalAuthenticatorCredentialsWithCredentialIDAndAccessGroup:(NSString *)accessGroup credentialID:(NSData *)credentialID WK_API_AVAILABLE(macos(13.0), ios(16.0));

// For details of configuration, refer to MockWebAuthenticationConfiguration.h.
@property (nonatomic, copy) NSDictionary *mockConfiguration;

@end

#endif
