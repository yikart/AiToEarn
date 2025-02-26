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

#import <WebKit/WKFoundation.h>

#import <WebKit/WKBackForwardListItem.h>

/*! @abstract A WKBackForwardList object is a list of webpages previously
 visited in a web view that can be reached by going back or forward.
 */
NS_ASSUME_NONNULL_BEGIN

WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface WKBackForwardList : NSObject

/*! @abstract The current item.
 */
@property (nullable, nonatomic, readonly, strong) WKBackForwardListItem *currentItem;

/*! @abstract The item immediately preceding the current item, or nil
if there isn't one.
 */
@property (nullable, nonatomic, readonly, strong) WKBackForwardListItem *backItem;

/*! @abstract The item immediately following the current item, or nil
if there isn't one.
 */
@property (nullable, nonatomic, readonly, strong) WKBackForwardListItem *forwardItem;

/*! @abstract Returns the item at a specified distance from the current
 item.
 @param index Index of the desired list item relative to the current item:
 0 for the current item, -1 for the immediately preceding item, 1 for the
 immediately following item, and so on.
 @result The item at the specified distance from the current item, or nil
 if the index parameter exceeds the limits of the list.
 */
- (nullable WKBackForwardListItem *)itemAtIndex:(NSInteger)index;

/*! @abstract The portion of the list preceding the current item.
 @discussion The items are in the order in which they were originally
 visited.
 */
@property (nonatomic, readonly, copy) NSArray<WKBackForwardListItem *> *backList;

/*! @abstract The portion of the list following the current item.
 @discussion The items are in the order in which they were originally
 visited.
 */
@property (nonatomic, readonly, copy) NSArray<WKBackForwardListItem *> *forwardList;

@end

NS_ASSUME_NONNULL_END
