/*
 * Copyright (C) 2019 Microsoft Corporation.
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#import <WebKit/WKFoundation.h>
#import <WebKit/WKProcessPool.h>
#import <WebKit/WKWebsiteDataStore.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class WKWebView;

WK_CLASS_AVAILABLE(macos(10.14.0))
@interface _WKBrowserContext : NSObject
@property (nonatomic, strong) WKWebsiteDataStore *dataStore;
@property (nonatomic, strong) WKProcessPool *processPool;
@end

@protocol _WKBrowserInspectorDelegate <NSObject>
- (WKWebView *)createNewPage:(uint64_t)sessionID;
- (_WKBrowserContext *)createBrowserContext:(NSString *)proxyServer WithBypassList:(NSString *)proxyBypassList;
- (void)deleteBrowserContext:(uint64_t)sessionID;
- (void)quit;
@end

WK_CLASS_AVAILABLE(macos(10.14.0))
@interface _WKBrowserInspector : NSObject
+ (void)initializeRemoteInspectorPipe:(id<_WKBrowserInspectorDelegate>)delegate headless:(BOOL)headless;
@end


NS_ASSUME_NONNULL_END

