/*
 * Copyright (C) 2010-2020 Apple Inc. All rights reserved.
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

#if !TARGET_OS_IPHONE

#import <Cocoa/Cocoa.h>
#import <WebKit/WKDeclarationSpecifiers.h>

#if !defined(WK_UNUSED_INSTANCE_VARIABLE)
#define WK_UNUSED_INSTANCE_VARIABLE
#endif

@class WKBrowsingContextController;
@class WKProcessGroup;
@class WKViewData;

// FIXME: Remove this file once rdar://105559864 and rdar://105560420 and rdar://105560497 are complete.
// Note: rdar://105011969 tracks additional use of this file, but those are unused test utilities that are never built.
// Also, this stub needs to be kept as long as Ventura-based macOS versions are used for performance testing.

WK_CLASS_DEPRECATED_WITH_REPLACEMENT("WKWebView", macos(10.10, 10.14.4), ios(8.0, 12.2))
@interface WKView : NSView <NSTextInputClient> {
@private
    WKViewData *_data;
    WK_UNUSED_INSTANCE_VARIABLE unsigned _unused;
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
@property(readonly) WKBrowsingContextController *browsingContextController;
#pragma clang diagnostic pop

@property BOOL drawsBackground;
@property BOOL drawsTransparentBackground;

@end

#endif
