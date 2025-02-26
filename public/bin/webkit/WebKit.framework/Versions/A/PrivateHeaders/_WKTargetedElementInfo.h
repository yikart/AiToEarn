/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#import <WebKit/_WKRectEdge.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, _WKTargetedElementPosition) {
    _WKTargetedElementPositionStatic,
    _WKTargetedElementPositionRelative,
    _WKTargetedElementPositionAbsolute,
    _WKTargetedElementPositionSticky,
    _WKTargetedElementPositionFixed
} WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

@class _WKFrameTreeNode;

WK_CLASS_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0))
@interface _WKTargetedElementInfo : NSObject

@property (nonatomic, readonly) _WKTargetedElementPosition positionType;
@property (nonatomic, readonly) CGRect boundsInWebView; // In WKWebView's coordinate space.
@property (nonatomic, readonly) CGRect boundsInClientCoordinates;
@property (nonatomic, readonly, getter=isNearbyTarget) BOOL nearbyTarget;
@property (nonatomic, readonly, getter=isPseudoElement) BOOL pseudoElement;
@property (nonatomic, readonly, getter=isInShadowTree) BOOL inShadowTree;
@property (nonatomic, readonly, getter=isInVisibilityAdjustmentSubtree) BOOL inVisibilityAdjustmentSubtree;
@property (nonatomic, readonly) BOOL hasLargeReplacedDescendant;
@property (nonatomic, readonly) BOOL hasAudibleMedia;
@property (nonatomic, readonly) NSSet<NSURL *> *mediaAndLinkURLs;

@property (nonatomic, readonly, copy) NSArray<NSString *> *selectors;
@property (nonatomic, readonly, copy) NSArray<NSArray<NSString *> *> *selectorsIncludingShadowHosts;
@property (nonatomic, readonly, copy) NSString *renderedText;
@property (nonatomic, readonly, copy) NSString *searchableText;
@property (nonatomic, readonly, copy) NSString *screenReaderText;
@property (nonatomic, readonly) _WKRectEdge offsetEdges;

// In root view coordinates. To be deprecated and removed, once clients adopt the more explicit bounds properties above.
@property (nonatomic, readonly) CGRect bounds;

- (BOOL)isSameElement:(_WKTargetedElementInfo *)other;

- (void)getChildFrames:(void(^)(NSArray<_WKFrameTreeNode *> *))completionHandler;
- (void)takeSnapshotWithCompletionHandler:(void(^)(CGImageRef))completionHandler;

@end

NS_ASSUME_NONNULL_END
