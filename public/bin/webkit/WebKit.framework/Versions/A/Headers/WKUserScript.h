/*
 * Copyright (C) 2014-2020 Apple Inc. All rights reserved.
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
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class WKContentWorld;

/*! @enum WKUserScriptInjectionTime
 @abstract when a user script should be injected into a webpage.
 @constant WKUserScriptInjectionTimeAtDocumentStart    Inject the script after the document element has been created, but before any other content has been loaded.
 @constant WKUserScriptInjectionTimeAtDocumentEnd      Inject the script after the document has finished loading, but before any subresources may have finished loading.
 */
typedef NS_ENUM(NSInteger, WKUserScriptInjectionTime) {
    WKUserScriptInjectionTimeAtDocumentStart,
    WKUserScriptInjectionTimeAtDocumentEnd
} WK_API_AVAILABLE(macos(10.10), ios(8.0));

/*! A @link WKUserScript @/link object represents a script that can be injected into webpages.
 */
WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface WKUserScript : NSObject <NSCopying>

/* @abstract The script source code. */
@property (nonatomic, readonly, copy) NSString *source;

/* @abstract When the script should be injected. */
@property (nonatomic, readonly) WKUserScriptInjectionTime injectionTime;

/* @abstract Whether the script should be injected into all frames or just the main frame. */
@property (nonatomic, readonly, getter=isForMainFrameOnly) BOOL forMainFrameOnly;

/*! @abstract Returns an initialized user script that can be added to a @link WKUserContentController @/link.
 @param source The script source.
 @param injectionTime When the script should be injected.
 @param forMainFrameOnly Whether the script should be injected into all frames or just the main frame.
 @discussion Calling this method is the same as calling `initWithSource:injectionTime:forMainFrameOnly:inContentWorld:` with a `contentWorld` value of `WKContentWorld.pageWorld`
 */
- (instancetype)initWithSource:(NSString *)source injectionTime:(WKUserScriptInjectionTime)injectionTime forMainFrameOnly:(BOOL)forMainFrameOnly;

/*! @abstract Returns an initialized user script that can be added to a @link WKUserContentController @/link.
 @param source The script source.
 @param injectionTime When the script should be injected.
 @param forMainFrameOnly Whether the script should be injected into all frames or just the main frame.
 @param contentWorld The WKContentWorld in which to inject the script.
 */
- (instancetype)initWithSource:(NSString *)source injectionTime:(WKUserScriptInjectionTime)injectionTime forMainFrameOnly:(BOOL)forMainFrameOnly inContentWorld:(WKContentWorld *)contentWorld WK_API_AVAILABLE(macos(11.0), ios(14.0));

@end

NS_ASSUME_NONNULL_END
