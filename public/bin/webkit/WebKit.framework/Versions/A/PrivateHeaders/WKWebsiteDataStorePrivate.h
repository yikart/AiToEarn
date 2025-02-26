/*
 * Copyright (C) 2016-2020 Apple Inc. All rights reserved.
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

#import <WebKit/WKWebViewConfigurationPrivate.h>
#import <WebKit/WKWebsiteDataStore.h>

NS_ASSUME_NONNULL_BEGIN

@class UNNotificationResponse;
@class WKSecurityOrigin;
@class WKWebView;
@class _WKResourceLoadStatisticsThirdParty;
@class _WKWebPushAction;
@class _WKWebsiteDataStoreConfiguration;

@protocol _WKWebsiteDataStoreDelegate;

typedef NS_OPTIONS(NSUInteger, _WKWebsiteDataStoreFetchOptions) {
    _WKWebsiteDataStoreFetchOptionComputeSizes = 1 << 0,
} WK_API_AVAILABLE(macos(10.12), ios(10.0));

typedef NS_ENUM(uint8_t, _WKRestrictedOpenerType) {
    _WKRestrictedOpenerTypeUnrestricted,
    _WKRestrictedOpenerTypeNoOpener,
    _WKRestrictedOpenerTypePostMessageAndClosed,
} WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

@interface WKWebsiteDataStore (WKPrivate)

+ (NSSet<NSString *> *)_allWebsiteDataTypesIncludingPrivate;
+ (BOOL)_defaultDataStoreExists;
+ (void)_deleteDefaultDataStoreForTesting;
+ (void)_fetchAllIdentifiers:(void(^)(NSArray<NSUUID *> *))completionHandler WK_API_AVAILABLE(macos(13.3), ios(16.4));
+ (void)_removeDataStoreWithIdentifier:(NSUUID *)identifier completionHandler:(void(^)(NSError* error))completionHandler WK_API_AVAILABLE(macos(13.3), ios(16.4));

- (instancetype)_initWithConfiguration:(_WKWebsiteDataStoreConfiguration *)configuration WK_API_AVAILABLE(macos(10.13), ios(11.0));

- (void)_fetchDataRecordsOfTypes:(NSSet<NSString *> *)dataTypes withOptions:(_WKWebsiteDataStoreFetchOptions)options completionHandler:(void (^)(NSArray<WKWebsiteDataRecord *> *))completionHandler;

@property (nonatomic, setter=_setResourceLoadStatisticsEnabled:) BOOL _resourceLoadStatisticsEnabled WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setResourceLoadStatisticsDebugMode:) BOOL _resourceLoadStatisticsDebugMode WK_API_AVAILABLE(macos(10.14), ios(12.0));
@property (nonatomic, setter=_setPerOriginStorageQuota:) NSUInteger _perOriginStorageQuota WK_API_DEPRECATED_WITH_REPLACEMENT("_WKWebsiteDataStoreConfiguration.perOriginStorageQuota", macos(10.13.4, 10.15.4), ios(11.3, 13.4));

@property (nonatomic, setter=_setBoundInterfaceIdentifier:) NSString *_boundInterfaceIdentifier WK_API_DEPRECATED_WITH_REPLACEMENT("_WKWebsiteDataStoreConfiguration.boundInterfaceIdentifier", macos(10.13.4, 10.15.4), ios(11.3, 13.4));
@property (nonatomic, setter=_setAllowsCellularAccess:) BOOL _allowsCellularAccess WK_API_DEPRECATED_WITH_REPLACEMENT("_WKWebsiteDataStoreConfiguration.allowsCellularAccess", macos(10.13.4, 10.15.4), ios(11.3, 13.4));
@property (nonatomic, setter=_setProxyConfiguration:) NSDictionary *_proxyConfiguration WK_API_DEPRECATED_WITH_REPLACEMENT("_WKWebsiteDataStoreConfiguration.proxyConfiguration", macos(10.14, 10.15.4), ios(12.0, 13.4));
@property (nonatomic, setter=_setAllowsTLSFallback:) BOOL _allowsTLSFallback WK_API_AVAILABLE(macos(10.15), ios(13.0));
@property (nonatomic, setter=_setStorageSiteValidationEnabled:) BOOL _storageSiteValidationEnabled WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));
@property (nonatomic, setter=_setPersistedSites:) NSArray<NSURL *> *_persistedSites WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

- (void)_setResourceLoadStatisticsTimeAdvanceForTesting:(NSTimeInterval)time completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(13.3), ios(16.4));
- (void)_setResourceLoadStatisticsTestingCallback:(nullable void (^)(WKWebsiteDataStore *, NSString *))callback WK_API_AVAILABLE(macos(10.13), ios(11.0));
- (void)_loadedSubresourceDomainsFor:(WKWebView *)webView completionHandler:(void (^)(NSArray<NSString *> *domains))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_clearLoadedSubresourceDomainsFor:(WKWebView *)webView WK_API_AVAILABLE(macos(12.0), ios(15.0));
+ (void)_allowWebsiteDataRecordsForAllOrigins WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
- (void)_setStorageAccessPromptQuirkForTesting:(NSString *)topFrameDomain withSubFrameDomains:(NSArray<NSString *> *)subFrameDomains withTriggerPages:(NSArray<NSString *> *)triggerPages completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));
- (void)_grantStorageAccessForTesting:(NSString *)topFrameDomain withSubFrameDomains:(NSArray<NSString *> *)subFrameDomains completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

- (void)_scheduleCookieBlockingUpdate:(void (^)(void))completionHandler WK_API_AVAILABLE(macos(10.15), ios(13.0));
- (void)_logUserInteraction:(NSURL *)domain completionHandler:(void (^)(void))completionHandler WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
- (void)_setPrevalentDomain:(NSURL *)domain completionHandler:(void (^)(void))completionHandler WK_API_AVAILABLE(macos(10.15), ios(13.0));
- (void)_getIsPrevalentDomain:(NSURL *)domain completionHandler:(void (^)(BOOL))completionHandler WK_API_AVAILABLE(macos(10.15), ios(13.0));
- (void)_getResourceLoadStatisticsDataSummary:(void (^)(NSArray<_WKResourceLoadStatisticsThirdParty *> *))completionHandler WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
- (void)_clearPrevalentDomain:(NSURL *)domain completionHandler:(void (^)(void))completionHandler WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
- (void)_clearResourceLoadStatistics:(void (^)(void))completionHandler WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
- (void)_closeDatabases:(void (^)(void))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));
- (void)_isRelationshipOnlyInDatabaseOnce:(NSURL *)firstPartyURL thirdParty:(NSURL *)thirdPartyURL completionHandler:(void (^)(BOOL))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_isRegisteredAsSubresourceUnderFirstParty:(NSURL *)firstPartyURL thirdParty:(NSURL *)thirdPartyURL completionHandler:(void (^)(BOOL))completionHandler WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
- (void)_setThirdPartyCookieBlockingMode:(BOOL)enabled onlyOnSitesWithoutUserInteraction:(BOOL)onlyOnSitesWithoutUserInteraction completionHandler:(void (^)(void))completionHandler WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)_statisticsDatabaseHasAllTables:(void (^)(BOOL))completionHandler WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)_processStatisticsAndDataRecords:(void (^)(void))completionHandler WK_API_AVAILABLE(macos(10.15), ios(13.0));
- (void)_appBoundDomains:(void (^)(NSArray<NSString *> *))completionHandler WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)_appBoundSchemes:(void (^)(NSArray<NSString *> *))completionHandler WK_API_AVAILABLE(macos(11.0), ios(14.0));

+ (void)_setCachedProcessSuspensionDelayForTesting:(double)delayInSeconds WK_API_AVAILABLE(macos(13.0), ios(16.0));

- (void)_allowTLSCertificateChain:(NSArray *)certificateChain forHost:(NSString *)host WK_API_DEPRECATED_WITH_REPLACEMENT("WKNavigationDelegate.didReceiveAuthenticationChallenge", macos(12.0, 14.2), ios(15.0, 17.2));
- (void)_trustServerForLocalPCMTesting:(SecTrustRef)serverTrust WK_API_AVAILABLE(macos(13.0), ios(16.0));

- (void)_setPrivateClickMeasurementDebugModeEnabled:(BOOL)enabled WK_API_AVAILABLE(macos(14.0), ios(17.0));

- (void)_renameOrigin:(NSURL *)oldName to:(NSURL *)newName forDataOfTypes:(NSSet<NSString *> *)dataTypes completionHandler:(void (^)(void))completionHandler;

- (BOOL)_networkProcessHasEntitlementForTesting:(NSString *)entitlement WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_setUserAgentStringQuirkForTesting:(NSString *)domain withUserAgent:(NSString *)userAgent completionHandler:(void (^)(void))completionHandler WK_API_AVAILABLE(macos(14.4), ios(17.4), visionos(1.1));
- (void)_setPrivateTokenIPCForTesting:(bool)enabled WK_API_AVAILABLE(macos(14.5), ios(17.5), visionos(1.2));

@property (nullable, nonatomic, weak) id <_WKWebsiteDataStoreDelegate> _delegate WK_API_AVAILABLE(macos(10.15), ios(13.0));
@property (nonatomic, readonly, copy) _WKWebsiteDataStoreConfiguration *_configuration;

+ (WKNotificationManagerRef)_sharedServiceWorkerNotificationManager WK_API_AVAILABLE(macos(13.0), ios(16.0));

- (void)_terminateNetworkProcess WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_sendNetworkProcessPrepareToSuspend:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_sendNetworkProcessWillSuspendImminently WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_sendNetworkProcessDidResume WK_API_AVAILABLE(macos(12.0), ios(15.0));
+ (void)_setNetworkProcessSuspensionAllowedForTesting:(BOOL)allowed WK_API_AVAILABLE(macos(13.0), ios(16.0));
- (void)_synthesizeAppIsBackground:(BOOL)background WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (pid_t)_networkProcessIdentifier WK_API_AVAILABLE(macos(12.0), ios(15.0));
+ (void)_makeNextNetworkProcessLaunchFailForTesting WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (BOOL)_networkProcessExists WK_API_AVAILABLE(macos(12.0), ios(15.0));
+ (BOOL)_defaultNetworkProcessExists WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_countNonDefaultSessionSets:(void(^)(size_t))completionHandler;

-(bool)_hasServiceWorkerBackgroundActivityForTesting WK_API_AVAILABLE(macos(13.0), ios(16.0));
-(void)_getPendingPushMessage:(void(^)(NSDictionary *))completionHandler WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA));
-(void)_getPendingPushMessages:(void(^)(NSArray<NSDictionary *> *))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));
-(void)_processPushMessage:(NSDictionary *)pushMessage completionHandler:(void(^)(bool))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));
-(void)_processPersistentNotificationClick:(NSDictionary *)notificationDictionaryRepresentation completionHandler:(void(^)(bool))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));
-(void)_processPersistentNotificationClose:(NSDictionary *)notificationDictionaryRepresentation completionHandler:(void(^)(bool))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));
-(void)_setServiceWorkerOverridePreferences:(WKPreferences *)preferences WK_API_AVAILABLE(macos(13.3), ios(16.4));
-(void)_scopeURL:(NSURL *)scopeURL hasPushSubscriptionForTesting:(void(^)(BOOL))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));
-(void)_originDirectoryForTesting:(NSURL *)origin topOrigin:(NSURL *)topOrigin type:(NSString *)dataType completionHandler:(void(^)(NSString *))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));
-(void)_setBackupExclusionPeriodForTesting:(double)seconds completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));

-(void)_getAllBackgroundFetchIdentifiers:(void(^)(NSArray<NSString *> *identifiers))completionHandler WK_API_AVAILABLE(macos(14.0), ios(17.0));
-(void)_getBackgroundFetchState:(NSString *) identifier completionHandler:(void(^)(NSDictionary *state))completionHandler WK_API_AVAILABLE(macos(14.0), ios(17.0));
-(void)_abortBackgroundFetch:(NSString *)identifier completionHandler:(void(^_Nullable)(void))completionHandler WK_API_AVAILABLE(macos(14.0), ios(17.0));
-(void)_pauseBackgroundFetch:(NSString *)identifier completionHandler:(void(^_Nullable)(void))completionHandler WK_API_AVAILABLE(macos(14.0), ios(17.0));
-(void)_resumeBackgroundFetch:(NSString *)identifier completionHandler:(void(^_Nullable)(void))completionHandler WK_API_AVAILABLE(macos(14.0), ios(17.0));
-(void)_clickBackgroundFetch:(NSString *)identifier completionHandler:(void(^_Nullable)(void))completionHandler WK_API_AVAILABLE(macos(14.0), ios(17.0));
-(void)_storeServiceWorkerRegistrations:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(14.0), ios(17.0));
-(void)_setCompletionHandlerForRemovalFromNetworkProcess:(void(^)(NSError* error))completionHandler WK_API_AVAILABLE(macos(14.0), ios(17.0));

-(void)_setRestrictedOpenerTypeForTesting:(_WKRestrictedOpenerType)type forDomain:(NSString *)domain WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));
-(void)_getAppBadgeForTesting:(void(^)(NSNumber *))completionHandler WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

@property (nonatomic, readonly) NSUUID *_identifier;
@property (nonatomic, readonly) NSString *_webPushPartition;

+ (void)_setWebPushActionHandler:(WKWebsiteDataStore *(^)(_WKWebPushAction *))handler WK_API_AVAILABLE(ios(WK_IOS_TBA));
+ (BOOL)handleNotificationResponse:(UNNotificationResponse *)response WK_API_AVAILABLE(ios(WK_IOS_TBA));

- (void)_runningOrTerminatingServiceWorkerCountForTesting:(void(^)(NSUInteger))completionHandler WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA));

// Supported data types are: WKWebsiteDataTypeLocalStorage.
- (void)_fetchDataOfTypes:(NSSet<NSString *> *)dataTypes completionHandler:(WK_SWIFT_UI_ACTOR void(^)(NSData *))completionHandler WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));
- (void)_restoreData:(NSData *)data completionHandler:(WK_SWIFT_UI_ACTOR void(^)(BOOL))completionHandler WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

@end

NS_ASSUME_NONNULL_END
