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

NS_ASSUME_NONNULL_BEGIN

/*! @abstract A WKContentWorld object allows you to separate your application's interaction with content displayed in a WKWebView into different roles that cannot interfere with one another.
@discussion WKContentWorld objects should be treated as namespaces. This is useful for keeping your application's web content environment separate from the environment of the web page content itself,
as well as managing multiple different environments within your own application.
For example:
- If you have complex scripting logic to bridge your web content to your application but your web content also has complex scripting libraries of its own,
  you avoid possible conflicts by using a client WKContentWorld.
- If you are writing a general purpose web browser that supports JavaScript extensions, you would use a different client WKContentWorld for each extension.

Since a WKContentWorld object is a namespace it does not contain any data itself.
For example:
- If you store a variable in JavaScript in the scope of a particular WKContentWorld while viewing a particular web page document, after navigating to a new document that variable will be gone.
- If you store a variable in JavaScript in the scope of a particular WKContentWorld in one WKWebView, that variable will not exist in the same world in another WKWebView.
*/
WK_SWIFT_UI_ACTOR
WK_CLASS_AVAILABLE(macos(11.0), ios(14.0))
@interface WKContentWorld : NSObject

+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;

/*! @abstract Retrieve the main world that page content itself uses.
@discussion When interacting with page content in a WKWebView using the page content world you can disrupt the operation of page content (e.g. by conflicting with variable names in JavaScript set by the web page content itself).
*/
@property (class, nonatomic, readonly) WKContentWorld *pageWorld;

/*! @abstract Retrieve the default world for API client use.
@discussion When using a content world different from the page content world you can still manipulate the DOM and built-in DOM APIs but without conflicting with other aspects of the page content (e.g. JavaScript from the web page content itself)
Repeated calls will retrieve the same WKContentWorld instance.
*/
@property (class, nonatomic, readonly) WKContentWorld *defaultClientWorld;

/*! @abstract Retrieves a named content world for API client use.
@param name The name of the WKContentWorld to retrieve.
@discussion When using a content world different from the page content world you can still manipulate the DOM and built-in DOM APIs but without conflicting with other aspects of the page content (e.g. JavaScript from the web page content itself)
As long as a particular named WKContentWorld instance has not been deallocated, repeated calls with the same name will retrieve that same WKContentWorld instance.
Each named content world is distinct from all other named content worlds, the defaultClientWorld, and the pageWorld.
The name can be used to keep distinct worlds identifiable anywhere a world might be surfaced in a user interface. For example, the different worlds used in your application will be surfaced by name in the WebKit Web Inspector.
*/
+ (WKContentWorld *)worldWithName:(NSString *)name NS_SWIFT_NAME(world(name:));

/*! @abstract The name of the WKContentWorld
@discussion The pageWorld and defaultClientWorld instances will have a nil name.
All other instances will have the non-nil name they were accessed by.
*/
@property (nullable, nonatomic, readonly, copy) NSString *name;

@end

NS_ASSUME_NONNULL_END
