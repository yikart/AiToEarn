/*
 * Copyright (C) 2003, 2004, 2005, 2006 Apple Inc.  All rights reserved.
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

@class WebDataSource;
@class WebFrame;
@class WebFrameViewPrivate;

@protocol WebDocumentView;

/*!
    @class WebFrameView
*/
WEBKIT_CLASS_DEPRECATED_MAC(10_3, 10_14)
@interface WebFrameView : NSView
{
@package
    WebFrameViewPrivate *_private;
}

/*!
    @property webFrame
    @abstract The WebFrame associated with this WebFrameView
*/
@property (nonatomic, readonly, strong) WebFrame *webFrame;

/*!
    @property documentView
    @abstract The WebFrameView's document subview
    @discussion The subview that renders the WebFrameView's contents
*/
@property (nonatomic, readonly, strong) NSView<WebDocumentView> *documentView;

/*!
    @property allowsScrolling
    @abstract Whether the WebFrameView allows its document to be scrolled
*/
@property (nonatomic) BOOL allowsScrolling;

/*!
    @property canPrintHeadersAndFooters
    @abstract Whether this frame can print headers and footers
*/
@property (nonatomic, readonly) BOOL canPrintHeadersAndFooters;

/*!
    @method printOperationWithPrintInfo
    @abstract Creates a print operation set up to print this frame
    @result A newly created print operation object
*/
- (NSPrintOperation *)printOperationWithPrintInfo:(NSPrintInfo *)printInfo;

/*!
    @property documentViewShouldHandlePrint
    @abstract Called by the host application before it initializes and runs a print operation.
    @discussion If NO is returned, the host application will abort its print operation and call -printDocumentView on the
    WebFrameView.  The document view is then expected to run its own print operation.  If YES is returned, the host 
    application's print operation will continue as normal.
*/
@property (nonatomic, readonly) BOOL documentViewShouldHandlePrint;

/*!
    @method printDocumentView
    @abstract Called by the host application when the WebFrameView returns YES from -documentViewShouldHandlePrint.
*/
- (void)printDocumentView;

@end
