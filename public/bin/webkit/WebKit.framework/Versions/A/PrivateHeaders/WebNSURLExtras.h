/*
 * Copyright (C) 2005-2021 Apple Inc. All rights reserved.
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

// FIXME: Consider renaming to _web_ from _webkit_ once identically-named methods are no longer present in Foundation.

@interface NSURL (WebNSURLExtras)

// Deprecated, as it ignores URL parsing errors.
// Please use the _webkit_URLWithUserTypedString instead.
+ (NSURL *)_web_URLWithUserTypedString:(NSString *)string;

// Return value of nil means error in URL parsing.
+ (NSURL *)_webkit_URLWithUserTypedString:(NSString *)string;

+ (NSURL *)_web_URLWithDataAsString:(NSString *)string;
+ (NSURL *)_web_URLWithDataAsString:(NSString *)string relativeToURL:(NSURL *)baseURL;

- (NSData *)_web_originalData;
- (NSString *)_web_originalDataAsString;
- (const char*)_web_URLCString;

- (NSString *)_web_hostString;

- (NSString *)_web_userVisibleString;

- (BOOL)_web_isEmpty;

- (NSURL *)_webkit_canonicalize;
- (NSURL *)_webkit_canonicalize_with_wtf;
- (NSURL *)_webkit_URLByRemovingFragment;
- (NSURL *)_web_URLByRemovingUserInfo;

- (BOOL)_webkit_isJavaScriptURL;
- (BOOL)_webkit_isFileURL;
- (NSString *)_webkit_scriptIfJavaScriptURL;

- (NSString *)_webkit_suggestedFilenameWithMIMEType:(NSString *)MIMEType;

- (NSURL *)_webkit_URLFromURLOrSchemelessFileURL;

@end

@interface NSString (WebNSURLExtras)

- (BOOL)_web_isUserVisibleURL;

// Deprecated as it ignores URL parsing errors.
// Please use _webkit_decodeHostName instead.
// Turns funny-looking ASCII form into Unicode, returns self if no decoding needed.
- (NSString *)_web_decodeHostName;

// Deprecated as it ignores URL parsing errors.
// Please use the _webkit_encodeHostName instead.
// Turns Unicode into funny-looking ASCII form, returns self if no encoding needed.
- (NSString *)_web_encodeHostName;

// Return value of nil means error in URL parsing.
- (NSString *)_webkit_decodeHostName;
- (NSString *)_webkit_encodeHostName;

- (BOOL)_webkit_isJavaScriptURL;
- (BOOL)_webkit_isFileURL;
- (BOOL)_webkit_looksLikeAbsoluteURL;
- (NSRange)_webkit_rangeOfURLScheme;
- (NSString *)_webkit_scriptIfJavaScriptURL;

@end
