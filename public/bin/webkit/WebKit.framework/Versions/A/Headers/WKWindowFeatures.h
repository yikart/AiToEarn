/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

/*! WKWindowFeatures specifies optional attributes for the containing window when a new WKWebView is requested.
 */
NS_ASSUME_NONNULL_BEGIN

WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface WKWindowFeatures : NSObject

/*! @abstract BOOL. Whether the menu bar should be visible. nil if menu bar visibility was not specified.
 */
@property (nullable, nonatomic, readonly) NSNumber *menuBarVisibility;

/*! @abstract BOOL. Whether the status bar should be visible. nil if status bar visibility was not specified.
 */
@property (nullable, nonatomic, readonly) NSNumber *statusBarVisibility;

/*! @abstract BOOL. Whether toolbars should be visible. nil if toolbar visibility was not specified.
 */
@property (nullable, nonatomic, readonly) NSNumber *toolbarsVisibility;

/*! @abstract BOOL. Whether the containing window should be resizable. nil if resizability was not specified.
 */
@property (nullable, nonatomic, readonly) NSNumber *allowsResizing;

/*! @abstract CGFloat. The x coordinate of the containing window. nil if the x coordinate was not specified.
 */
@property (nullable, nonatomic, readonly) NSNumber *x;

/*! @abstract CGFloat. The y coordinate of the containing window. nil if the y coordinate was not specified.
 */
@property (nullable, nonatomic, readonly) NSNumber *y;

/*! @abstract CGFloat. The width coordinate of the containing window. nil if the width was not specified.
 */
@property (nullable, nonatomic, readonly) NSNumber *width;

/*! @abstract CGFloat. The height coordinate of the containing window. nil if the height was not specified.
 */
@property (nullable, nonatomic, readonly) NSNumber *height;

@end

NS_ASSUME_NONNULL_END
