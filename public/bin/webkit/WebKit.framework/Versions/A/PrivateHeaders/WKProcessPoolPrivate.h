/*
 * Copyright (C) 2014-2022 Apple Inc. All rights reserved.
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

#import <WebKit/WKBase.h>
#import <WebKit/WKProcessPool.h>
#import <WebKit/WKSecurityOrigin.h>

@class WKWebView;
@class WKWebsiteDataStore;
@class _WKAutomationSession;
@class _WKDownload;
@class _WKProcessPoolConfiguration;

@protocol _WKAutomationDelegate;
@protocol _WKDownloadDelegate;
@protocol _WKGeolocationCoreLocationProvider;

#define HAVE_WK_PROCESS_STATE 1

typedef NS_ENUM(NSInteger, _WKProcessState) {
    _WKProcessStateForeground,
    _WKProcessStateBackground,
    _WKProcessStateSuspended,
} WK_API_AVAILABLE(macos(14.5), ios(17.5), visionos(1.2));

typedef NS_ENUM(NSInteger, _WKWebContentProcessState) {
    _WKWebContentProcessStatePrewarmed,
    _WKWebContentProcessStateCached,
    _WKWebContentProcessStateActive,
} WK_API_AVAILABLE(macos(14.5), ios(17.5), visionos(1.2));

WK_CLASS_AVAILABLE(macos(14.5), ios(17.5), visionos(1.2))
@interface _WKProcessInfo : NSObject
@property (nonatomic, readonly) pid_t pid;
@property (nonatomic, readonly) _WKProcessState state;
@property (nonatomic, readonly) NSTimeInterval totalUserCPUTime;
@property (nonatomic, readonly) NSTimeInterval totalSystemCPUTime;
@property (nonatomic, readonly) size_t physicalFootprint;
@end

WK_CLASS_AVAILABLE(macos(14.5), ios(17.5), visionos(1.2))
@interface _WKWebContentProcessInfo : _WKProcessInfo
@property (nonatomic, readonly) _WKWebContentProcessState webContentState;
@property (nonatomic, readonly) NSArray<WKWebView *> *webViews;
@property (nonatomic, readonly) BOOL runningServiceWorkers;
@property (nonatomic, readonly) BOOL runningSharedWorkers;
@property (nonatomic, readonly) NSTimeInterval totalForegroundTime;
@property (nonatomic, readonly) NSTimeInterval totalBackgroundTime;
@property (nonatomic, readonly) NSTimeInterval totalSuspendedTime;
@end

@interface WKProcessPool ()
- (instancetype)_initWithConfiguration:(_WKProcessPoolConfiguration *)configuration __attribute__((objc_method_family(init))) NS_DESIGNATED_INITIALIZER;
@end

@interface WKProcessPool (WKPrivate)

+ (WKProcessPool *)_sharedProcessPool;

+ (NSArray<WKProcessPool *> *)_allProcessPoolsForTesting WK_API_AVAILABLE(macos(10.14), ios(12.0));

@property (nonatomic, readonly) _WKProcessPoolConfiguration *_configuration;

- (void)_setAllowsSpecificHTTPSCertificate:(NSArray *)certificateChain forHost:(NSString *)host WK_API_DEPRECATED_WITH_REPLACEMENT("WKWebsiteDataStore._allowTLSCertificateChain:forHost:", macos(10.10, 12.0), ios(8.0, 15.0));
- (void)_setCanHandleHTTPSServerTrustEvaluation:(BOOL)value WK_API_DEPRECATED_WITH_REPLACEMENT("_WKWebsiteDataStoreConfiguration.fastServerTrustEvaluationEnabled", macos(10.11, 10.15.4), ios(9.0, 13.4));

- (id)_objectForBundleParameter:(NSString *)parameter;
- (void)_setObject:(id <NSCopying, NSSecureCoding>)object forBundleParameter:(NSString *)parameter;
// FIXME: This should be NSDictionary<NSString *, id <NSCopying, NSSecureCoding>>
- (void)_setObjectsForBundleParametersWithDictionary:(NSDictionary *)dictionary WK_API_AVAILABLE(macos(10.12), ios(10.0));

#if !TARGET_OS_IPHONE
- (void)_resetPluginLoadClientPolicies:(NSDictionary *)policies WK_API_AVAILABLE(macos(10.13));
@property (nonatomic, readonly, copy) NSDictionary *_pluginLoadClientPolicies WK_API_AVAILABLE(macos(10.13));
#endif

@property (nonatomic, weak, setter=_setDownloadDelegate:) id <_WKDownloadDelegate> _downloadDelegate WK_API_DEPRECATED_WITH_REPLACEMENT("WKDownload.downloadDelegate", macos(10.10, 12.0), ios(8.0, 15.0));
@property (nonatomic, weak, setter=_setAutomationDelegate:) id <_WKAutomationDelegate> _automationDelegate WK_API_AVAILABLE(macos(10.12), ios(10.0));

#if TARGET_OS_IPHONE
@property (nonatomic, setter=_setCoreLocationProvider:) id <_WKGeolocationCoreLocationProvider> _coreLocationProvider WK_API_AVAILABLE(ios(11.0));
#endif

+ (NSURL *)_websiteDataURLForContainerWithURL:(NSURL *)containerURL;
+ (NSURL *)_websiteDataURLForContainerWithURL:(NSURL *)containerURL bundleIdentifierIfNotInContainer:(NSString *)bundleIdentifier;

+ (void)_setWebProcessCountLimit:(unsigned)limit WK_API_AVAILABLE(macos(13.0), ios(16.0));

- (void)_warmInitialProcess WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (void)_automationCapabilitiesDidChange WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (void)_setAutomationSession:(_WKAutomationSession *)automationSession WK_API_AVAILABLE(macos(10.12), ios(10.0));

@property (nonatomic, copy, setter=_setJavaScriptConfigurationDirectory:) NSURL *_javaScriptConfigurationDirectory WK_API_AVAILABLE(macos(10.15.4), ios(13.4));

- (void)_addSupportedPlugin:(NSString *) domain named:(NSString *) name withMimeTypes: (NSSet<NSString *> *) mimeTypes withExtensions: (NSSet<NSString *> *) extensions WK_API_AVAILABLE(macos(10.14), ios(12.0));
- (void)_clearSupportedPlugins WK_API_AVAILABLE(macos(10.14), ios(12.0));

- (void)_registerURLSchemeAsCanDisplayOnlyIfCanRequest:(NSString *)scheme WK_API_AVAILABLE(macos(10.14), ios(12.0));
- (void)_registerURLSchemeAsSecure:(NSString *)scheme WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_registerURLSchemeAsBypassingContentSecurityPolicy:(NSString *)scheme WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_setDomainRelaxationForbiddenForURLScheme:(NSString *)scheme WK_API_AVAILABLE(macos(12.0), ios(15.0));

- (_WKDownload *)_downloadURLRequest:(NSURLRequest *)request websiteDataStore:(WKWebsiteDataStore *)dataStore originatingWebView:(WKWebView *)webView WK_API_DEPRECATED_WITH_REPLACEMENT("WKWebView _downloadRequest", macos(10.10, 12.0), ios(8.0, 15.0));
- (_WKDownload *)_resumeDownloadFromData:(NSData *)resumeData websiteDataStore:(WKWebsiteDataStore *)dataStore  path:(NSString *)path originatingWebView:(WKWebView *)webView WK_API_DEPRECATED_WITH_REPLACEMENT("WKWebView.resumeDownloadFromResumeData:completionHandler:", macos(10.10, 12.0), ios(8.0, 15.0));

+ (void)_setLinkedOnOrAfterEverything WK_API_AVAILABLE(macos(13.0), ios(16.0));

// Test only. Should be called only while no web content processes are running.
- (void)_terminateServiceWorkers WK_API_AVAILABLE(macos(10.14), ios(12.0));

// Test only.
- (pid_t)_prewarmedProcessIdentifier WK_API_AVAILABLE(macos(10.15), ios(13.0));

- (void)_terminateAllWebContentProcesses;

// Test only.
- (size_t)_webProcessCount WK_API_AVAILABLE(macos(10.13), ios(11.0));
- (BOOL)_hasPrewarmedWebProcess WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
- (size_t)_webProcessCountIgnoringPrewarmed WK_API_AVAILABLE(macos(10.14), ios(12.0));
- (size_t)_webProcessCountIgnoringPrewarmedAndCached WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
- (size_t)_pluginProcessCount WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
- (size_t)_serviceWorkerProcessCount WK_API_AVAILABLE(macos(10.14), ios(12.0));
- (void)_isJITDisabledInAllRemoteWorkerProcesses:(void(^)(BOOL))completionHandler;
- (void)_makeNextWebProcessLaunchFailForTesting WK_API_AVAILABLE(macos(10.14), ios(12.0));
- (NSUInteger)_maximumSuspendedPageCount WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
- (NSUInteger)_processCacheCapacity WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
- (NSUInteger)_processCacheSize WK_API_AVAILABLE(macos(10.15), ios(13.0));
- (void)_clearWebProcessCache WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
- (void)_setUseSeparateServiceWorkerProcess:(BOOL)forceServiceWorkerProcess WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
- (pid_t)_gpuProcessIdentifier WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (BOOL)_hasAudibleMediaActivity WK_API_AVAILABLE(macos(13.0), ios(16.0));
- (BOOL)_requestWebProcessTermination:(pid_t)pid WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (BOOL)_isWebProcessSuspended:(pid_t)pid;

// Test only. Returns web processes running web pages (does not include web processes running service workers)
- (size_t)_webPageContentProcessCount WK_API_AVAILABLE(macos(10.13.4), ios(11.3));

// Test only. Should be called before any web content processes are launched.
+ (void)_forceGameControllerFramework WK_API_AVAILABLE(macos(10.13), ios(11.0));
+ (void)_setLinkedOnOrAfterEverythingForTesting WK_API_AVAILABLE(macos(12.0), ios(15.0));
+ (void)_setLinkedOnOrBeforeEverythingForTesting WK_API_AVAILABLE(macos(12.0), ios(15.0));
+ (void)_setCaptivePortalModeEnabledGloballyForTesting:(BOOL)isEnabled WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (void)_clearCaptivePortalModeEnabledGloballyForTesting WK_API_AVAILABLE(macos(13.0), ios(16.0));
+ (BOOL)_lockdownModeEnabledGloballyForTesting WK_API_AVAILABLE(macos(13.0), ios(16.0));

// Test only. Should be called before a GPU process has been launched.
+ (void)_setEnableMetalDebugDeviceInNewGPUProcessesForTesting:(BOOL)enable WK_API_AVAILABLE(macos(15.4), ios(18.4), visionos(2.4));
+ (void)_setEnableMetalShaderValidationInNewGPUProcessesForTesting:(BOOL)enable WK_API_AVAILABLE(macos(15.4), ios(18.4), visionos(2.4));
+ (BOOL)_isMetalDebugDeviceEnabledInGPUProcessForTesting WK_API_AVAILABLE(macos(15.4), ios(18.4), visionos(2.4));
+ (BOOL)_isMetalShaderValidationEnabledInGPUProcessForTesting WK_API_AVAILABLE(macos(15.4), ios(18.4), visionos(2.4));

- (void)_preconnectToServer:(NSURL *)serverURL WK_API_DEPRECATED_WITH_REPLACEMENT("WKWebView._preconnectToServer", macos(10.13.4, 10.15.4), ios(11.3, 13.4));

// Test only.
- (void)_getActivePagesOriginsInWebProcessForTesting:(pid_t)pid completionHandler:(void(^)(NSArray<NSString *> *))completionHandler WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
- (void)_clearPermanentCredentialsForProtectionSpace:(NSURLProtectionSpace *)protectionSpace WK_API_AVAILABLE(macos(10.15), ios(13.0));

@property (nonatomic, getter=_isCookieStoragePartitioningEnabled, setter=_setCookieStoragePartitioningEnabled:) BOOL _cookieStoragePartitioningEnabled WK_API_DEPRECATED("Partitioned cookies are no longer supported", macos(10.12.3, 10.14.4), ios(10.3, 12.2));

- (WKNotificationManagerRef)_notificationManagerForTesting;

// Test only.
- (void)_seedResourceLoadStatisticsForTestingWithFirstParty:(NSURL *)firstPartyURL thirdParty:(NSURL *)thirdPartyURL shouldScheduleNotification:(BOOL)shouldScheduleNotification completionHandler:(void(^)(void))completionHandler  WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
- (void)_garbageCollectJavaScriptObjectsForTesting WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (size_t)_numberOfConnectedGamepadsForTesting WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (size_t)_numberOfConnectedHIDGamepadsForTesting WK_API_AVAILABLE(macos(11.0), ios(15.0));
- (size_t)_numberOfConnectedGameControllerFrameworkGamepadsForTesting WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)_setUsesOnlyHIDGamepadProviderForTesting:(BOOL)usesHIDProvider WK_API_AVAILABLE(macos(11.0), ios(14.0));

+ (_WKProcessInfo *)_gpuProcessInfo WK_API_AVAILABLE(macos(14.5));
+ (NSArray<_WKProcessInfo *> *)_networkingProcessInfo WK_API_AVAILABLE(macos(14.5));
+ (NSArray<_WKProcessInfo *> *)_webContentProcessInfo WK_API_AVAILABLE(macos(14.5));
@end
