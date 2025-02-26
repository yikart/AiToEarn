/*
 * Copyright (C) 2019-2020 Apple Inc. All rights reserved.
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

#import <Foundation/Foundation.h>
#import <WebKit/WKFoundation.h>

NS_ASSUME_NONNULL_BEGIN

@class _WKAuthenticatorAttestationResponse;
@class _WKAuthenticatorAssertionResponse;
@class _WKPublicKeyCredentialCreationOptions;
@class _WKPublicKeyCredentialRequestOptions;
@class _WKWebAuthenticationAssertionResponse;
@class _WKWebAuthenticationPanel;
@class LAContext;

typedef NS_ENUM(NSInteger, _WKWebAuthenticationPanelResult) {
    _WKWebAuthenticationPanelResultUnavailable,
    _WKWebAuthenticationPanelResultPresented,
    _WKWebAuthenticationPanelResultDidNotPresent,
} WK_API_AVAILABLE(macos(10.15.4), ios(13.4));

typedef NS_ENUM(NSInteger, _WKWebAuthenticationPanelUpdate) {
    _WKWebAuthenticationPanelUpdateMultipleNFCTagsPresent,
    _WKWebAuthenticationPanelUpdateNoCredentialsFound,
    _WKWebAuthenticationPanelUpdatePINBlocked,
    _WKWebAuthenticationPanelUpdatePINAuthBlocked,
    _WKWebAuthenticationPanelUpdatePINInvalid,
    _WKWebAuthenticationPanelUpdateLAError,
    _WKWebAuthenticationPanelUpdateLAExcludeCredentialsMatched,
    _WKWebAuthenticationPanelUpdateLANoCredential,
    _WKWebAuthenticationPanelUpdateKeyStoreFull,
} WK_API_AVAILABLE(macos(10.15.4), ios(13.4));

typedef NS_ENUM(NSInteger, _WKWebAuthenticationResult) {
    _WKWebAuthenticationResultSucceeded,
    _WKWebAuthenticationResultFailed,
} WK_API_AVAILABLE(macos(10.15.4), ios(13.4));

typedef NS_ENUM(NSInteger, _WKWebAuthenticationTransport) {
    _WKWebAuthenticationTransportUSB,
    _WKWebAuthenticationTransportNFC,
    _WKWebAuthenticationTransportBLE,
    _WKWebAuthenticationTransportInternal,
    _WKWebAuthenticationTransportCaBLE,
    _WKWebAuthenticationTransportHybrid,
    _WKWebAuthenticationTransportSmartCard,
} WK_API_AVAILABLE(macos(10.15.4), ios(13.4));

typedef NS_ENUM(NSInteger, _WKWebAuthenticationType) {
    _WKWebAuthenticationTypeCreate,
    _WKWebAuthenticationTypeGet,
} WK_API_AVAILABLE(macos(10.15.4), ios(13.4));

typedef NS_ENUM(NSInteger, _WKLocalAuthenticatorPolicy) {
    _WKLocalAuthenticatorPolicyAllow,
    _WKLocalAuthenticatorPolicyDisallow,
} WK_API_AVAILABLE(macos(11.0), ios(14.0));

typedef NS_ENUM(NSInteger, _WKWebAuthenticationSource) {
    _WKWebAuthenticationSourceLocal,
    _WKWebAuthenticationSourceExternal,
} WK_API_AVAILABLE(macos(11.0), ios(14.0));

typedef NS_ENUM(NSInteger, _WKWebAuthenticationUserVerificationAvailability) {
    _WKWebAuthenticationUserVerificationAvailabilitySupportedAndConfigured,
    _WKWebAuthenticationUserVerificationAvailabilitySupportedButNotConfigured,
    _WKWebAuthenticationUserVerificationAvailabilityNotSupported,
} WK_API_AVAILABLE(macos(13.0), ios(16.0));

typedef NS_ENUM(NSInteger, _WKWebAuthenticationMediationRequirement) {
    _WKWebAuthenticationMediationRequirementSilent,
    _WKWebAuthenticationMediationRequirementOptional,
    _WKWebAuthenticationMediationRequirementRequired,
    _WKWebAuthenticationMediationRequirementConditional,
} WK_API_AVAILABLE(macos(13.0), ios(16.0));

WK_EXTERN NSString * const _WKLocalAuthenticatorCredentialNameKey;
WK_EXTERN NSString * const _WKLocalAuthenticatorCredentialDisplayNameKey;
WK_EXTERN NSString * const _WKLocalAuthenticatorCredentialIDKey;
WK_EXTERN NSString * const _WKLocalAuthenticatorCredentialRelyingPartyIDKey;
WK_EXTERN NSString * const _WKLocalAuthenticatorCredentialLastModificationDateKey;
WK_EXTERN NSString * const _WKLocalAuthenticatorCredentialCreationDateKey;
WK_EXTERN NSString * const _WKLocalAuthenticatorCredentialGroupKey;
WK_EXTERN NSString * const _WKLocalAuthenticatorCredentialSynchronizableKey;
WK_EXTERN NSString * const _WKLocalAuthenticatorCredentialUserHandleKey;
WK_EXTERN NSString * const _WKLocalAuthenticatorCredentialLastUsedDateKey;

@protocol _WKWebAuthenticationPanelDelegate <NSObject>

@optional

- (void)panel:(_WKWebAuthenticationPanel *)panel updateWebAuthenticationPanel:(_WKWebAuthenticationPanelUpdate)update WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)panel:(_WKWebAuthenticationPanel *)panel requestPINWithRemainingRetries:(NSUInteger)retries completionHandler:(void (^)(NSString *))completionHandler WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)panel:(_WKWebAuthenticationPanel *)panel selectAssertionResponse:(NSArray < _WKWebAuthenticationAssertionResponse *> *)responses source:(_WKWebAuthenticationSource)source completionHandler:(void (^)(_WKWebAuthenticationAssertionResponse * _Nullable))completionHandler WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)panel:(_WKWebAuthenticationPanel *)panel requestLAContextForUserVerificationWithCompletionHandler:(void (^)(LAContext *context))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));

// FIXME: <rdar://problem/71509848> Deprecate the following delegates.
- (void)panel:(_WKWebAuthenticationPanel *)panel decidePolicyForLocalAuthenticatorWithCompletionHandler:(void (^)(_WKLocalAuthenticatorPolicy policy))completionHandler WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)panel:(_WKWebAuthenticationPanel *)panel dismissWebAuthenticationPanelWithResult:(_WKWebAuthenticationResult)result WK_API_AVAILABLE(macos(11.0), ios(14.0));
@end

WK_CLASS_AVAILABLE(macos(10.15.4), ios(13.4))
@interface _WKWebAuthenticationPanel : NSObject

@property (nullable, nonatomic, weak) id <_WKWebAuthenticationPanelDelegate> delegate;

+ (NSArray<NSDictionary *> *)getAllLocalAuthenticatorCredentials WK_API_AVAILABLE(macos(12.0), ios(15.0));
+ (NSArray<NSDictionary *> *)getAllLocalAuthenticatorCredentialsWithRPID:(NSString *)rpID WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (NSArray<NSDictionary *> *)getAllLocalAuthenticatorCredentialsWithCredentialID:(NSData *)credentialID WK_API_AVAILABLE(macos(13.0), ios(16.0));

+ (void)deleteLocalAuthenticatorCredentialWithID:(NSData *)credentialID WK_API_AVAILABLE(macos(12.0), ios(15.0));
+ (void)deleteLocalAuthenticatorCredentialWithGroupAndID:(NSString * _Nullable)group credential:(NSData *)credentialID WK_API_AVAILABLE(macos(12.0), ios(15.0));
+ (void)clearAllLocalAuthenticatorCredentials WK_API_AVAILABLE(macos(12.0), ios(15.0));
+ (void)setDisplayNameForLocalCredentialWithGroupAndID:(NSString * _Nullable)group credential:(NSData *)credentialID displayName: (NSString *)displayName WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (void)setNameForLocalCredentialWithGroupAndID:(NSString * _Nullable)group credential:(NSData *)credentialID name:(NSString *)name WK_API_AVAILABLE(macos(13.0), ios(16.0));

+ (NSData *)exportLocalAuthenticatorCredentialWithID:(NSData *)credentialID error:(NSError **)error WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (NSData *)exportLocalAuthenticatorCredentialWithGroupAndID:(NSString * _Nullable)group credential:(NSData *)credentialID error:(NSError **)error WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (NSData *)importLocalAuthenticatorCredential:(NSData *)credentialBlob error:(NSError **)error WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (NSData *)importLocalAuthenticatorWithAccessGroup:(NSString *)accessGroup credential:(NSData *)credentialBlob error:(NSError **)error WK_API_AVAILABLE(macos(13.0), ios(16.0));

+ (BOOL)isUserVerifyingPlatformAuthenticatorAvailable WK_API_AVAILABLE(macos(12.0), ios(15.0));

+ (NSData *)getClientDataJSONForAuthenticationType:(_WKWebAuthenticationType)type challenge:(NSData *)challenge origin:(NSString *)origin WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (NSData *)getClientDataJSONWithTopOrigin:(_WKWebAuthenticationType)type challenge:(NSData *)challenge origin:(NSString *)origin topOrigin:(NSString *)topOrigin crossOrigin:(BOOL)crossOrigin
    WK_API_AVAILABLE(macos(14.0), ios(17.0));
+ (NSData *)encodeMakeCredentialCommandWithClientDataJSON:(NSData *)clientDataJSON options:(_WKPublicKeyCredentialCreationOptions *)options userVerificationAvailability:(_WKWebAuthenticationUserVerificationAvailability)userVerificationAvailability WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (NSData *)encodeMakeCredentialCommandWithClientDataJSON:(NSData *)clientDataJSON options:(_WKPublicKeyCredentialCreationOptions *)options userVerificationAvailability:(_WKWebAuthenticationUserVerificationAvailability)userVerificationAvailability authenticatorSupportedExtensions:(nullable NSArray<NSString *> *)authenticatorSupportedExtensions WK_API_AVAILABLE(macos(14.0), ios(17.0));
+ (NSData *)encodeGetAssertionCommandWithClientDataJSON:(NSData *)clientDataJSON options:(_WKPublicKeyCredentialRequestOptions *)options userVerificationAvailability:(_WKWebAuthenticationUserVerificationAvailability)userVerificationAvailability WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (NSData *)encodeGetAssertionCommandWithClientDataJSON:(NSData *)clientDataJSON options:(_WKPublicKeyCredentialRequestOptions *)options userVerificationAvailability:(_WKWebAuthenticationUserVerificationAvailability)userVerificationAvailability authenticatorSupportedExtensions:(nullable NSArray<NSString *> *)authenticatorSupportedExtensions WK_API_AVAILABLE(macos(14.0), ios(17.0));

+ (NSData *)encodeMakeCredentialCommandWithClientDataHash:(NSData *)clientDataHash options:(_WKPublicKeyCredentialCreationOptions *)options userVerificationAvailability:(_WKWebAuthenticationUserVerificationAvailability)userVerificationAvailability WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (NSData *)encodeMakeCredentialCommandWithClientDataHash:(NSData *)clientDataHash options:(_WKPublicKeyCredentialCreationOptions *)options userVerificationAvailability:(_WKWebAuthenticationUserVerificationAvailability)userVerificationAvailability authenticatorSupportedExtensions:(nullable NSArray<NSString *> *)authenticatorSupportedExtensions WK_API_AVAILABLE(macos(14.0), ios(17.0));
+ (NSData *)encodeGetAssertionCommandWithClientDataHash:(NSData *)clientDataHash options:(_WKPublicKeyCredentialRequestOptions *)options userVerificationAvailability:(_WKWebAuthenticationUserVerificationAvailability)userVerificationAvailability WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (NSData *)encodeGetAssertionCommandWithClientDataHash:(NSData *)clientDataHash options:(_WKPublicKeyCredentialRequestOptions *)options userVerificationAvailability:(_WKWebAuthenticationUserVerificationAvailability)userVerificationAvailability authenticatorSupportedExtensions:(nullable NSArray<NSString *> *)authenticatorSupportedExtensions WK_API_AVAILABLE(macos(14.0), ios(17.0));

- (instancetype)init;

// FIXME: <rdar://problem/71509485> Adds detailed NSError.
- (void)makeCredentialWithChallenge:(NSData *)challenge origin:(NSString *)origin options:(_WKPublicKeyCredentialCreationOptions *)options completionHandler:(void (^)(_WKAuthenticatorAttestationResponse * _Nullable, NSError * _Nullable))handler WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)makeCredentialWithClientDataHash:(NSData *)clientDataHash options:(_WKPublicKeyCredentialCreationOptions *)options completionHandler:(void (^)(_WKAuthenticatorAttestationResponse * _Nullable, NSError * _Nullable))handler WK_API_AVAILABLE(macos(13.0), ios(16.0));
- (void)makeCredentialWithMediationRequirement:(_WKWebAuthenticationMediationRequirement)mediation clientDataHash:(NSData *)clientDataHash options:(_WKPublicKeyCredentialCreationOptions *)options completionHandler:(void (^)(_WKAuthenticatorAttestationResponse *  _Nullable, NSError *  _Nullable))handler WK_API_AVAILABLE(macos(13.0), ios(16.0));
- (void)getAssertionWithChallenge:(NSData *)challenge origin:(NSString *)origin options:(_WKPublicKeyCredentialRequestOptions *)options completionHandler:(void (^)(_WKAuthenticatorAssertionResponse * _Nullable, NSError * _Nullable))handler WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)getAssertionWithClientDataHash:(NSData *)clientDataHash options:(_WKPublicKeyCredentialRequestOptions *)options completionHandler:(void (^)(_WKAuthenticatorAssertionResponse * _Nullable, NSError * _Nullable))handler WK_API_AVAILABLE(macos(13.0), ios(16.0));
- (void)getAssertionWithMediationRequirement:(_WKWebAuthenticationMediationRequirement)mediation clientDataHash:(NSData *)clientDataHash options:(_WKPublicKeyCredentialRequestOptions *)options completionHandler:(void (^)(_WKAuthenticatorAssertionResponse * _Nullable, NSError * _Nullable))handler WK_API_AVAILABLE(macos(13.0), ios(16.0));
- (void)cancel;

// FIXME: <rdar://problem/71509848> Deprecate the following properties.
@property (nonatomic, readonly, copy) NSString *relyingPartyID;
@property (nonatomic, readonly, copy) NSSet *transports;
@property (nonatomic, readonly) _WKWebAuthenticationType type;
@property (nonatomic, readonly, copy, nullable) NSString *userName;

@end

NS_ASSUME_NONNULL_END
