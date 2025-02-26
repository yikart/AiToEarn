/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#import <CoreGraphics/CGGeometry.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(10.13), ios(11.0))
@interface WKSnapshotConfiguration : NSObject <NSCopying>

/*! @abstract The rect to snapshot in view coordinates.
 @discussion This rect should be contained within WKWebView's bounds. If the rect is set to the 
 null rect, the view's bounds will be used. The initial value is the null rect.
 */
@property (nonatomic) CGRect rect;

/*! @abstract Specify a custom width to control the size of image you get back. The height will be 
 computed to maintain the aspect ratio established by rect.
 @discussion snapshotWidth represents the width in points. If the snapshotWidth is nil, rect's
 width will be used.
 */
@property (nullable, nonatomic, copy) NSNumber *snapshotWidth;

/*! @abstract A Boolean value that specifies whether the snapshot should be taken after recent
 changes have been incorporated. The value NO will capture the screen in its current state,
 which might not include recent changes.
 @discussion The default value is YES.
 */
@property (nonatomic) BOOL afterScreenUpdates WK_API_AVAILABLE(macos(10.15), ios(13.0));

@end

NS_ASSUME_NONNULL_END
