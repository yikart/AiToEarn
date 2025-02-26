/*
 * Copyright (C) 2003 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#import <Foundation/Foundation.h>
#import <WebKit/WebKitAvailability.h>

#import <AppKit/AppKit.h>

@class WebHistoryItemPrivate;
@class NSURL;

/*
    @discussion Notification sent when history item is modified.
    @constant WebHistoryItemChanged Posted from whenever the value of
    either the item's title, alternate title, url strings, or last visited interval
    changes.  The userInfo will be nil.
*/
extern NSString *WebHistoryItemChangedNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);

/*!
    @class WebHistoryItem
    @discussion  WebHistoryItems are created by WebKit to represent pages visited.
    The WebBackForwardList and WebHistory classes both use WebHistoryItems to represent
    pages visited.  With the exception of the displayTitle, the properties of 
    WebHistoryItems are set by WebKit.  WebHistoryItems are normally never created directly.
*/
WEBKIT_CLASS_DEPRECATED_MAC(10_3, 10_14)
@interface WebHistoryItem : NSObject <NSCopying>
{
@package
    WebHistoryItemPrivate *_private;
}

/*!
    @method initWithURLString:title:lastVisitedTimeInterval:
    @param URLString The URL string for the item.
    @param title The title to use for the item.  This is normally the <title> of a page.
    @param time The time used to indicate when the item was used.
    @abstract Initialize a new WebHistoryItem
    @discussion WebHistoryItems are normally created for you by the WebKit.
    You may use this method to prepopulate a WebBackForwardList, or create
    'artificial' items to add to a WebBackForwardList.  When first initialized
    the URLString and originalURLString will be the same.
*/
- (instancetype)initWithURLString:(NSString *)URLString title:(NSString *)title lastVisitedTimeInterval:(NSTimeInterval)time;

/*!
    @property originalURLString
    @abstract The string representation of the initial URL of this item.
    This value is normally set by the WebKit.
*/
@property (nonatomic, readonly, copy) NSString *originalURLString;

/*!
    @property URLString
    @abstract The string representation of the URL represented by this item.
    @discussion The URLString may be different than the originalURLString if the page
    redirected to a new location.  This value is normally set by the WebKit.
*/
@property (nonatomic, readonly, copy) NSString *URLString;


/*!
    @property title
    @abstract The title of the page represented by this item.
    @discussion This title cannot be changed by the client.  This value
    is normally set by the WebKit when a page title for the item is received.
*/
@property (nonatomic, readonly, copy) NSString *title;

/*!
    @property lastVisitedTimeInterval
    @abstract The last time the page represented by this item was visited. The interval
    is since the reference date as determined by NSDate.  This value is normally set by
    the WebKit.
*/
@property (nonatomic, readonly) NSTimeInterval lastVisitedTimeInterval;

/*
    @property alternateTitle
    @abstract A title that may be used by the client to display this item.
*/
@property (nonatomic, copy) NSString *alternateTitle;

/*!
    @property icon
    @abstract The favorite icon of the page represented by this item.
    @discussion This icon returned will be determined by the WebKit.
*/
@property (nonatomic, readonly, strong) NSImage *icon;

@end
