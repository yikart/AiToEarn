/*
 * Copyright (C) 2014-2021 Apple Inc. All rights reserved.
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

#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#else
#import <AppKit/AppKit.h>
#endif

NS_ASSUME_NONNULL_BEGIN

#if TARGET_OS_IOS
@class UIFindInteraction;
#endif

@class WKBackForwardList;
@class WKBackForwardListItem;
@class WKContentWorld;
@class WKDownload;
@class WKFindConfiguration;
@class WKFindResult;
@class WKFrameInfo;
@class WKNavigation;
@class WKPDFConfiguration;
@class WKSnapshotConfiguration;
@class WKWebViewConfiguration;

@protocol WKNavigationDelegate;
@protocol WKUIDelegate;

/*!
 A WKWebView object displays interactive Web content.
 @helperclass @link WKWebViewConfiguration @/link
 Used to configure @link WKWebView @/link instances.
 */
WK_SWIFT_UI_ACTOR
#if TARGET_OS_IPHONE
WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface WKWebView : UIView
#else
WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface WKWebView : NSView
#endif

typedef NS_ENUM(NSInteger, WKMediaPlaybackState) {
    WKMediaPlaybackStateNone,
    WKMediaPlaybackStatePlaying,
    WKMediaPlaybackStatePaused,
    WKMediaPlaybackStateSuspended
} WK_API_AVAILABLE(macos(11.3), ios(14.5));

typedef NS_ENUM(NSInteger, WKMediaCaptureState) {
    WKMediaCaptureStateNone,
    WKMediaCaptureStateActive,
    WKMediaCaptureStateMuted,
} WK_API_AVAILABLE(macos(12.0), ios(15.0));

typedef NS_ENUM(NSInteger, WKFullscreenState) {
    WKFullscreenStateNotInFullscreen,
    WKFullscreenStateEnteringFullscreen,
    WKFullscreenStateInFullscreen,
    WKFullscreenStateExitingFullscreen,
} NS_SWIFT_NAME(WKWebView.FullscreenState) WK_API_AVAILABLE(macos(13.0), ios(16.0));

/*! @abstract A copy of the configuration with which the web view was
 initialized. */
@property (nonatomic, readonly, copy) WKWebViewConfiguration *configuration;

/*! @abstract The web view's navigation delegate. */
@property (nullable, nonatomic, weak) id <WKNavigationDelegate> navigationDelegate;

/*! @abstract The web view's user interface delegate. */
@property (nullable, nonatomic, weak) id <WKUIDelegate> UIDelegate;

/*! @abstract The web view's back-forward list. */
@property (nonatomic, readonly, strong) WKBackForwardList *backForwardList;

/*! @abstract Returns a web view initialized with a specified frame and
 configuration.
 @param frame The frame for the new web view.
 @param configuration The configuration for the new web view.
 @result An initialized web view, or nil if the object could not be
 initialized.
 @discussion This is a designated initializer. You can use
 @link -initWithFrame: @/link to initialize an instance with the default
 configuration. The initializer copies the specified configuration, so
 mutating the configuration after invoking the initializer has no effect
 on the web view.
 */
- (instancetype)initWithFrame:(CGRect)frame configuration:(WKWebViewConfiguration *)configuration NS_DESIGNATED_INITIALIZER;

- (nullable instancetype)initWithCoder:(NSCoder *)coder NS_DESIGNATED_INITIALIZER;

/*! @abstract Navigates to a requested URL.
 @param request The request specifying the URL to which to navigate.
 @result A new navigation for the given request.
 */
- (nullable WKNavigation *)loadRequest:(NSURLRequest *)request;

/*! @abstract Navigates to the requested file URL on the filesystem.
 @param URL The file URL to which to navigate.
 @param readAccessURL The URL to allow read access to.
 @discussion If readAccessURL references a single file, only that file may be loaded by WebKit.
 If readAccessURL references a directory, files inside that file may be loaded by WebKit.
 @result A new navigation for the given file URL.
 */
- (nullable WKNavigation *)loadFileURL:(NSURL *)URL allowingReadAccessToURL:(NSURL *)readAccessURL WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @abstract Sets the webpage contents and base URL.
 @param string The string to use as the contents of the webpage.
 @param baseURL A URL that is used to resolve relative URLs within the document.
 @result A new navigation.
 */
- (nullable WKNavigation *)loadHTMLString:(NSString *)string baseURL:(nullable NSURL *)baseURL;

/*! @abstract Sets the webpage contents and base URL.
 @param data The data to use as the contents of the webpage.
 @param MIMEType The MIME type of the data.
 @param characterEncodingName The data's character encoding name.
 @param baseURL A URL that is used to resolve relative URLs within the document.
 @result A new navigation.
 */
- (nullable WKNavigation *)loadData:(NSData *)data MIMEType:(NSString *)MIMEType characterEncodingName:(NSString *)characterEncodingName baseURL:(NSURL *)baseURL WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @abstract Navigates to an item from the back-forward list and sets it
 as the current item.
 @param item The item to which to navigate. Must be one of the items in the
 web view's back-forward list.
 @result A new navigation to the requested item, or nil if it is already
 the current item or is not part of the web view's back-forward list.
 @seealso backForwardList
 */
- (nullable WKNavigation *)goToBackForwardListItem:(WKBackForwardListItem *)item;

/*! @abstract The page title.
 @discussion @link WKWebView @/link is key-value observing (KVO) compliant
 for this property.
 */
@property (nullable, nonatomic, readonly, copy) NSString *title;

/*! @abstract The active URL.
 @discussion This is the URL that should be reflected in the user
 interface.
 @link WKWebView @/link is key-value observing (KVO) compliant for this
 property.
 */
@property (nullable, nonatomic, readonly, copy) NSURL *URL;

/*! @abstract A Boolean value indicating whether the view is currently
 loading content.
 @discussion @link WKWebView @/link is key-value observing (KVO) compliant
 for this property.
 */
@property (nonatomic, readonly, getter=isLoading) BOOL loading;

/*! @abstract An estimate of what fraction of the current navigation has been completed.
 @discussion This value ranges from 0.0 to 1.0 based on the total number of
 bytes expected to be received, including the main document and all of its
 potential subresources. After a navigation completes, the value remains at 1.0
 until a new navigation starts, at which point it is reset to 0.0.
 @link WKWebView @/link is key-value observing (KVO) compliant for this
 property.
 */
@property (nonatomic, readonly) double estimatedProgress;

/*! @abstract A Boolean value indicating whether all resources on the page
 have been loaded over securely encrypted connections.
 @discussion @link WKWebView @/link is key-value observing (KVO) compliant
 for this property.
 */
@property (nonatomic, readonly) BOOL hasOnlySecureContent;

/*! @abstract A SecTrustRef for the currently committed navigation.
 @discussion @link WKWebView @/link is key-value observing (KVO) compliant 
 for this property.
 */
@property (nonatomic, readonly, nullable) SecTrustRef serverTrust WK_API_AVAILABLE(macos(10.12), ios(10.0));

/*! @abstract A Boolean value indicating whether there is a back item in
 the back-forward list that can be navigated to.
 @discussion @link WKWebView @/link is key-value observing (KVO) compliant
 for this property.
 @seealso backForwardList.
 */
@property (nonatomic, readonly) BOOL canGoBack;

/*! @abstract A Boolean value indicating whether there is a forward item in
 the back-forward list that can be navigated to.
 @discussion @link WKWebView @/link is key-value observing (KVO) compliant
 for this property.
 @seealso backForwardList.
 */
@property (nonatomic, readonly) BOOL canGoForward;

/*! @abstract Navigates to the back item in the back-forward list.
 @result A new navigation to the requested item, or nil if there is no back
 item in the back-forward list.
 */
- (nullable WKNavigation *)goBack;

/*! @abstract Navigates to the forward item in the back-forward list.
 @result A new navigation to the requested item, or nil if there is no
 forward item in the back-forward list.
 */
- (nullable WKNavigation *)goForward;

/*! @abstract Reloads the current page.
 @result A new navigation representing the reload.
 */
- (nullable WKNavigation *)reload;

/*! @abstract Reloads the current page, performing end-to-end revalidation
 using cache-validating conditionals if possible.
 @result A new navigation representing the reload.
 */
- (nullable WKNavigation *)reloadFromOrigin;

/*! @abstract Stops loading all resources on the current page.
 */
- (void)stopLoading;

/* @abstract Evaluates the given JavaScript string.
 @param javaScriptString The JavaScript string to evaluate.
 @param completionHandler A block to invoke when script evaluation completes or fails.
 @discussion The completionHandler is passed the result of the script evaluation or an error.
 Calling this method is equivalent to calling `evaluateJavaScript:inFrame:inContentWorld:completionHandler:` with:
   - A `frame` value of `nil` to represent the main frame
   - A `contentWorld` value of `WKContentWorld.pageWorld`
*/
- (void)evaluateJavaScript:(NSString *)javaScriptString completionHandler:(WK_SWIFT_UI_ACTOR void (^ _Nullable)(id WK_NULLABLE_RESULT, NSError * _Nullable error))completionHandler;

/* @abstract Evaluates the given JavaScript string.
 @param javaScriptString The JavaScript string to evaluate.
 @param frame A WKFrameInfo identifying the frame in which to evaluate the JavaScript string.
 @param contentWorld The WKContentWorld in which to evaluate the JavaScript string.
 @param completionHandler A block to invoke when script evaluation completes or fails.
 @discussion The completionHandler is passed the result of the script evaluation or an error.

 Passing nil is equivalent to targeting the main frame.
 If the frame argument no longer represents a valid frame by the time WebKit attempts to call the JavaScript function your completion handler will be called with a WKErrorJavaScriptInvalidFrameTarget error.
 This might happen for a number of reasons, including but not limited to:
     - The target frame has been removed from the DOM via JavaScript
     - A parent frame has navigated, destroying all of its previous child frames

 No matter which WKContentWorld you use to evaluate your JavaScript string, you can make changes to the underlying web content. (e.g. the Document and its DOM structure)
 Such changes will be visible to script executing in all WKContentWorlds.
 Evaluating your JavaScript string can leave behind other changes to global state visible to JavaScript. (e.g. `window.myVariable = 1;`)
 Those changes will only be visible to scripts executed in the same WKContentWorld.
 evaluateJavaScript: is a great way to set up global state for future JavaScript execution in a given world. (e.g. Importing libraries/utilities that future JavaScript execution will rely on)
 Once your global state is set up, consider using callAsyncJavaScript: for more flexible interaction with the JavaScript programming model.
*/
- (void)evaluateJavaScript:(NSString *)javaScriptString inFrame:(nullable WKFrameInfo *)frame inContentWorld:(WKContentWorld *)contentWorld completionHandler:(WK_SWIFT_UI_ACTOR void (^ _Nullable)(id WK_NULLABLE_RESULT, NSError * _Nullable error))completionHandler NS_REFINED_FOR_SWIFT WK_API_AVAILABLE(macos(11.0), ios(14.0));

/* @abstract Calls the given JavaScript string as an async JavaScript function, passing the given named arguments to that function.
 @param functionBody The JavaScript string to use as the function body.
 @param arguments A dictionary representing the arguments to be passed to the function call.
 @param frame A WKFrameInfo identifying the frame in which to call the JavaScript function.
 @param contentWorld The WKContentWorld in which to call the JavaScript function.
 @param completionHandler A block to invoke with the return value of the function call, or with the asynchronous resolution of the function's return value.
 @discussion The functionBody string is treated as an anonymous JavaScript function body that can be called with named arguments.
 Do not format your functionBody string as a function-like callable object as you would in pure JavaScript.
 Your functionBody string should contain only the function body you want executed.

 For example do not pass in the string:
 @textblock
     function(x, y, z)
     {
         return x ? y : z;
     }
 @/textblock

 Instead pass in the string:
 @textblock
     return x ? y : z;
 @/textblock

 The arguments dictionary supplies the values for those arguments which are serialized into JavaScript equivalents.
 For example:
 @textblock
     @{ @"x" : @YES, @"y" : @1, @"z" : @"hello world" };
 @/textblock

 Combining the above arguments dictionary with the above functionBody string, a function with the arguments named "x", "y", and "z" is called with values true, 1, and "hello world" respectively.

 Allowed argument types are:
 NSNumber, NSString, NSDate, NSArray, NSDictionary, and NSNull.
 Any NSArray or NSDictionary containers can only contain objects of those types.

 Passing nil is equivalent to targeting the main frame.
 If the frame argument no longer represents a valid frame by the time WebKit attempts to call the JavaScript function your completion handler will be called with a WKErrorJavaScriptInvalidFrameTarget error.
 This might happen for a number of reasons, including but not limited to:
     - The target frame has been removed from the DOM via JavaScript
     - A parent frame has navigated, destroying all of its previous child frames

 No matter which WKContentWorld you use to call your JavaScript function, you can make changes to the underlying web content. (e.g. the Document and its DOM structure)
 Such changes will be visible to script executing in all WKContentWorlds.
 Calling your JavaScript function can leave behind other changes to global state visibile to JavaScript. (e.g. `window.myVariable = 1;`)
 Those changes will only be visibile to scripts executed in the same WKContentWorld.

 Your completion handler will be called with the explicit return value of your JavaScript function.
 If your JavaScript does not explicitly return any value, that undefined result manifests as nil being passed to your completion handler.
 If your JavaScript returns null, that result manifests as NSNull being passed to your completion handler.

 JavaScript has the concept of a "thenable" object, which is any JavaScript object that has a callable "then" property.
 The most well known example of a "thenable" object is a JavaScript promise.
 If your JavaScript returns a "thenable" object WebKit will call "then" on the resulting object and wait for it to be resolved.

 If the object resolves successfully (e.g. Calls the "fulfill" function) your completion handler will be called with the result.
 If the object rejects (e.g. Calls the "reject" function) your completion handler will be called with a WKErrorJavaScriptAsyncFunctionResultRejected error containing the reject reason in the userInfo dictionary.
 If the object is garbage collected before it is resolved, your completion handler will be called with a WKErrorJavaScriptAsyncFunctionResultUnreachable error indicating that it will never be resolved.

 Since the function is a JavaScript "async" function you can use JavaScript "await" on thenable objects inside your function body.
 For example:
 @textblock
     var p = new Promise(function (f) {
         window.setTimeout("f(42)", 1000);
     });
     await p;
     return p;
 @/textblock

 The above function text will create a promise that will fulfull with the value 42 after a one second delay, wait for it to resolve, then return the fulfillment value of 42.
*/
- (void)callAsyncJavaScript:(NSString *)functionBody arguments:(nullable NSDictionary<NSString *, id> *)arguments inFrame:(nullable WKFrameInfo *)frame inContentWorld:(WKContentWorld *)contentWorld completionHandler:(WK_SWIFT_UI_ACTOR void (^ _Nullable)(id WK_NULLABLE_RESULT result, NSError * _Nullable error))completionHandler NS_REFINED_FOR_SWIFT WK_API_AVAILABLE(macos(11.0), ios(14.0));

/*! @abstract Closes all out-of-window media presentations in a WKWebView.
 @discussion Includes picture-in-picture and fullscreen.
 */
- (void)closeAllMediaPresentationsWithCompletionHandler:(WK_SWIFT_UI_ACTOR void (^_Nullable)(void))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)closeAllMediaPresentations WK_API_DEPRECATED_WITH_REPLACEMENT("closeAllMediaPresentationsWithCompletionHandler:", macos(11.3, 12.0), ios(14.5, 15.0));

/*! @abstract Pauses media playback in WKWebView.
 @discussion Pauses media playback. Media in the page can be restarted by calling play() on a media element or resume() on an AudioContext in JavaScript. A user can also use media controls to play media content after it has been paused.
 */
- (void)pauseAllMediaPlaybackWithCompletionHandler:(WK_SWIFT_UI_ACTOR void (^_Nullable)(void))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
#ifndef __swift__
- (void)pauseAllMediaPlayback:(WK_SWIFT_UI_ACTOR void (^_Nullable)(void))completionHandler WK_API_DEPRECATED_WITH_REPLACEMENT("pauseAllMediaPlaybackWithCompletionHandler:", macos(11.3, 12.0), ios(14.5, 15.0));
#endif

/*! @abstract Suspends or resumes all media playback in WKWebView.
  @param suspended Whether media playback should be suspended or resumed.
  @discussion If suspended is true, this pauses media playback and blocks all attempts by the page or the user to resume until setAllMediaPlaybackSuspended is called again with suspended set to false. Media playback should always be suspended and resumed in pairs.
*/
- (void)setAllMediaPlaybackSuspended:(BOOL)suspended completionHandler:(WK_SWIFT_UI_ACTOR void (^_Nullable)(void))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
#ifndef __swift__
- (void)resumeAllMediaPlayback:(WK_SWIFT_UI_ACTOR void (^ _Nullable)(void))completionHandler WK_API_DEPRECATED_WITH_REPLACEMENT("setAllMediaPlaybackSuspended:completionHandler:", macos(11.3, 12.0), ios(14.5, 15.0));
- (void)suspendAllMediaPlayback:(WK_SWIFT_UI_ACTOR void (^_Nullable)(void))completionHandler WK_API_DEPRECATED_WITH_REPLACEMENT("setAllMediaPlaybackSuspended:completionHandler:", macos(11.3, 12.0), ios(14.5, 15.0));
#endif

/*! @abstract Get the current media playback state of a WKWebView.
 @param completionHandler A block to invoke with the return value of the function call.
 @discussion If media playback exists, WKMediaPlaybackState will be one of three
 values: WKMediaPlaybackPaused, WKMediaPlaybackSuspended, or WKMediaPlaybackPlaying.
 If no media playback exists in the current WKWebView, WKMediaPlaybackState will equal
 WKMediaPlaybackStateNone.
 */
- (void)requestMediaPlaybackStateWithCompletionHandler:(WK_SWIFT_UI_ACTOR void (^)(WKMediaPlaybackState))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
#ifndef __swift__
- (void)requestMediaPlaybackState:(WK_SWIFT_UI_ACTOR void (^)(WKMediaPlaybackState))completionHandler WK_API_DEPRECATED_WITH_REPLACEMENT("requestMediaPlaybackStateWithCompletionHandler:", macos(11.3, 12.0), ios(14.5, 15.0));
#endif

/*! @abstract The state of camera capture on a web page.
 @discussion @link WKWebView @/link is key-value observing (KVO) compliant
 for this property.
 */
@property (nonatomic, readonly) WKMediaCaptureState cameraCaptureState WK_API_AVAILABLE(macos(12.0), ios(15.0));

/*! @abstract The state of microphone capture on a web page.
 @discussion @link WKWebView @/link is key-value observing (KVO) compliant
 for this property.
 */
@property (nonatomic, readonly) WKMediaCaptureState microphoneCaptureState WK_API_AVAILABLE(macos(12.0), ios(15.0));

/*! @abstract Set camera capture state of a WKWebView.
 @param state State to apply for capture.
 @param completionHandler A block to invoke after the camera state has been changed.
 @discussion
 If value is WKMediaCaptureStateNone, this will stop any camera capture.
 If value is WKMediaCaptureStateMuted, any active camera capture will become muted.
 If value is WKMediaCaptureStateActive, any muted camera capture will become active.
 */
- (void)setCameraCaptureState:(WKMediaCaptureState)state completionHandler:(WK_SWIFT_UI_ACTOR void (^_Nullable)(void))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));

/*! @abstract Set microphone capture state of a WKWebView.
 @param state state to apply for capture.
 @param completionHandler A block to invoke after the microphone state has been changed.
 @discussion
 If value is WKMediaCaptureStateNone, this will stop any microphone capture.
 If value is WKMediaCaptureStateMuted, any active microphone capture will become muted.
 If value is WKMediaCaptureStateActive, any muted microphone capture will become active.
 */
- (void)setMicrophoneCaptureState:(WKMediaCaptureState)state completionHandler:(WK_SWIFT_UI_ACTOR void (^_Nullable)(void))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));

/*! @abstract Get a snapshot for the visible viewport of WKWebView.
 @param snapshotConfiguration An object that specifies how the snapshot is configured.
 @param completionHandler A block to invoke when the snapshot is ready.
 @discussion If the WKSnapshotConfiguration is nil, the method will snapshot the bounds of the 
 WKWebView and create an image that is the width of the bounds of the WKWebView and scaled to the 
 device scale. The completionHandler is passed the image of the viewport contents or an error.
 */
#if TARGET_OS_IPHONE
- (void)takeSnapshotWithConfiguration:(nullable WKSnapshotConfiguration *)snapshotConfiguration completionHandler:(WK_SWIFT_UI_ACTOR void (^)(UIImage * _Nullable snapshotImage, NSError * _Nullable error))completionHandler WK_SWIFT_ASYNC_NAME(takeSnapshot(configuration:)) WK_API_AVAILABLE(ios(11.0));
#else
- (void)takeSnapshotWithConfiguration:(nullable WKSnapshotConfiguration *)snapshotConfiguration completionHandler:(WK_SWIFT_UI_ACTOR void (^)(NSImage * _Nullable snapshotImage, NSError * _Nullable error))completionHandler WK_SWIFT_ASYNC_NAME(takeSnapshot(configuration:)) WK_API_AVAILABLE(macos(10.13));
#endif

/*! @abstract Create a PDF document representation from the web page currently displayed in the WKWebView
@param pdfConfiguration An object that specifies how the PDF capture is configured.
@param completionHandler A block to invoke when the pdf document data is ready.
@discussion If the WKPDFConfiguration is nil, the method will create a PDF document representing the bounds of the currently displayed web page.
The completionHandler is passed the resulting PDF document data or an error.
The data can be used to create a PDFDocument object.
If the data is written to a file the resulting file is a valid PDF document.
*/
- (void)createPDFWithConfiguration:(nullable WKPDFConfiguration *)pdfConfiguration completionHandler:(WK_SWIFT_UI_ACTOR void (^)(NSData * _Nullable pdfDocumentData, NSError * _Nullable error))completionHandler NS_REFINED_FOR_SWIFT WK_API_AVAILABLE(macos(11.0), ios(14.0));

/* @abstract Create WebKit web archive data representing the current web content of the WKWebView
@param completionHandler A block to invoke when the web archive data is ready.
@discussion WebKit web archive data represents a snapshot of web content.
It can be used to represent web content on a pasteboard, loaded into a WKWebView directly, and saved to a file for later use.
The uniform type identifier kUTTypeWebArchive can be used get the related pasteboard type and MIME type.
*/
- (void)createWebArchiveDataWithCompletionHandler:(WK_SWIFT_UI_ACTOR void (^)(NSData * _Nullable, NSError * _Nullable))completionHandler NS_REFINED_FOR_SWIFT WK_API_AVAILABLE(macos(11.0), ios(14.0));

/*! @abstract A Boolean value indicating whether horizontal swipe gestures
 will trigger back-forward list navigations.
 @discussion The default value is NO.
 */
@property (nonatomic) BOOL allowsBackForwardNavigationGestures;

/*! @abstract The custom user agent string or nil if no custom user agent string has been set.
*/
@property (nullable, nonatomic, copy) NSString *customUserAgent WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @abstract A Boolean value indicating whether link preview is allowed for any
 links inside this WKWebView.
 @discussion The default value is YES on Mac and iOS.
 */
@property (nonatomic) BOOL allowsLinkPreview WK_API_AVAILABLE(macos(10.11), ios(9.0));

#if TARGET_OS_IPHONE
/*! @abstract The scroll view associated with the web view.
 */
@property (nonatomic, readonly, strong) UIScrollView *scrollView;
#endif

#if !TARGET_OS_IPHONE
/* @abstract A Boolean value indicating whether magnify gestures will
 change the web view's magnification.
 @discussion It is possible to set the magnification property even if
 allowsMagnification is set to NO.
 The default value is NO.
 */
@property (nonatomic) BOOL allowsMagnification;

/* @abstract The factor by which the viewport of the page is currently scaled.
 @discussion The default value is 1.0.
 */
@property (nonatomic) CGFloat magnification;

/* @abstract Scales the page content by a specified factor and centers the
 result on a specified point.
 * @param magnification The factor by which to scale the content.
 * @param point The point (in view space) on which to center magnification.
 */
- (void)setMagnification:(CGFloat)magnification centeredAtPoint:(CGPoint)point;

#endif

/* @abstract The factor by which page content is scaled relative to the viewport.
@discussion The default value is 1.0.
 Changing this value is equivalent to web content setting the CSS "zoom"
 property on all page content.
*/
@property (nonatomic) CGFloat pageZoom WK_API_AVAILABLE(macos(11.0), ios(14.0));

/* @abstract Searches the page contents for the given string.
 @param string The string to search for.
 @param configuration A set of options configuring the search.
 @param completionHandler A block to invoke when the search completes.
 @discussion If the WKFindConfiguration is nil, all of the default WKFindConfiguration values will be used.
  A match found by the search is selected and the page is scrolled to reveal the selection.
  The completion handler is called after the search completes.
*/
- (void)findString:(NSString *)string withConfiguration:(nullable WKFindConfiguration *)configuration completionHandler:(WK_SWIFT_UI_ACTOR void (^)(WKFindResult *result))completionHandler NS_REFINED_FOR_SWIFT WK_API_AVAILABLE(macos(11.0), ios(14.0));

/* @abstract Checks whether or not WKWebViews handle the given URL scheme by default.
 @param scheme The URL scheme to check.
 */
+ (BOOL)handlesURLScheme:(NSString *)urlScheme WK_API_AVAILABLE(macos(10.13), ios(11.0));

/* @abstract Begins a download in the context of the currently displayed webpage as if the WKNavigationDelegate turned a navigation into a download instead
 @param request The request specifying the URL to download.
 @param completionHandler A block called when the download has started.
 @discussion The download needs its delegate to be set in the completionHandler to receive updates about its progress.
 */
- (void)startDownloadUsingRequest:(NSURLRequest *)request completionHandler:(WK_SWIFT_UI_ACTOR void(^)(WKDownload *))completionHandler WK_API_AVAILABLE(macos(11.3), ios(14.5));

/* @abstract Resumes a download that failed or was canceled.
 @param resumeData Data from a WKDownloadDelegate's didFailWithError or a WKDownload's cancel completionHandler.
 @param completionHandler A block called when the download has resumed.
 @discussion The download needs its delegate to be set in the completionHandler to receive updates about its progress.
 */
- (void)resumeDownloadFromResumeData:(NSData *)resumeData completionHandler:(WK_SWIFT_UI_ACTOR void(^)(WKDownload *))completionHandler WK_API_AVAILABLE(macos(11.3), ios(14.5));

/* @abstract The media type for the WKWebView
 @discussion The value of mediaType will override the normal value of the CSS media property.
 Setting the value to nil will restore the normal value.
 The default value is nil.
*/
@property (nonatomic, nullable, copy) NSString *mediaType WK_API_AVAILABLE(macos(11.0), ios(14.0));

/* @abstract The interaction state for the WKWebView
 @discussion The interaction state (back-forward list, currently loaded page, scroll position, form data...) for the WKWebView, which
 can be retrieved and set on another WKWebView to restore state.
*/
@property (nonatomic, nullable, copy) id interactionState WK_API_AVAILABLE(macos(12.0), ios(15.0));

/*! @abstract Sets the webpage contents from the passed data as if it was the
 response to the supplied request. The request is never actually sent to the
 supplied URL, though loads of resources defined in the NSData object would
 be performed.
 @param request The request specifying the base URL and other loading details
 to be used while interpreting the supplied data object.
 @param response A response that is used to interpret the supplied data object.
 @param data The data to use as the contents of the webpage.
 @result A new navigation.
*/
- (WKNavigation *)loadSimulatedRequest:(NSURLRequest *)request response:(NSURLResponse *)response responseData:(NSData *)data WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (WKNavigation *)loadSimulatedRequest:(NSURLRequest *)request withResponse:(NSURLResponse *)response responseData:(NSData *)data WK_API_DEPRECATED_WITH_REPLACEMENT("loadSimulatedRequest:response:responseData:", macos(12.0, 12.0), ios(15.0, 15.0));

/*! @abstract Navigates to the requested file URL on the filesystem.
 @param request The request specifying the file URL to which to navigate.
 @param readAccessURL The URL to allow read access to.
 @discussion If readAccessURL references a single file, only that file may be
 loaded by WebKit.
 If readAccessURL references a directory, files inside that file may be loaded by WebKit.
 @result A new navigation for the given file URL.
*/
- (WKNavigation *)loadFileRequest:(NSURLRequest *)request allowingReadAccessToURL:(NSURL *)readAccessURL WK_API_AVAILABLE(macos(12.0), ios(15.0));

/*! @abstract Sets the webpage contents from the passed HTML string as if it was
 the response to the supplied request. The request is never actually sent to the
 supplied URL, though loads of resources defined in the HTML string would be
 performed.
 @param request The request specifying the base URL and other loading details
 to be used while interpreting the supplied data object.
 @param string The data to use as the contents of the webpage.
 @result A new navigation.
*/
- (WKNavigation *)loadSimulatedRequest:(NSURLRequest *)request responseHTMLString:(NSString *)string NS_SWIFT_NAME(loadSimulatedRequest(_:responseHTML:)) WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (WKNavigation *)loadSimulatedRequest:(NSURLRequest *)request withResponseHTMLString:(NSString *)string NS_SWIFT_NAME(loadSimulatedRequest(_:withResponseHTML:)) WK_API_DEPRECATED_WITH_REPLACEMENT("loadSimulatedRequest:responseHTMLString:", macos(12.0, 12.0), ios(15.0, 15.0));

#if !TARGET_OS_IPHONE
/* @abstract Returns an NSPrintOperation object configured to print the contents of this WKWebView
@param printInfo The print info object used to configure the resulting print operation.
*/
- (NSPrintOperation *)printOperationWithPrintInfo:(NSPrintInfo *)printInfo WK_API_AVAILABLE(macos(11.0));
#endif

/*! @abstract The theme color of the active page.
 @discussion This is the CSS color parsed value of the `contents`
 attribute of the first valid
 @textblock
    <meta name="theme-color" contents="...">
 @/textblock
 element in the current main document.
 @link WKWebView @/link is key-value observing (KVO) compliant for this
 property.
 */
#if TARGET_OS_IPHONE
@property (nonatomic, readonly, nullable) UIColor *themeColor WK_API_AVAILABLE(ios(15.0));
#else
@property (nonatomic, readonly, nullable) NSColor *themeColor WK_API_AVAILABLE(macos(12.0));
#endif

/*! @abstract The color drawn behind the active page.
 @discussion A color derived from the content of the active page, such as by blending the background color of
 the <html> and <body> elements with the @link backgroundColor @/link of this @link WKWebView @/link. Used as
 the background color under the page's content, such as for scroll bouncing areas. Can be overridden by the
 owner application for custom styling without having to modify the page's style.
 the background of scroll bouncing areas.
 @link WKWebView @/link is key-value observing (KVO) compliant for this property.
 */
#if TARGET_OS_IPHONE
@property (nonatomic, null_resettable, copy) UIColor *underPageBackgroundColor WK_API_AVAILABLE(ios(15.0));
#else
@property (nonatomic, null_resettable, copy) NSColor *underPageBackgroundColor WK_API_AVAILABLE(macos(12.0));
#endif

/*! @abstract A WKWebView's fullscreen state.
 @discussion @link WKWebView @link is key-value observing (KVO) compliant for this property. When an element
 in the WKWebView enters fullscreen, WebKit will replace the WKWebView in the application view hierarchy with
 a "placeholder" view, and move the WKWebView into a fullscreen window. When the element exits fullscreen later,
 the WKWebView will be moved back into the application view hierarchy. An application may need to adjust/restore
 its native UI components when the fullscreen state changes. The application should observe the fullscreenState
 property of WKWebView in order to receive notifications regarding the fullscreen state change.
 */
@property (nonatomic, readonly) WKFullscreenState fullscreenState WK_API_AVAILABLE(macos(13.0), ios(16.0));

/*! @abstract Insets from the @link frame @/link that represent the smallest and largest possible size of the
 visual area of the @link WKWebView @/link based on the state of the surrounding UI.
 @discussion For apps with size-changing UI around the @link WKWebView @/link, specify minimumViewportInset and
 maximumViewportInset to supply webpages with the appropriate value for CSS "large viewport" `lv*`
 units and CSS "small viewport" `sv*` units respectively @link https://www.w3.org/TR/css-values-4/#viewport-variants @/link.
 Set minimumViewportInset to the smallest inset a webpage may experience in your app's maximally
 collapsed UI configuration. Set maximumViewportInset to the largest inset a webpage may experience
 in your app's maximally expanded UI configuration. For apps where the maximally collapsed UI
 configuration is such that the @link WKWebView @/link is not surrounded by anything, there is no need to specify
 minimumViewportInset. For apps with fixed-sized UI surrounding the @link WKWebView @/link, there is no need to
 specify either value. Both values must be either zero or positive, and maximumViewportInset must be
 larger than minimumViewportInset.
 */
#if TARGET_OS_IPHONE
@property (nonatomic, readonly) UIEdgeInsets minimumViewportInset WK_API_AVAILABLE(ios(15.5));
@property (nonatomic, readonly) UIEdgeInsets maximumViewportInset WK_API_AVAILABLE(ios(15.5));
- (void)setMinimumViewportInset:(UIEdgeInsets)minimumViewportInset maximumViewportInset:(UIEdgeInsets)maximumViewportInset WK_API_AVAILABLE(ios(15.5));
#else
@property (nonatomic, readonly) NSEdgeInsets minimumViewportInset WK_API_AVAILABLE(macos(13.0));
@property (nonatomic, readonly) NSEdgeInsets maximumViewportInset WK_API_AVAILABLE(macos(13.0));
- (void)setMinimumViewportInset:(NSEdgeInsets)minimumViewportInset maximumViewportInset:(NSEdgeInsets)maximumViewportInset WK_API_AVAILABLE(macos(13.0));
#endif

#if TARGET_OS_IOS || (defined(TARGET_OS_VISION) && TARGET_OS_VISION)

/*! @abstract Enables the web view's built-in find interaction. */
@property (nonatomic, readwrite, getter=isFindInteractionEnabled) BOOL findInteractionEnabled WK_API_AVAILABLE(ios(16.0));

/*! @abstract If  @link findInteractionEnabled @/link is set to true, returns this web view's built-in find interaction. Otherwise, nil. */
@property (nonatomic, nullable, readonly) UIFindInteraction *findInteraction WK_API_AVAILABLE(ios(16.0));

#endif

/*!
@abstract Controls whether this @link WKWebView @/link is inspectable in Web Inspector.
@discussion The default value is NO.
*/
@property (nonatomic, getter=isInspectable) BOOL inspectable NS_SWIFT_NAME(isInspectable) WK_API_AVAILABLE(macos(13.3), ios(16.4));

/*! @abstract A Boolean value indicating whether Writing Tools is active for the view.
 @discussion @link WKWebView @/link is key-value observing (KVO) compliant for this property.
 */
@property (nonatomic, readonly, getter=isWritingToolsActive) BOOL writingToolsActive WK_API_AVAILABLE(macos(15.0), ios(18.0)) WK_API_UNAVAILABLE(visionos);

@end

#if !TARGET_OS_IPHONE

@interface WKWebView (WKIBActions) <NSUserInterfaceValidations>

/*! @abstract Action method that navigates to the back item in the
 back-forward list.
 @param sender The object that sent this message.
 */
- (IBAction)goBack:(nullable id)sender;

/*! @abstract Action method that navigates to the forward item in the
 back-forward list.
 @param sender The object that sent this message.
 */
- (IBAction)goForward:(nullable id)sender;

/*! @abstract Action method that reloads the current page.
 @param sender The object that sent this message.
 */
- (IBAction)reload:(nullable id)sender;

/*! @abstract Action method that reloads the current page, performing
 end-to-end revalidation using cache-validating conditionals if possible.
 @param sender The object that sent this message.
 */
- (IBAction)reloadFromOrigin:(nullable id)sender;

/*! @abstract Action method that stops loading all resources on the current
 page.
 @param sender The object that sent this message.
 */
- (IBAction)stopLoading:(nullable id)sender;

@end

WK_API_AVAILABLE(macos(10.15.4))
@interface WKWebView (WKNSTextFinderClient) <NSTextFinderClient>
@end

#endif

@interface WKWebView (WKDeprecated)

@property (nonatomic, readonly, copy) NSArray *certificateChain WK_API_DEPRECATED_WITH_REPLACEMENT("serverTrust", macos(10.11, 10.12), ios(9.0, 10.0));

@end

NS_ASSUME_NONNULL_END
