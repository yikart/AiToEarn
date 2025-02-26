/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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
#import <WebKit/_WKRenderingProgressEvents.h>
#import <WebKit/_WKSameDocumentNavigationType.h>

@class WKWebProcessPlugInBrowserContextController;
@class WKWebProcessPlugInFrame;
@class WKWebProcessPlugInScriptWorld;

@protocol WKWebProcessPlugInLoadDelegate <NSObject>
@optional

// Frame loading

- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller didStartProvisionalLoadForFrame:(WKWebProcessPlugInFrame *)frame;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller didReceiveServerRedirectForProvisionalLoadForFrame:(WKWebProcessPlugInFrame *)frame;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller didCommitLoadForFrame:(WKWebProcessPlugInFrame *)frame;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller didFinishDocumentLoadForFrame:(WKWebProcessPlugInFrame *)frame;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller didFailProvisionalLoadWithErrorForFrame:(WKWebProcessPlugInFrame *)frame error:(NSError *)error;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller didFailLoadWithErrorForFrame:(WKWebProcessPlugInFrame *)frame error:(NSError *)error;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller didFinishLoadForFrame:(WKWebProcessPlugInFrame *)frame;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller didSameDocumentNavigation:(_WKSameDocumentNavigationType)navigationType forFrame:(WKWebProcessPlugInFrame *)frame;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller didClearWindowObjectForFrame:(WKWebProcessPlugInFrame *)frame inScriptWorld:(WKWebProcessPlugInScriptWorld *)scriptWorld;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller globalObjectIsAvailableForFrame:(WKWebProcessPlugInFrame *)frame inScriptWorld:(WKWebProcessPlugInScriptWorld *)scriptWorld;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller serviceWorkerGlobalObjectIsAvailableForFrame:(WKWebProcessPlugInFrame *)frame inScriptWorld:(WKWebProcessPlugInScriptWorld *)scriptWorld;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller willInjectUserScriptForFrame:(WKWebProcessPlugInFrame *)frame inScriptWorld:(WKWebProcessPlugInScriptWorld *)scriptWorld;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller didRemoveFrameFromHierarchy:(WKWebProcessPlugInFrame *)frame;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller didHandleOnloadEventsForFrame:(WKWebProcessPlugInFrame *)frame;

// Layout
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller didLayoutForFrame:(WKWebProcessPlugInFrame *)frame;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller renderingProgressDidChange:(_WKRenderingProgressEvents)events;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController*)controller didFirstVisuallyNonEmptyLayoutForFrame:(WKWebProcessPlugInFrame *)frame;
- (_WKRenderingProgressEvents)webProcessPlugInBrowserContextControllerRenderingProgressEvents:(WKWebProcessPlugInBrowserContextController *)controller;

// Resource loading

- (NSURLRequest *)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller frame:(WKWebProcessPlugInFrame *)frame willSendRequestForResource:(uint64_t)resource request:(NSURLRequest *)request redirectResponse:(NSURLResponse *)redirectResponse;
- (NSURLRequest *)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller frame:(WKWebProcessPlugInFrame *)frame willSendRequest:(NSURLRequest *)request redirectResponse:(NSURLResponse *)redirectResponse;

- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller frame:(WKWebProcessPlugInFrame *)frame didInitiateLoadForResource:(uint64_t)resource request:(NSURLRequest *)request pageIsProvisionallyLoading:(BOOL)pageIsProvisionallyLoading;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller frame:(WKWebProcessPlugInFrame *)frame didInitiateLoadForResource:(uint64_t)resource request:(NSURLRequest *)request;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller frame:(WKWebProcessPlugInFrame *)frame didReceiveResponse:(NSURLResponse *)response forResource:(uint64_t)resource;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller frame:(WKWebProcessPlugInFrame *)frame didFinishLoadForResource:(uint64_t)resource;
- (void)webProcessPlugInBrowserContextController:(WKWebProcessPlugInBrowserContextController *)controller frame:(WKWebProcessPlugInFrame *)frame didFailLoadForResource:(uint64_t)resource error:(NSError *)error;

@end
