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

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

WK_API_AVAILABLE(macos(10.13), ios(11.0))
@protocol WKURLSchemeTask <NSObject>

/*! @abstract The request to load for this task.
 */
@property (nonatomic, readonly, copy) NSURLRequest *request;

/*! @abstract Set the current response object for the task.
 @param response The response to use.
 @discussion This method must be called at least once for each URL scheme handler task.
 Cross-origin requests require CORS header fields.
 An exception will be thrown if you try to send a new response object after the task has already been completed.
 An exception will be thrown if your app has been told to stop loading this task via the registered WKURLSchemeHandler object.
 */
- (void)didReceiveResponse:(NSURLResponse *)response;

/*! @abstract Add received data to the task.
 @param data The data to add.
 @discussion After a URL scheme handler task's final response object is received you should
 start sending it data.
 Each time this method is called the data you send will be appended to all previous data.
 An exception will be thrown if you try to send the task any data before sending it a response.
 An exception will be thrown if you try to send the task any data after the task has already been completed.
 An exception will be thrown if your app has been told to stop loading this task via the registered WKURLSchemeHandler object.
 */
- (void)didReceiveData:(NSData *)data;

/*! @abstract Mark the task as successfully completed.
 @discussion An exception will be thrown if you try to finish the task before sending it a response.
 An exception will be thrown if you try to mark a task completed after it has already been marked completed or failed.
 An exception will be thrown if your app has been told to stop loading this task via the registered WKURLSchemeHandler object.
 */
- (void)didFinish;

/*! @abstract Mark the task as failed.
 @param error A description of the error that caused the task to fail.
 @discussion  An exception will be thrown if you try to mark a task failed after it has already been marked completed or failed.
 An exception will be thrown if your app has been told to stop loading this task via the registered WKURLSchemeHandler object.
 */
- (void)didFailWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
