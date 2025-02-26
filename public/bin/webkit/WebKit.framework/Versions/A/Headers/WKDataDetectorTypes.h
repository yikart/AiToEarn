/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#if TARGET_OS_IPHONE

/*! @enum WKDataDetectorTypes
 @abstract The type of data detected.
 @constant WKDataDetectorTypeNone No detection is performed.
 @constant WKDataDetectorTypePhoneNumber Phone numbers are detected and turned into links.
 @constant WKDataDetectorTypeLink URLs in text are detected and turned into links.
 @constant WKDataDetectorTypeAddress Addresses are detected and turned into links.
 @constant WKDataDetectorTypeCalendarEvent Dates and times that are in the future are detected and turned into links.
 @constant WKDataDetectorTypeAll All of the above data types are turned into links when detected. Choosing this value will
 automatically include any new detection type that is added.
 */
typedef NS_OPTIONS(NSUInteger, WKDataDetectorTypes) {
    WKDataDetectorTypeNone = 0,
    WKDataDetectorTypePhoneNumber = 1 << 0,
    WKDataDetectorTypeLink = 1 << 1,
    WKDataDetectorTypeAddress = 1 << 2,
    WKDataDetectorTypeCalendarEvent = 1 << 3,
    WKDataDetectorTypeTrackingNumber = 1 << 4,
    WKDataDetectorTypeFlightNumber = 1 << 5,
    WKDataDetectorTypeLookupSuggestion = 1 << 6,
    WKDataDetectorTypeAll = NSUIntegerMax,

    WKDataDetectorTypeSpotlightSuggestion WK_API_DEPRECATED_WITH_REPLACEMENT("WKDataDetectorTypeLookupSuggestion", ios(10.0, 10.0)) = WKDataDetectorTypeLookupSuggestion,
} WK_API_AVAILABLE(ios(10.0));

#endif

NS_ASSUME_NONNULL_END
