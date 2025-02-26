/*
 * Copyright (C) 2004, 2005 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#import <Foundation/Foundation.h>
#import <WebKitLegacy/WebKitAvailability.h>

@class WebArchivePrivate;
@class WebResource;

/*!
    @const WebArchivePboardType
    @abstract The pasteboard type constant used when adding or accessing a WebArchive on the pasteboard.
*/
extern NSString *WebArchivePboardType WEBKIT_DEPRECATED_MAC(10_3, 10_14);

/*!
    @class WebArchive
    @discussion WebArchive represents a main resource as well as all the subresources and subframes associated with the main resource.
    The main resource can be an entire web page, a portion of a web page, or some other kind of data such as an image.
    This class can be used for saving standalone web pages, representing portions of a web page on the pasteboard, or any other
    application where one class is needed to represent rich web content. 
*/
WEBKIT_CLASS_DEPRECATED_MAC(10_3, 10_14)
@interface WebArchive : NSObject <NSCoding, NSCopying>
{
@package
    WebArchivePrivate *_private;
}

/*!
    @method initWithMainResource:subresources:subframeArchives:
    @abstract The initializer for WebArchive.
    @param mainResource The main resource of the archive.
    @param subresources The subresources of the archive (can be nil).
    @param subframeArchives The archives representing the subframes of the archive (can be nil).
    @result An initialized WebArchive.
*/
- (instancetype)initWithMainResource:(WebResource *)mainResource subresources:(NSArray *)subresources subframeArchives:(NSArray *)subframeArchives;

/*!
    @method initWithData:
    @abstract The initializer for creating a WebArchive from data.
    @param data The data representing the archive. This can be obtained using WebArchive's data method.
    @result An initialized WebArchive.
*/
- (instancetype)initWithData:(NSData *)data;

/*!
    @property mainResource
    @abstract The main resource of the archive.
*/
@property (nonatomic, readonly, strong) WebResource *mainResource;

/*!
    @property subresources
    @abstract The subresource of the archive (can be nil).
*/
@property (nonatomic, readonly, copy) NSArray *subresources;

/*!
    @property subframeArchives
    @abstract The archives representing the subframes of the archive (can be nil).
*/
@property (nonatomic, readonly, copy) NSArray *subframeArchives;

/*!
    @property data
    @abstract The data representation of the archive.
    @discussion The data returned by this method can be used to save a web archive to a file or to place a web archive on the pasteboard
    using WebArchivePboardType. To create a WebArchive using the returned data, call initWithData:.
*/
@property (nonatomic, readonly, copy) NSData *data;

@end
