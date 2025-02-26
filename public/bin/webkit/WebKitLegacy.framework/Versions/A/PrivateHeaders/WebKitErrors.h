/*
 * Copyright (C) 2003-2016 Apple Inc. All rights reserved.
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

#import <WebKitLegacy/WebKitAvailability.h>

@class NSString;

extern NSString *WebKitErrorDomain WEBKIT_DEPRECATED_MAC(10_3, 10_14);

extern NSString * const WebKitErrorMIMETypeKey WEBKIT_DEPRECATED_MAC(10_3, 10_14);
extern NSString * const WebKitErrorPlugInNameKey WEBKIT_DEPRECATED_MAC(10_3, 10_14);
extern NSString * const WebKitErrorPlugInPageURLStringKey WEBKIT_DEPRECATED_MAC(10_3, 10_14);

/*!
    @enum
    @abstract Policy errors
    @constant WebKitErrorCannotShowMIMEType
    @constant WebKitErrorCannotShowURL
    @constant WebKitErrorFrameLoadInterruptedByPolicyChange
*/
enum {
    WebKitErrorCannotShowMIMEType =                             100,
    WebKitErrorCannotShowURL =                                  101,
    WebKitErrorFrameLoadInterruptedByPolicyChange =             102,
} WEBKIT_ENUM_DEPRECATED_MAC(10_3, 10_14);

/*!
    @enum
    @abstract Plug-in and java errors
    @constant WebKitErrorCannotFindPlugIn
    @constant WebKitErrorCannotLoadPlugIn
    @constant WebKitErrorJavaUnavailable
    @constant WebKitErrorBlockedPlugInVersion
*/
enum {
    WebKitErrorCannotFindPlugIn =                               200,
    WebKitErrorCannotLoadPlugIn =                               201,
    WebKitErrorJavaUnavailable =                                202,
    WebKitErrorBlockedPlugInVersion =                           203,
} WEBKIT_ENUM_DEPRECATED_MAC(10_3, 10_14);
