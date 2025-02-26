/*
 * Copyright (C) 2014-2020 Apple Inc. All rights reserved.
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
#import <WebKit/WKBase.h>
#import <WebKit/WKFoundation.h>

NS_ASSUME_NONNULL_BEGIN

WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface _WKProcessPoolConfiguration : NSObject <NSCopying>

@property (nonatomic, copy) NSURL *injectedBundleURL;
@property (nonatomic, copy) NSSet<Class> *customClassesForParameterCoder WK_API_DEPRECATED("No longer supported", macos(10.15.4, 14.0), ios(13.4, 17.0));
@property (nonatomic) NSUInteger maximumProcessCount WK_API_DEPRECATED("It is no longer possible to limit the number of processes", macos(10.0, 10.15), ios(1.0, 13.0));
@property (nonatomic) BOOL usesSingleWebProcess WK_API_AVAILABLE(macos(10.15), ios(13.0));
@property (nonatomic, nullable, copy) NSString *customWebContentServiceBundleIdentifier WK_API_DEPRECATED("No longer supported", macos(10.14.4, 14.0), ios(12.2, 17.0));

@property (nonatomic) BOOL ignoreSynchronousMessagingTimeoutsForTesting WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic) BOOL attrStyleEnabled WK_API_AVAILABLE(macos(10.14.4), ios(12.2));

// Defaults to YES.
@property (nonatomic) BOOL shouldThrowExceptionForGlobalConstantRedeclaration WK_API_AVAILABLE(macos(12.0), ios(15.0));

@property (nonatomic, copy) NSArray<NSURL *> *additionalReadAccessAllowedURLs WK_API_AVAILABLE(macos(10.13), ios(11.0));

#if TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
@property (nonatomic) NSUInteger wirelessContextIdentifier WK_API_DEPRECATED("Use of this API is no longer necessary and can be removed", ios(10.12, 13.0));
#endif

// Network Process properties
// FIXME: These should be be per-session/data store when we support multiple non-persistent sessions/data stores.

@property (nonatomic) NSInteger diskCacheSizeOverride WK_API_DEPRECATED("Use [WKWebsiteDataStore nonPersistentDataStore] to limit disk cache size to 0", macos(10.11, 10.14.4), ios(9.0, 12.2));
@property (nonatomic, copy) NSArray *cachePartitionedURLSchemes;
@property (nonatomic, copy) NSArray<NSString *> *alwaysRevalidatedURLSchemes WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic) BOOL diskCacheSpeculativeValidationEnabled WK_API_DEPRECATED_WITH_REPLACEMENT("_WKWebsiteDataStoreConfiguration.networkCacheSpeculativeValidationEnabled", macos(10.12, 10.15.4), ios(10.0, 13.4));
@property (nonatomic, nullable, copy) NSString *sourceApplicationBundleIdentifier WK_API_DEPRECATED_WITH_REPLACEMENT("_WKWebsiteDataStoreConfiguration.sourceApplicationBundleIdentifier", macos(10.12.3, 10.14.4), ios(10.3, 12.2));
@property (nonatomic, nullable, copy) NSString *sourceApplicationSecondaryIdentifier WK_API_DEPRECATED_WITH_REPLACEMENT("_WKWebsiteDataStoreConfiguration.sourceApplicationSecondaryIdentifier", macos(10.12.3, 10.14.4), ios(10.3, 12.2));
@property (nonatomic) BOOL shouldCaptureAudioInUIProcess WK_API_AVAILABLE(macos(10.13), ios(11.0));
#if TARGET_OS_IPHONE
@property (nonatomic) BOOL alwaysRunsAtBackgroundPriority WK_API_AVAILABLE(ios(10.3));
@property (nonatomic) BOOL shouldTakeUIBackgroundAssertion WK_API_AVAILABLE(ios(11.0));
#endif
@property (nonatomic) pid_t presentingApplicationPID WK_API_AVAILABLE(macos(10.13), ios(11.0));
@property (nonatomic) audit_token_t presentingApplicationProcessToken WK_API_AVAILABLE(macos(10.13), ios(11.3));
@property (nonatomic) BOOL processSwapsOnNavigation WK_API_AVAILABLE(macos(10.14), ios(12.0));
@property (nonatomic) BOOL forceOverlayScrollbars WK_API_AVAILABLE(macos(10.14));
@property (nonatomic) BOOL alwaysKeepAndReuseSwappedProcesses WK_API_AVAILABLE(macos(10.14), ios(12.0));
@property (nonatomic) BOOL processSwapsOnNavigationWithinSameNonHTTPFamilyProtocol WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic) BOOL prewarmsProcessesAutomatically WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic) BOOL usesWebProcessCache WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic) BOOL pageCacheEnabled WK_API_AVAILABLE(macos(10.14), ios(12.0));
@property (nonatomic, getter=isJITEnabled) BOOL JITEnabled WK_API_AVAILABLE(macos(10.14.4), ios(12.2));

@property (nonatomic) BOOL configureJSCForTesting WK_API_AVAILABLE(macos(10.15.4), ios(13.4));

@property (nonatomic, nullable, copy) NSString *timeZoneOverride WK_API_AVAILABLE(macos(13.0), ios(16.0));

@property (nonatomic) NSTimeInterval memoryFootprintPollIntervalForTesting;
@property (nonatomic, copy) NSArray<NSNumber *> *memoryFootprintNotificationThresholds WK_API_AVAILABLE(macos(14.5));

@property (nonatomic) BOOL suspendsWebProcessesAggressivelyOnMemoryPressure WK_API_AVAILABLE(macos(WK_MAC_TBA));

@end

NS_ASSUME_NONNULL_END
