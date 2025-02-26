/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

@class WKScriptMessage;
@class WKUserContentController;

/*! A class conforming to  the WKScriptMessageHandlerWithReply protocol provides a
method for receiving messages from JavaScript running in a webpage and replying to them asynchronously.
*/
WK_SWIFT_UI_ACTOR
@protocol WKScriptMessageHandlerWithReply <NSObject>

/*! @abstract Invoked when a script message is received from a webpage.
 @param userContentController The user content controller invoking the delegate method.
 @param message The script message received.
 @param replyHandler A block to be called with the result of processing the message.
 @discussion When the JavaScript running in your application's web content called window.webkit.messageHandlers.<name>.postMessage(<messageBody>),
 a JavaScript Promise object was returned. The values passed to the replyHandler are used to resolve that Promise.

 Passing a non-nil NSString value to the second parameter of the replyHandler signals an error.
 No matter what value you pass to the first parameter of the replyHandler,
 the Promise will be rejected with a JavaScript error object whose message property is set to that errorMessage string.

 If the second parameter to the replyHandler is nil, the first argument will be serialized into its JavaScript equivalent and the Promise will be fulfilled with the resulting value.
 If the first argument is nil then the Promise will be resolved with a JavaScript value of "undefined"

 Allowed non-nil result types are:
 NSNumber, NSNull, NSString, NSDate, NSArray, and NSDictionary.
 Any NSArray or NSDictionary containers can only contain objects of those types.

 The replyHandler can be called at most once.
 If the replyHandler is deallocated before it is called, the Promise will be rejected with a JavaScript Error object
 with an appropriate message indicating the handler was never called.

 Example:

 With a WKScriptMessageHandlerWithReply object installed with the name "testHandler", consider the following JavaScript:
 @textblock
     var promise = window.webkit.messageHandlers.testHandler.postMessage("Fulfill me with 42");
     await p;
     return p;
 @/textblock

 And consider the following WKScriptMessageHandlerWithReply implementation:
 @textblock
     - (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message replyHandler:(void (^)(id, NSString *))replyHandler
     {
        if ([message.body isEqual:@"Fulfill me with 42"])
            replyHandler(@42, nil);
        else
            replyHandler(nil, @"Unexpected message received");
     }
 @/textblock

 In this example:
   - The JavaScript code sends a message to your application code with the body @"Fulfill me with 42"
   - JavaScript execution is suspended while waiting for the resulting promise to resolve.
   - Your message handler is invoked with that message and a block to call with the reply when ready.
   - Your message handler sends the value @42 as a reply.
   - The JavaScript promise is fulfilled with the value 42.
   - JavaScript execution continues and the value 42 is returned.
 */
- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message replyHandler:(WK_SWIFT_UI_ACTOR void (^)(id _Nullable reply, NSString *_Nullable errorMessage))replyHandler WK_SWIFT_ASYNC(3) WK_API_AVAILABLE(macos(11.0), ios(14.0));

@end

NS_ASSUME_NONNULL_END
