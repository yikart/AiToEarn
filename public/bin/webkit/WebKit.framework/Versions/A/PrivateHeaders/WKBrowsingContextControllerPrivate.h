/*
 * Copyright (C) 2011 Apple Inc. All rights reserved.
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

#import <WebKit/WKBrowsingContextController.h>

#import <WebKit/WKBase.h>

typedef NS_ENUM(NSUInteger, WKBrowsingContextPaginationMode) {
    WKPaginationModeUnpaginated,
    WKPaginationModeLeftToRight,
    WKPaginationModeRightToLeft,
    WKPaginationModeTopToBottom,
    WKPaginationModeBottomToTop,
};

@class WKBrowsingContextHandle;
@class _WKRemoteObjectRegistry;

@interface WKBrowsingContextController (Private)

@property (readonly) WKPageRef _pageRef;

@property (readonly) BOOL hasOnlySecureContent;

@property WKBrowsingContextPaginationMode paginationMode;

// Whether the column-break-{before,after} properties are respected instead of the
// page-break-{before,after} properties.
@property BOOL paginationBehavesLikeColumns;

// Set to 0 to have the page length equal the view length.
@property CGFloat pageLength;
@property CGFloat gapBetweenPages;

// Whether or not to enable a line grid by default on the paginated content.
@property BOOL paginationLineGridEnabled;

@property (readonly) NSUInteger pageCount;

@property (nonatomic, readonly) WKBrowsingContextHandle *handle;

@property (nonatomic, readonly) _WKRemoteObjectRegistry *_remoteObjectRegistry;

@property (nonatomic, readonly) pid_t processIdentifier;

@end
