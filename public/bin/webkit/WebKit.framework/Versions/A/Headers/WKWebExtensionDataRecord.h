/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#import <WebKit/WKWebExtensionDataType.h>

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

/*! @abstract Indicates a ``WKWebExtensionDataRecord`` error. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_EXTERN NSErrorDomain const WKWebExtensionDataRecordErrorDomain NS_SWIFT_NAME(WKWebExtensionDataRecord.errorDomain) NS_SWIFT_NONISOLATED;

/*!
 @abstract Constants used by ``NSError`` to indicate errors in the ``WKWebExtensionDataRecord`` domain.
 @constant WKWebExtensionDataRecordErrorUnknown  Indicates that an unknown error occurred.
 @constant WKWebExtensionDataRecordErrorLocalStorageFailed  Indicates a failure occurred when either deleting or calculating local storage.
 @constant WKWebExtensionDataRecordErrorSessionStorageFailed  Indicates a failure occurred when either deleting or calculating session storage.
 @constant WKWebExtensionDataRecordErrorSynchronizedStorageFailed  Indicates a failure occurred when either deleting or calculating synchronized storage.
 */
typedef NS_ERROR_ENUM(WKWebExtensionDataRecordErrorDomain, WKWebExtensionDataRecordError) {
    WKWebExtensionDataRecordErrorUnknown = 1,
    WKWebExtensionDataRecordErrorLocalStorageFailed,
    WKWebExtensionDataRecordErrorSessionStorageFailed,
    WKWebExtensionDataRecordErrorSynchronizedStorageFailed,
} NS_SWIFT_NAME(WKWebExtensionDataRecord.Error) WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*!
 @abstract A ``WKWebExtensionDataRecord`` object represents a record of stored data for a specific web extension context.
 @discussion Contains properties and methods to query the data types and sizes.
*/
WK_CLASS_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_SWIFT_UI_ACTOR NS_SWIFT_NAME(WKWebExtension.DataRecord)
@interface WKWebExtensionDataRecord : NSObject

+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;

/*! @abstract The display name for the web extension to which this data record belongs. */
@property (nonatomic, readonly, copy) NSString *displayName;

/*! @abstract Unique identifier for the web extension context to which this data record belongs. */
@property (nonatomic, readonly, copy) NSString *uniqueIdentifier;

/*! @abstract The set of data types contained in this data record. */
@property (nonatomic, readonly, copy) NSSet<WKWebExtensionDataType> *containedDataTypes;

/*! @abstract An array of errors that may have occurred when either calculating or deleting storage. */
@property (nonatomic, readonly, copy) NSArray<NSError *> *errors;

/*!
 @abstract The total size in bytes of all data types contained in this data record.
 @seealso sizeInBytesOfTypes:
 */
@property (nonatomic, readonly) NSUInteger totalSizeInBytes;

/*!
 @abstract Retrieves the size in bytes of the specific data types in this data record.
 @param dataTypes The set of data types to measure the size for.
 @return The total size of the specified data types.
 @seealso totalSizeInBytes
 */
- (NSUInteger)sizeInBytesOfTypes:(NSSet<WKWebExtensionDataType> *)dataTypes NS_SWIFT_NAME(sizeInBytes(ofTypes:));

@end

WK_HEADER_AUDIT_END(nullability, sendability)
