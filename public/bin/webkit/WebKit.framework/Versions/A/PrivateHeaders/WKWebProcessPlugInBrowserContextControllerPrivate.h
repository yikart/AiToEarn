/*
 * Copyright (C) 2012 Apple Inc. All rights reserved.
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

#import <WebKit/WKWebProcessPlugInBrowserContextController.h>

#import <WebKit/WKBase.h>

@class WKBrowsingContextHandle;
@class _WKRemoteObjectRegistry;
@protocol WKWebProcessPlugInEditingDelegate;
@protocol WKWebProcessPlugInFormDelegatePrivate;

@interface WKWebProcessPlugInBrowserContextController (WKPrivate)

@property (nonatomic, readonly) WKBundlePageRef _bundlePageRef;

@property (nonatomic, readonly) WKBrowsingContextHandle *handle;

@property (nonatomic, readonly) _WKRemoteObjectRegistry *_remoteObjectRegistry;

@property (weak, setter=_setFormDelegate:) id <WKWebProcessPlugInFormDelegatePrivate> _formDelegate;
@property (weak, setter=_setEditingDelegate:) id <WKWebProcessPlugInEditingDelegate> _editingDelegate WK_API_AVAILABLE(macos(10.12.4), ios(10.3));

@property (nonatomic, setter=_setDefersLoading:) BOOL _defersLoading WK_API_DEPRECATED("No longer supported", macos(10.10, 10.15), ios(8.0, 13.0));

@property (nonatomic, readonly) BOOL _usesNonPersistentWebsiteDataStore;

@property (nonatomic, readonly) NSString *_groupIdentifier WK_API_AVAILABLE(macos(12.0), ios(15.0));

+ (instancetype)lookUpBrowsingContextFromHandle:(WKBrowsingContextHandle *)handle;

@end
