/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/*! @constant WKWebsiteDataTypeFetchCache On-disk Fetch caches. */
WK_EXTERN NSString * const WKWebsiteDataTypeFetchCache WK_API_AVAILABLE(macos(10.13.4), ios(11.3));

/*! @constant WKWebsiteDataTypeDiskCache On-disk caches. */
WK_EXTERN NSString * const WKWebsiteDataTypeDiskCache WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @constant WKWebsiteDataTypeMemoryCache In-memory caches. */
WK_EXTERN NSString * const WKWebsiteDataTypeMemoryCache WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @constant WKWebsiteDataTypeOfflineWebApplicationCache HTML offline web application caches. */
WK_EXTERN NSString * const WKWebsiteDataTypeOfflineWebApplicationCache WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @constant WKWebsiteDataTypeCookies Cookies. */
WK_EXTERN NSString * const WKWebsiteDataTypeCookies WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @constant WKWebsiteDataTypeSessionStorage HTML session storage. */
WK_EXTERN NSString * const WKWebsiteDataTypeSessionStorage WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @constant WKWebsiteDataTypeLocalStorage HTML local storage. */
WK_EXTERN NSString * const WKWebsiteDataTypeLocalStorage WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @constant WKWebsiteDataTypeWebSQLDatabases WebSQL databases. */
WK_EXTERN NSString * const WKWebsiteDataTypeWebSQLDatabases WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @constant WKWebsiteDataTypeIndexedDBDatabases IndexedDB databases. */
WK_EXTERN NSString * const WKWebsiteDataTypeIndexedDBDatabases WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @constant WKWebsiteDataTypeServiceWorkerRegistrations Service worker registrations. */
WK_EXTERN NSString * const WKWebsiteDataTypeServiceWorkerRegistrations WK_API_AVAILABLE(macos(10.13.4), ios(11.3));

/*! @constant WKWebsiteDataTypeFileSystem File system storage. */
WK_EXTERN NSString * const WKWebsiteDataTypeFileSystem WK_API_AVAILABLE(macos(13.0), ios(16.0));

/*! @constant WKWebsiteDataTypeSearchFieldRecentSearches Search field history. */
WK_EXTERN NSString * const WKWebsiteDataTypeSearchFieldRecentSearches WK_API_AVAILABLE(macos(14.0), ios(17.0));

/*! @constant WKWebsiteDataTypeMediaKeys MediaKeys storage */
WK_EXTERN NSString * const WKWebsiteDataTypeMediaKeys WK_API_AVAILABLE(macos(14.0), ios(17.0));

/*! @constant WKWebsiteDataTypeHashSalt Hash salt for deviceId */
WK_EXTERN NSString * const WKWebsiteDataTypeHashSalt WK_API_AVAILABLE(macos(14.0), ios(17.0));

/*! A WKWebsiteDataRecord represents website data, grouped by domain name using the public suffix list. */
WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(10.11), ios(9.0))
@interface WKWebsiteDataRecord : NSObject

/*! @abstract The display name for the data record. This is usually the domain name. */
@property (nonatomic, readonly, copy) NSString *displayName;

/*! @abstract The various types of website data that exist for this data record. */
@property (nonatomic, readonly, copy) NSSet<NSString *> *dataTypes;

@end

NS_ASSUME_NONNULL_END
