/*
 * Copyright (C) 2014-2017 Apple Inc. All rights reserved.
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

@class WKContentRuleList;
@class WKContentWorld;
@class WKUserScript;
@protocol WKScriptMessageHandler;
@protocol WKScriptMessageHandlerWithReply;

/*! A WKUserContentController object provides a way for JavaScript to post
 messages to a web view.
 The user content controller associated with a web view is specified by its
 web view configuration.
 */
WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface WKUserContentController : NSObject <NSSecureCoding>

/*! @abstract The user scripts associated with this user content
 controller.
*/
@property (nonatomic, readonly, copy) NSArray<WKUserScript *> *userScripts;

/*! @abstract Adds a user script.
 @param userScript The user script to add.
*/
- (void)addUserScript:(WKUserScript *)userScript;

/*! @abstract Removes all associated user scripts.
*/
- (void)removeAllUserScripts;

/*! @abstract Adds a script message handler.
 @param scriptMessageHandler The script message handler to add.
 @param contentWorld The WKContentWorld in which to add the script message handler.
 @param name The name of the message handler.
 @discussion Adding a script message handler adds a function
 window.webkit.messageHandlers.<name>.postMessage(<messageBody>) to all frames, available in the given WKContentWorld.

 The name argument must be a non-empty string.

 Each WKContentWorld can have any number of script message handlers, but only one per unique name.

 Once any script message handler has been added to a WKContentWorld for a given name, it is an error to add another
 script message handler to that WKContentWorld for that same name without first removing the previous script message handler.

 The above restriction applies to any type of script message handler - WKScriptMessageHandler and WKScriptMessageHandlerWithReply
 objects will conflict with each other if you try to add them to the same WKContentWorld with the same name.
 */
- (void)addScriptMessageHandler:(id <WKScriptMessageHandler>)scriptMessageHandler contentWorld:(WKContentWorld *)world name:(NSString *)name WK_API_AVAILABLE(macos(11.0), ios(14.0));

/*! @abstract Adds a script message handler.
 @param scriptMessageHandlerWithReply The script message handler to add.
 @param contentWorld The WKContentWorld in which to add the script message handler.
 @param name The name of the message handler.
 @discussion Adding a script message handler adds a function
 window.webkit.messageHandlers.<name>.postMessage(<messageBody>) to all frames, available in the given WKContentWorld.

 The name argument must be a non-empty string.

 Each WKContentWorld can have any number of script message handlers, but only one per unique name.

 Once any script message handler has been added to a WKContentWorld for a given name, it is an error to add another
 script message handler to that WKContentWorld for that same name without first removing the previous script message handler.

 The above restriction applies to any type of script message handler - WKScriptMessageHandlerWithReply and WKScriptMessageHandler
 objects will conflict with each other if you try to add them to the same WKContentWorld with the same name.

 Refer to the WKScriptMessageHandlerWithReply documentation for examples of how it is more flexible than WKScriptMessageHandler.
 */
- (void)addScriptMessageHandlerWithReply:(id <WKScriptMessageHandlerWithReply>)scriptMessageHandlerWithReply contentWorld:(WKContentWorld *)contentWorld name:(NSString *)name WK_API_AVAILABLE(macos(11.0), ios(14.0));

/*! @abstract Adds a script message handler to the main world used by page content itself.
 @param scriptMessageHandler The script message handler to add.
 @param name The name of the message handler.
 @discussion Calling this method is equivalent to calling addScriptMessageHandler:contentWorld:name:
 with [WKContentWorld pageWorld] as the contentWorld argument.
 */
- (void)addScriptMessageHandler:(id <WKScriptMessageHandler>)scriptMessageHandler name:(NSString *)name;

/*! @abstract Removes a script message handler.
 @param name The name of the message handler to remove.
 @param contentWorld The WKContentWorld from which to remove the script message handler.
 */
- (void)removeScriptMessageHandlerForName:(NSString *)name contentWorld:(WKContentWorld *)contentWorld WK_API_AVAILABLE(macos(11.0), ios(14.0));

/*! @abstract Removes a script message handler.
 @param name The name of the message handler to remove.
 @discussion Calling this method is equivalent to calling removeScriptMessageHandlerForName:contentWorld:
  with [WKContentWorld pageWorld] as the contentWorld argument.
 */
- (void)removeScriptMessageHandlerForName:(NSString *)name;

/*! @abstract Removes all script message handlers from a given WKContentWorld.
 @param contentWorld The WKContentWorld from which to remove all script message handlers.
 */
- (void)removeAllScriptMessageHandlersFromContentWorld:(WKContentWorld *)contentWorld WK_API_AVAILABLE(macos(11.0), ios(14.0));

/*! @abstract Removes all associated script message handlers.
 */
- (void)removeAllScriptMessageHandlers WK_API_AVAILABLE(macos(11.0), ios(14.0));

/*! @abstract Adds a content rule list.
 @param contentRuleList The content rule list to add.
 */
- (void)addContentRuleList:(WKContentRuleList *)contentRuleList WK_API_AVAILABLE(macos(10.13), ios(11.0));

/*! @abstract Removes a content rule list.
 @param contentRuleList The content rule list to remove.
 */
- (void)removeContentRuleList:(WKContentRuleList *)contentRuleList WK_API_AVAILABLE(macos(10.13), ios(11.0));

/*! @abstract Removes all associated content rule lists.
 */
- (void)removeAllContentRuleLists WK_API_AVAILABLE(macos(10.13), ios(11.0));

@end

NS_ASSUME_NONNULL_END
