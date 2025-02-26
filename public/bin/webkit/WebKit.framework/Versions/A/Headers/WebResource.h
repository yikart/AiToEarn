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

@class WebResourcePrivate;


/*!
    @class WebResource
    @discussion A WebResource represents a fully downloaded URL. 
    It includes the data of the resource as well as the metadata associated with the resource.
*/
@interface WebResource : NSObject <NSCoding, NSCopying>
{
@package
    WebResourcePrivate *_private;
}

/*!
    @method initWithData:URL:MIMEType:textEncodingName:frameName
    @abstract The initializer for WebResource.
    @param data The data of the resource.
    @param URL The URL of the resource.
    @param MIMEType The MIME type of the resource.
    @param textEncodingName The text encoding name of the resource (can be nil).
    @param frameName The frame name of the resource if the resource represents the contents of an entire HTML frame (can be nil).
    @result An initialized WebResource.
*/
- (instancetype)initWithData:(NSData *)data URL:(NSURL *)URL MIMEType:(NSString *)MIMEType textEncodingName:(NSString *)textEncodingName frameName:(NSString *)frameName;

/*!
    @property data
    @abstract The data of the resource.
*/
@property (nonatomic, readonly, copy) NSData *data;

/*!
    @property URL
    @abstract The URL of the resource.
*/
@property (nonatomic, readonly, strong) NSURL *URL;

/*!
    @property MIMEType
    @abstract The MIME type of the resource.
*/
@property (nonatomic, readonly, copy) NSString *MIMEType;

/*!
    @property textEncodingName
    @abstract The text encoding name of the resource (can be nil).
*/
@property (nonatomic, readonly, copy) NSString *textEncodingName;

/*!
    @property frameName
    @abstract The frame name of the resource if the resource represents the contents of an entire HTML frame (can be nil).
*/
@property (nonatomic, readonly, copy) NSString *frameName;

@end
