/*
 * Copyright (C) 2014-2017 Apple Inc. All rights reserved.
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

#import <WebKit/WKWebsiteDataRecord.h>

#if __has_include(<Network/proxy_config.h>)
#import <Network/Network.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@class WKHTTPCookieStore;

/*! A WKWebsiteDataStore represents various types of data that a website might
 make use of. This includes cookies, disk and memory caches, and persistent data such as WebSQL,
 IndexedDB databases, and local storage.
 */
WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(10.11), ios(9.0))
@interface WKWebsiteDataStore : NSObject <NSSecureCoding>

/* @abstract Returns the default data store. */
+ (WKWebsiteDataStore *)defaultDataStore;

/** @abstract Returns a new non-persistent data store.
 @discussion If a WKWebView is associated with a non-persistent data store, no data will
 be written to the file system. This is useful for implementing "private browsing" in a web view.
*/
+ (WKWebsiteDataStore *)nonPersistentDataStore;

- (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;

/*! @abstract Whether the data store is persistent or not. */
@property (nonatomic, readonly, getter=isPersistent) BOOL persistent;

/*! @abstract Returns a set of all available website data types. */
+ (NSSet<NSString *> *)allWebsiteDataTypes;

/*! @abstract Fetches data records containing the given website data types.
  @param dataTypes The website data types to fetch records for.
  @param completionHandler A block to invoke when the data records have been fetched.
*/
- (void)fetchDataRecordsOfTypes:(NSSet<NSString *> *)dataTypes completionHandler:(WK_SWIFT_UI_ACTOR void (^)(NSArray<WKWebsiteDataRecord *> *))completionHandler WK_SWIFT_ASYNC_NAME(dataRecords(ofTypes:));

/*! @abstract Removes website data of the given types for the given data records.
 @param dataTypes The website data types that should be removed.
 @param dataRecords The website data records to delete website data for.
 @param completionHandler A block to invoke when the website data for the records has been removed.
*/
- (void)removeDataOfTypes:(NSSet<NSString *> *)dataTypes forDataRecords:(NSArray<WKWebsiteDataRecord *> *)dataRecords completionHandler:(WK_SWIFT_UI_ACTOR void (^)(void))completionHandler;

/*! @abstract Removes all website data of the given types that has been modified since the given date.
 @param dataTypes The website data types that should be removed.
 @param date A date. All website data modified after this date will be removed.
 @param completionHandler A block to invoke when the website data has been removed.
*/
- (void)removeDataOfTypes:(NSSet<NSString *> *)dataTypes modifiedSince:(NSDate *)date completionHandler:(WK_SWIFT_UI_ACTOR void (^)(void))completionHandler;

/*! @abstract Returns the cookie store representing HTTP cookies in this website data store. */
@property (nonatomic, readonly) WKHTTPCookieStore *httpCookieStore WK_API_AVAILABLE(macos(10.13), ios(11.0));

/*! @abstract Get identifier for a data store.
 @discussion Returns nil for default and non-persistent data store .
 */
@property (nonatomic, readonly, nullable) NSUUID *identifier WK_API_AVAILABLE(macos(14.0), ios(17.0));

/*! @abstract Get a persistent data store.
 @param identifier An identifier that is used to uniquely identify the data store.
 @discussion If a data store with this identifier does not exist yet, it will be created. Throws exception if identifier
 is 0.
*/
+ (WKWebsiteDataStore *)dataStoreForIdentifier:(NSUUID *)identifier WK_API_AVAILABLE(macos(14.0), ios(17.0));

/*! @abstract Delete a persistent data store.
 @param identifier An identifier that is used to uniquely identify the data store.
 @param completionHandler A block to invoke with optional error when the operation completes.
 @discussion This should be called when the data store is not used any more. Returns error if removal fails
 to complete. WKWebView using the data store must be released before removal.
*/
+ (void)removeDataStoreForIdentifier:(NSUUID *)identifier completionHandler:(WK_SWIFT_UI_ACTOR void(^)(NSError * _Nullable))completionHandler WK_API_AVAILABLE(macos(14.0), ios(17.0));

/*! @abstract Fetch all data stores identifiers.
 @param completionHandler A block to invoke with an array of identifiers when the operation completes.
 @discussion Default or non-persistent data store do not have an identifier.
*/
+ (void)fetchAllDataStoreIdentifiers:(WK_SWIFT_UI_ACTOR void(^)(NSArray<NSUUID *> *))completionHandler WK_SWIFT_ASYNC_NAME(getter:allDataStoreIdentifiers()) WK_API_AVAILABLE(macos(14.0), ios(17.0));

#if ((TARGET_OS_OSX && __MAC_OS_X_VERSION_MAX_ALLOWED >= 140000) \
    || ((TARGET_OS_IOS || TARGET_OS_MACCATALYST) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 170000) \
    || (TARGET_OS_WATCH && __WATCH_OS_VERSION_MAX_ALLOWED >= 100000) \
    || (TARGET_OS_TV && __TV_OS_VERSION_MAX_ALLOWED >= 170000) \
    || (defined(TARGET_OS_VISION) && TARGET_OS_VISION))
/*! @abstract Gets or sets the proxy configurations to be used to override networking in all WKWebViews that use this WKWebsiteDataStore.
 @discussion Changing the proxy configurations might interupt current networking operations in any WKWebView that use this WKWebsiteDataStore,
 so it is encouraged to finish setting the proxy configurations before starting any page loads.
*/
#if defined(OS_OBJECT_USE_OBJC) && OS_OBJECT_USE_OBJC
@property (nullable, nonatomic, copy) NSArray<nw_proxy_config_t> *proxyConfigurations NS_REFINED_FOR_SWIFT API_AVAILABLE(macos(14.0), ios(17.0));
#else
@property (nullable, nonatomic, copy) NSArray *proxyConfigurations NS_REFINED_FOR_SWIFT API_AVAILABLE(macos(14.0), ios(17.0));
#endif
#endif

- (uint64_t)sessionID;

@end

NS_ASSUME_NONNULL_END
