/*
 * Copyright (C) 2017-2021 Apple Inc. All rights reserved.
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

typedef NS_ENUM(NSInteger, _WKUnifiedOriginStorageLevel) {
    _WKUnifiedOriginStorageLevelNone,
    _WKUnifiedOriginStorageLevelBasic,
    _WKUnifiedOriginStorageLevelStandard
} WK_API_AVAILABLE(macos(13.3), ios(16.4));

NS_ASSUME_NONNULL_BEGIN

WK_CLASS_AVAILABLE(macos(10.13), ios(11.0))
@interface _WKWebsiteDataStoreConfiguration : NSObject

- (instancetype)init; // Creates a persistent configuration.
- (instancetype)initNonPersistentConfiguration WK_API_AVAILABLE(macos(10.15), ios(13.0));
- (instancetype)initWithIdentifier:(NSUUID *)identifier WK_API_AVAILABLE(macos(13.3), ios(16.4));
- (instancetype)initWithDirectory:(NSURL *)directory WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

@property (nonatomic, readonly, getter=isPersistent) BOOL persistent WK_API_AVAILABLE(macos(10.15), ios(13.0));

// These properties apply to both persistent and non-persistent data stores.
@property (nonatomic, nullable, copy) NSString *sourceApplicationBundleIdentifier WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic, nullable, copy) NSString *sourceApplicationSecondaryIdentifier WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic, nullable, copy, setter=setHTTPProxy:) NSURL *httpProxy WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic, nullable, copy, setter=setHTTPSProxy:) NSURL *httpsProxy WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic) BOOL deviceManagementRestrictionsEnabled WK_API_AVAILABLE(macos(10.15), ios(13.0));
@property (nonatomic) BOOL networkCacheSpeculativeValidationEnabled WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic) BOOL fastServerTrustEvaluationEnabled WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic) NSUInteger perOriginStorageQuota WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, nullable, copy) NSNumber *originQuotaRatio WK_API_AVAILABLE(macos(14.0), ios(17.0));
@property (nonatomic, nullable, copy) NSNumber *totalQuotaRatio WK_API_AVAILABLE(macos(14.0), ios(17.0));
@property (nonatomic, nullable, copy) NSNumber *standardVolumeCapacity WK_API_AVAILABLE(macos(14.0), ios(17.0));
@property (nonatomic, nullable, copy) NSString *boundInterfaceIdentifier WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic) BOOL allowsCellularAccess WK_API_AVAILABLE(macos(10.15.4), ios(14.0));
@property (nonatomic) BOOL legacyTLSEnabled WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, nullable, copy) NSDictionary *proxyConfiguration WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, nullable, copy) NSString *dataConnectionServiceType WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic) BOOL preventsSystemHTTPProxyAuthentication WK_API_AVAILABLE(macos(11.0), ios(14.0));
@property (nonatomic) BOOL requiresSecureHTTPSProxyConnection WK_API_AVAILABLE(macos(11.0), ios(14.0));
@property (nonatomic) BOOL shouldRunServiceWorkersOnMainThreadForTesting WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic) NSUInteger overrideServiceWorkerRegistrationCountTestingValue WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic) BOOL resourceLoadStatisticsDebugModeEnabled WK_API_AVAILABLE(macos(13.3), ios(16.4));
@property (nonatomic, readonly) NSUUID *identifier WK_API_AVAILABLE(macos(14.0), ios(17.0));

@property (nonatomic, setter=_setShouldAcceptInsecureCertificatesForWebSockets:) BOOL _shouldAcceptInsecureCertificatesForWebSockets WK_API_DEPRECATED_WITH_REPLACEMENT("WKNavigationDelegate.didReceiveAuthenticationChallenge", macos(13.0, 14.4), ios(16.0, 17.4), visionos(1.0, 1.1));

// These properties only make sense for persistent data stores, and will throw
// an exception if set for non-persistent stores.
@property (nonatomic, copy, setter=_setWebStorageDirectory:) NSURL *_webStorageDirectory;
@property (nonatomic, copy, setter=_setIndexedDBDatabaseDirectory:) NSURL *_indexedDBDatabaseDirectory;
@property (nonatomic, copy, setter=_setWebSQLDatabaseDirectory:) NSURL *_webSQLDatabaseDirectory;
@property (nonatomic, copy, setter=_setCookieStorageFile:) NSURL *_cookieStorageFile;
@property (nonatomic, copy, setter=_setResourceLoadStatisticsDirectory:) NSURL *_resourceLoadStatisticsDirectory WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
@property (nonatomic, copy, setter=_setCacheStorageDirectory:) NSURL *_cacheStorageDirectory WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
@property (nonatomic, copy, setter=_setServiceWorkerRegistrationDirectory:) NSURL *_serviceWorkerRegistrationDirectory WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
@property (nonatomic) BOOL serviceWorkerProcessTerminationDelayEnabled WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, nullable, copy) NSURL *networkCacheDirectory WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, nullable, copy) NSURL *deviceIdHashSaltsStorageDirectory WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, nullable, copy) NSURL *applicationCacheDirectory WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, nullable, copy) NSString *applicationCacheFlatFileSubdirectoryName WK_API_AVAILABLE(macos(10.4), ios(13.4));
@property (nonatomic, nullable, copy) NSURL *mediaCacheDirectory WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, nullable, copy) NSURL *mediaKeysStorageDirectory WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic) NSUInteger testSpeedMultiplier WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic) BOOL suppressesConnectionTerminationOnSystemChange WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic) BOOL allowsServerPreconnect WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, nullable, copy, setter=setHSTSStorageDirectory:) NSURL *hstsStorageDirectory WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic) BOOL enableInAppBrowserPrivacyForTesting WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic) BOOL allowsHSTSWithUntrustedRootCertificate WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic, nullable, copy, setter=setPCMMachServiceName:) NSString *pcmMachServiceName WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic, nullable, copy, setter=setWebPushMachServiceName:) NSString *webPushMachServiceName WK_API_AVAILABLE(macos(13.0), ios(16.0));

@property (nonatomic, nullable, copy) NSURL *alternativeServicesStorageDirectory WK_API_AVAILABLE(macos(11.0), ios(14.0));
@property (nonatomic, nullable, copy) NSURL *standaloneApplicationURL WK_API_AVAILABLE(macos(11.0), ios(14.0));
@property (nonatomic, nullable, copy) NSURL *generalStorageDirectory WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic, nullable, copy, setter=setWebPushPartitionString:) NSString *webPushPartitionString WK_API_AVAILABLE(macos(13.3), ios(16.4));
@property (nonatomic) _WKUnifiedOriginStorageLevel unifiedOriginStorageLevel WK_API_AVAILABLE(macos(13.3), ios(16.4));
@property (nonatomic, nullable, copy) NSNumber *volumeCapacityOverride WK_API_AVAILABLE(macos(14.0), ios(17.0));
@property (nonatomic) BOOL isDeclarativeWebPushEnabled WK_API_AVAILABLE(macos(14.4), ios(17.4), visionos(1.1));
@property (nonatomic, nullable, copy) NSNumber *defaultTrackingPreventionEnabledOverride WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

// Testing only.
@property (nonatomic) BOOL allLoadsBlockedByDeviceManagementRestrictionsForTesting WK_API_AVAILABLE(macos(10.15), ios(13.0));

@end

NS_ASSUME_NONNULL_END
