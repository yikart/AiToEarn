/*
 * Copyright (C) 2003, 2004, 2005, 2007 Apple Inc.  All rights reserved.
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
#import <JavaScriptCore/JSBase.h>
#import <WebKitLegacy/WebKitAvailability.h>

@class DOMDocument;
@class DOMHTMLElement;
@class JSContext;
@class NSURLRequest;
@class WebArchive;
@class WebDataSource;
@class WebFramePrivate;
@class WebFrameView;
@class WebScriptObject;
@class WebView;

/*!
    @class WebFrame
    @discussion Every web page is represented by at least one WebFrame.  A WebFrame
    has a WebFrameView and a WebDataSource.
*/
WEBKIT_CLASS_DEPRECATED_MAC(10_3, 10_14)
@interface WebFrame : NSObject
{
@package
    WebFramePrivate *_private;
}

/*!
    @method initWithName:webFrameView:webView:
    @abstract The designated initializer of WebFrame.
    @discussion WebFrames are normally created for you by the WebView.  You should 
    not need to invoke this method directly.
    @param name The name of the frame.
    @param view The WebFrameView for the frame.
    @param webView The WebView that manages the frame.
    @result Returns an initialized WebFrame.
*/
- (instancetype)initWithName:(NSString *)name webFrameView:(WebFrameView *)view webView:(WebView *)webView;

/*!
    @property name
    @abstract The frame name.
*/
@property (nonatomic, readonly, copy) NSString *name;

/*!
    @property webView
    @abstract The WebView for the document that includes this frame.
*/
@property (nonatomic, readonly, strong) WebView *webView;

/*!
    @property frameView
    @abstract The WebFrameView for this frame.
*/
@property (nonatomic, readonly, strong) WebFrameView *frameView;

/*!
    @property DOMDocument
    @abstract The DOM document of the frame.
    @description Returns nil if the frame does not contain a DOM document such as a standalone image.
*/
@property (nonatomic, readonly, strong) DOMDocument *DOMDocument;

/*!
    @property frameElement
    @abstract The frame element of the frame.
    @description The class of the result is either DOMHTMLFrameElement, DOMHTMLIFrameElement or DOMHTMLObjectElement.
    Returns nil if the frame is the main frame since there is no frame element for the frame in this case.
*/
@property (nonatomic, readonly, strong) DOMHTMLElement *frameElement;

/*!
    @method loadRequest:
    @param request The web request to load.
*/
- (void)loadRequest:(NSURLRequest *)request;

/*!
    @method loadData:MIMEType:textEncodingName:baseURL:
    @param data The data to use for the main page of the document.
    @param MIMEType The MIME type of the data.
    @param encodingName The encoding of the data.
    @param URL The base URL to apply to relative URLs within the document.
*/
- (void)loadData:(NSData *)data MIMEType:(NSString *)MIMEType textEncodingName:(NSString *)encodingName baseURL:(NSURL *)URL;

/*!
    @method loadHTMLString:baseURL:
    @param string The string to use for the main page of the document.
    @param URL The base URL to apply to relative URLs within the document.
*/
- (void)loadHTMLString:(NSString *)string baseURL:(NSURL *)URL;

/*!
    @method loadAlternateHTMLString:baseURL:forUnreachableURL:
    @abstract Loads a page to display as a substitute for a URL that could not be reached.
    @discussion This allows clients to display page-loading errors in the webview itself.
    This is typically called while processing the WebFrameLoadDelegate method
    -webView:didFailProvisionalLoadWithError:forFrame: or one of the WebPolicyDelegate methods
    -webView:decidePolicyForMIMEType:request:frame:decisionListener: or
    -webView:unableToImplementPolicyWithError:frame:. If it is called from within one of those
    three delegate methods then the back/forward list will be maintained appropriately.
    @param string The string to use for the main page of the document.
    @param baseURL The baseURL to apply to relative URLs within the document.
    @param unreachableURL The URL for which this page will serve as alternate content.
*/
- (void)loadAlternateHTMLString:(NSString *)string baseURL:(NSURL *)baseURL forUnreachableURL:(NSURL *)unreachableURL;

/*!
    @method loadArchive:
    @abstract Causes WebFrame to load a WebArchive.
    @param archive The archive to be loaded.
*/
- (void)loadArchive:(WebArchive *)archive;

/*!
    @property dataSource
    @abstract The datasource for this frame.
    @discussion Returns the committed data source.  Will return nil if the
    provisional data source hasn't yet been loaded.
*/
@property (nonatomic, readonly, strong) WebDataSource *dataSource;

/*!
    @property provisionalDataSource
    @abstract The provisional datasource of this frame.
    @discussion Will return the provisional data source.  The provisional data source will
    be nil if no data source has been set on the frame, or the data source
    has successfully transitioned to the committed data source.
*/
@property (nonatomic, readonly, strong) WebDataSource *provisionalDataSource;

/*!
    @method stopLoading
    @discussion Stop any pending loads on the frame's data source,
    and its children.
*/
- (void)stopLoading;

/*!
    @method reload
    @discussion Performs HTTP/1.1 end-to-end revalidation using cache-validating conditionals if possible.
*/
- (void)reload;

/*!
    @method reloadFromOrigin
    @discussion Performs HTTP/1.1 end-to-end reload.
*/
- (void)reloadFromOrigin;

/*!
    @method findFrameNamed:
    @discussion This method returns a frame with the given name. findFrameNamed returns self 
    for _self and _current, the parent frame for _parent and the main frame for _top. 
    findFrameNamed returns self for _parent and _top if the receiver is the mainFrame.
    findFrameNamed first searches from the current frame to all descending frames then the
    rest of the frames in the WebView. If still not found, findFrameNamed searches the
    frames of the other WebViews.
    @param name The name of the frame to find.
    @result The frame matching the provided name. nil if the frame is not found.
*/
- (WebFrame *)findFrameNamed:(NSString *)name;

/*!
    @property parentFrame
    @abstract The frame containing this frame, or nil if this is a top level frame.
*/
@property (nonatomic, readonly, strong) WebFrame *parentFrame;

/*!
    @property childFrames
    @abstract An array of WebFrame.
    @discussion The frames in the array are associated with a frame set or iframe.
*/
@property (nonatomic, readonly, copy) NSArray *childFrames;

/*!
    @property windowObject
    @abstract The WebScriptObject representing the frame's JavaScript window object.
*/
@property (nonatomic, readonly, strong) WebScriptObject *windowObject;

/*!
    @property globalContext
    @abstract The frame's global JavaScript execution context.
    @discussion Use this method to bridge between the WebKit and JavaScriptCore APIs.
*/
@property (nonatomic, readonly) JSGlobalContextRef globalContext;

#if JSC_OBJC_API_ENABLED
/*!
    @property javaScriptContext
    @abstract The frame's global JavaScript execution context.
    @discussion Use this method to bridge between the WebKit and Objective-C JavaScriptCore API.
*/
@property (nonatomic, readonly, strong) JSContext *javaScriptContext;
#endif // JSC_OBJC_API_ENABLED

@end
