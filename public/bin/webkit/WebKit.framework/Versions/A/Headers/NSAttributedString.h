/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if TARGET_OS_IPHONE
#import <UIKit/NSAttributedString.h>
#else
#import <AppKit/NSAttributedString.h>
#endif

@class NSAttributedString;

NS_ASSUME_NONNULL_BEGIN

/*!
 @abstract Indicates which local files WebKit can access when loading content.
 @discussion If NSReadAccessURLDocumentOption references a single file, only that file may be
 loaded by WebKit. If NSReadAccessURLDocumentOption references a directory, files inside that
 directory may be loaded by WebKit.
*/
WK_EXTERN NSAttributedStringDocumentReadingOptionKey const NSReadAccessURLDocumentOption
    NS_SWIFT_NAME(readAccessURL) WK_API_AVAILABLE(macos(10.15), ios(13.0));

/*!
 @abstract Type definition for the completion handler block used to get asynchronous attributed strings.
 @discussion The completion handler block is passed the attributed string result along with any
 document-level attributes, like NSBackgroundColorDocumentAttribute, or an error. An implementation
 of this block type must expect to be called asynchronously when passed to HTML loading methods.
*/
typedef void (^NSAttributedStringCompletionHandler)(NSAttributedString * _Nullable, NSDictionary<NSAttributedStringDocumentAttributeKey, id> * _Nullable, NSError * _Nullable)
    NS_SWIFT_NAME(NSAttributedString.CompletionHandler) WK_API_AVAILABLE(macos(10.15), ios(13.0));

/*!
 @discussion Extension of @link //apple_ref/occ/NSAttributedString NSAttributedString @/link to
 create attributed strings from HTML content using WebKit.
*/
@interface NSAttributedString (NSAttributedStringWebKitAdditions)

/*!
 @abstract Loads an HTML URL request and converts the contents into an attributed string.
 @param request The request specifying the URL to load.
 @param options Document attributes for interpreting the document contents.
 NSTextSizeMultiplierDocumentOption and NSTimeoutDocumentOption are supported option keys.
 @param completionHandler A block to invoke when the operation completes or fails.
 @discussion The completionHandler is passed the attributed string result along with any
 document-level attributes, or an error.
*/
+ (void)loadFromHTMLWithRequest:(NSURLRequest *)request options:(NSDictionary<NSAttributedStringDocumentReadingOptionKey, id> *)options completionHandler:(NSAttributedStringCompletionHandler)completionHandler
    NS_SWIFT_NAME(loadFromHTML(request:options:completionHandler:)) WK_SWIFT_ASYNC_NAME(fromHTML(request:options:)) WK_API_AVAILABLE(macos(10.15), ios(13.0));

/*!
 @abstract Converts a local HTML file into an attributed string.
 @param fileURL The file URL to load.
 @param options Document attributes for interpreting the document contents.
 NSTextSizeMultiplierDocumentOption, NSTimeoutDocumentOption and NSReadAccessURLDocumentOption
 are supported option keys.
 @param completionHandler A block to invoke when the operation completes or fails.
 @discussion The completionHandler is passed the attributed string result along with any
 document-level attributes, or an error. If NSReadAccessURLDocumentOption references a single file,
 only that file may be loaded by WebKit. If NSReadAccessURLDocumentOption references a directory,
 files inside that directory may be loaded by WebKit.
*/
+ (void)loadFromHTMLWithFileURL:(NSURL *)fileURL options:(NSDictionary<NSAttributedStringDocumentReadingOptionKey, id> *)options completionHandler:(NSAttributedStringCompletionHandler)completionHandler
    NS_SWIFT_NAME(loadFromHTML(fileURL:options:completionHandler:)) WK_SWIFT_ASYNC_NAME(fromHTML(fileURL:options:)) WK_API_AVAILABLE(macos(10.15), ios(13.0));

/*!
 @abstract Converts an HTML string into an attributed string.
 @param string The HTML string to use as the contents.
 @param options Document attributes for interpreting the document contents.
 NSTextSizeMultiplierDocumentOption, NSTimeoutDocumentOption and NSBaseURLDocumentOption
 are supported option keys.
 @param completionHandler A block to invoke when the operation completes or fails.
 @discussion The completionHandler is passed the attributed string result along with any
 document-level attributes, or an error. NSBaseURLDocumentOption is used to resolve relative URLs
 within the document.
*/
+ (void)loadFromHTMLWithString:(NSString *)string options:(NSDictionary<NSAttributedStringDocumentReadingOptionKey, id> *)options completionHandler:(NSAttributedStringCompletionHandler)completionHandler
    NS_SWIFT_NAME(loadFromHTML(string:options:completionHandler:)) WK_SWIFT_ASYNC_NAME(fromHTML(_:options:)) WK_API_AVAILABLE(macos(10.15), ios(13.0));

/*!
 @abstract Converts HTML data into an attributed string.
 @param data The HTML data to use as the contents.
 @param options Document attributes for interpreting the document contents.
 NSTextSizeMultiplierDocumentOption, NSTimeoutDocumentOption, NSTextEncodingNameDocumentOption,
 and NSCharacterEncodingDocumentOption are supported option keys.
 @param completionHandler A block to invoke when the operation completes or fails.
 @discussion The completionHandler is passed the attributed string result along with any
 document-level attributes, or an error. If neither NSTextEncodingNameDocumentOption nor
 NSCharacterEncodingDocumentOption is supplied, a best-guess encoding is used.
*/
+ (void)loadFromHTMLWithData:(NSData *)data options:(NSDictionary<NSAttributedStringDocumentReadingOptionKey, id> *)options completionHandler:(NSAttributedStringCompletionHandler)completionHandler
    NS_SWIFT_NAME(loadFromHTML(data:options:completionHandler:)) WK_SWIFT_ASYNC_NAME(fromHTML(_:options:)) WK_API_AVAILABLE(macos(10.15), ios(13.0));

@end

NS_ASSUME_NONNULL_END
