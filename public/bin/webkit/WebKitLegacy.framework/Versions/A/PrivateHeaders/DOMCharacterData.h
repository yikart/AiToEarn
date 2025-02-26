/*
 * Copyright (C) 2004-2016 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#import <WebKitLegacy/DOMNode.h>

@class NSString;

WEBKIT_CLASS_DEPRECATED_MAC(10_4, 10_14)
@interface DOMCharacterData : DOMNode
@property (copy) NSString *data;
@property (readonly) unsigned length;

- (NSString *)substringData:(unsigned)offset length:(unsigned)length WEBKIT_AVAILABLE_MAC(10_5);
- (void)appendData:(NSString *)data;
- (void)insertData:(unsigned)offset data:(NSString *)data WEBKIT_AVAILABLE_MAC(10_5);
- (void)deleteData:(unsigned)offset length:(unsigned)length WEBKIT_AVAILABLE_MAC(10_5);
- (void)replaceData:(unsigned)offset length:(unsigned)length data:(NSString *)data WEBKIT_AVAILABLE_MAC(10_5);
@end

@interface DOMCharacterData (DOMCharacterDataDeprecated)
- (NSString *)substringData:(unsigned)offset :(unsigned)length WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (void)insertData:(unsigned)offset :(NSString *)data WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (void)deleteData:(unsigned)offset :(unsigned)length WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (void)replaceData:(unsigned)offset :(unsigned)length :(NSString *)data WEBKIT_DEPRECATED_MAC(10_4, 10_5);
@end
