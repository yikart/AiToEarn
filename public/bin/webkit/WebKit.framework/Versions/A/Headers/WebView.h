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

@class DOMCSSStyleDeclaration;
@class DOMDocument;
@class DOMElement;
@class DOMNode;
@class DOMRange;

@class WebArchive;
@class WebBackForwardList;
@class WebDataSource;
@class WebFrame;
@class WebFrameView;
@class WebHistoryItem;
@class WebPreferences;
@class WebScriptObject;
@class WebViewPrivate;

@protocol WebDownloadDelegate;
@protocol WebEditingDelegate;
@protocol WebFrameLoadDelegate;
@protocol WebPolicyDelegate;
@protocol WebResourceLoadDelegate;
@protocol WebUIDelegate;

// Element dictionary keys
extern NSString *WebElementDOMNodeKey WEBKIT_DEPRECATED_MAC(10_3, 10_14); // DOMNode of the element
extern NSString *WebElementFrameKey WEBKIT_DEPRECATED_MAC(10_3, 10_14); // WebFrame of the element
extern NSString *WebElementImageAltStringKey WEBKIT_DEPRECATED_MAC(10_3, 10_14); // NSString of the ALT attribute of the image element
extern NSString *WebElementImageKey WEBKIT_DEPRECATED_MAC(10_3, 10_14); // NSImage of the image element
extern NSString *WebElementImageRectKey WEBKIT_DEPRECATED_MAC(10_3, 10_14); // NSValue of an NSRect, the rect of the image element
extern NSString *WebElementImageURLKey WEBKIT_DEPRECATED_MAC(10_3, 10_14); // NSURL of the image element
extern NSString *WebElementIsSelectedKey WEBKIT_DEPRECATED_MAC(10_3, 10_14); // NSNumber of BOOL indicating whether the element is selected or not
extern NSString *WebElementLinkURLKey WEBKIT_DEPRECATED_MAC(10_3, 10_14); // NSURL of the link if the element is within an anchor
extern NSString *WebElementLinkTargetFrameKey WEBKIT_DEPRECATED_MAC(10_3, 10_14); // WebFrame of the target of the anchor
extern NSString *WebElementLinkTitleKey WEBKIT_DEPRECATED_MAC(10_3, 10_14); // NSString of the title of the anchor
extern NSString *WebElementLinkLabelKey WEBKIT_DEPRECATED_MAC(10_3, 10_14); // NSString of the text within the anchor

/*
    @discussion Notifications sent by WebView to mark the progress of loads.
    @constant WebViewProgressStartedNotification Posted whenever a load begins in the WebView, including
    a load that is initiated in a subframe.  After receiving this notification zero or more
    WebViewProgressEstimateChangedNotifications will be sent.  The userInfo will be nil.
    @constant WebViewProgressEstimateChangedNotification Posted whenever the value of
    estimatedProgress changes.  The userInfo will be nil.
    @constant WebViewProgressFinishedNotification Posted when the load for a WebView has finished.
    The userInfo will be nil.
*/
extern NSString *WebViewProgressStartedNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);
extern NSString *WebViewProgressEstimateChangedNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);
extern NSString *WebViewProgressFinishedNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);

/*!
    @class WebView
    WebView manages the interaction between WebFrameViews and WebDataSources.  Modification
    of the policies and behavior of the WebKit is largely managed by WebViews and their
    delegates.
    
    <p>
    Typical usage:
    </p>
    <pre>
    WebView *webView;
    WebFrame *mainFrame;
    
    webView  = [[WebView alloc] initWithFrame: NSMakeRect (0,0,640,480)];
    mainFrame = [webView mainFrame];
    [mainFrame loadRequest:request];
    </pre>
    
    WebViews have the following delegates:  WebUIDelegate, WebResourceLoadDelegate,
    WebFrameLoadDelegate, and WebPolicyDelegate.
    
    WebKit depends on the WebView's WebUIDelegate for all window
    related management, including opening new windows and controlling the user interface
    elements in those windows.
    
    WebResourceLoadDelegate is used to monitor the progress of resources as they are
    loaded.  This delegate may be used to present users with a progress monitor.
    
    The WebFrameLoadDelegate receives messages when the URL in a WebFrame is
    changed.
    
    WebView's WebPolicyDelegate can make determinations about how
    content should be handled, based on the resource's URL and MIME type.
*/
WEBKIT_CLASS_DEPRECATED_MAC(10_3, 10_14, "No longer supported; please adopt WKWebView.")
@interface WebView : NSView
{
@private
    WebViewPrivate *_private;
}

/*!
    @method canShowMIMEType:
    @abstract Checks if the WebKit can show content of a certain MIME type.
    @param MIMEType The MIME type to check.
    @result YES if the WebKit can show content with MIMEtype.
*/
+ (BOOL)canShowMIMEType:(NSString *)MIMEType;


/*!
     @method canShowMIMETypeAsHTML:
     @abstract Checks if the MIME type is a type that the WebKit will interpret as HTML.
     @param MIMEType The MIME type to check.
     @result YES if the MIMEtype in an HTML type.
*/
+ (BOOL)canShowMIMETypeAsHTML:(NSString *)MIMEType;

/*!
    @method MIMETypesShownAsHTML
    @result Returns an array of NSStrings that describe the MIME types
    WebKit will attempt to render as HTML.
*/
+ (NSArray *)MIMETypesShownAsHTML;

/*!
    @method setMIMETypesShownAsHTML:
    @discussion Sets the array of NSString MIME types that WebKit will
    attempt to render as HTML.  Typically you will retrieve the built-in
    array using MIMETypesShownAsHTML and add additional MIME types to that
    array.
*/
+ (void)setMIMETypesShownAsHTML:(NSArray *)MIMETypes;

/*!
    @method URLFromPasteboard:
    @abstract Returns a URL from a pasteboard
    @param pasteboard The pasteboard with a URL
    @result A URL if the pasteboard has one. Nil if it does not.
    @discussion This method differs than NSURL's URLFromPasteboard method in that it tries multiple pasteboard types
    including NSURLPboardType to find a URL on the pasteboard.
*/
+ (NSURL *)URLFromPasteboard:(NSPasteboard *)pasteboard;

/*!
    @method URLTitleFromPasteboard:
    @abstract Returns a URL title from a pasteboard
    @param pasteboard The pasteboard with a URL title
    @result A URL title if the pasteboard has one. Nil if it does not.
    @discussion This method returns a title that refers a URL on the pasteboard. An example of this is the link label
    which is the text inside the anchor tag.
*/
+ (NSString *)URLTitleFromPasteboard:(NSPasteboard *)pasteboard;

/*!
    @method registerURLSchemeAsLocal:
    @abstract Adds the scheme to the list of schemes to be treated as local.
    @param scheme The scheme to register
*/
+ (void)registerURLSchemeAsLocal:(NSString *)scheme;

/*!
    @method initWithFrame:frameName:groupName:
    @abstract The designated initializer for WebView.
    @discussion Initialize a WebView with the supplied parameters. This method will 
    create a main WebFrame with the view. Passing a top level frame name is useful if you
    handle a targetted frame navigation that would normally open a window in some other 
    way that still ends up creating a new WebView.
    @param frame The frame used to create the view.
    @param frameName The name to use for the top level frame. May be nil.
    @param groupName The name of the webView set to which this webView will be added.  May be nil.
    @result Returns an initialized WebView.
*/
- (instancetype)initWithFrame:(NSRect)frame frameName:(NSString *)frameName groupName:(NSString *)groupName;

/*!
    @method close
    @abstract Closes the receiver, unloading its web page and canceling any pending loads.
    Once the receiver has closed, it will no longer respond to requests or fire delegate methods.
    (However, the -close method itself may fire delegate methods.)
    @discussion A garbage collected application is required to call close when the receiver is no longer needed.
    The close method will be called automatically when the window or hostWindow closes and shouldCloseWithWindow returns YES.
    A non-garbage collected application can still call close, providing a convenient way to prevent receiver
    from doing any more loading and firing any future delegate methods.
*/
- (void)close;

/*!
    @property shouldCloseWithWindow
    @abstract Whether the receiver closes when either it's window or hostWindow closes.
    @discussion Defaults to YES in garbage collected applications, otherwise NO to maintain backwards compatibility.
*/
@property (nonatomic) BOOL shouldCloseWithWindow;

/*!
    @property UIDelegate
    @abstract The WebView's WebUIDelegate.
*/
@property (nonatomic, assign) id <WebUIDelegate> UIDelegate;

/*!
    @property resourceLoadDelegate
    @abstract The WebView's WebResourceLoadDelegate.
*/
@property (nonatomic, assign) id <WebResourceLoadDelegate> resourceLoadDelegate;

/*!
    @property downloadDelegate
    @abstract The WebView's WebDownloadDelegate.
*/
@property (nonatomic, assign) id <WebDownloadDelegate> downloadDelegate;

/*!
    @property frameLoadDelegate
    @abstract The WebView's WebFrameLoadDelegate delegate.
*/
@property (nonatomic, assign) id <WebFrameLoadDelegate> frameLoadDelegate;

/*!
    @property policyDelegate
    @abstract The WebView's WebPolicyDelegate.
*/
@property (nonatomic, assign) id <WebPolicyDelegate> policyDelegate;

/*!
    @property mainFrame
    @abstract The top level frame.
    @discussion Note that even documents that are not framesets will have a mainFrame.
*/
@property (nonatomic, readonly, strong) WebFrame *mainFrame;

/*!
    @property selectedFrame
    @abstract The frame that has the active selection.
    @discussion Returns the frame that contains the first responder, if any. Otherwise returns the
    frame that contains a non-zero-length selection, if any. Returns nil if no frame meets these criteria.
*/
@property (nonatomic, readonly, strong) WebFrame *selectedFrame;

/*!
    @property backForwardList
    @abstract The backforward list for this WebView.
*/    
@property (nonatomic, readonly, strong) WebBackForwardList *backForwardList;

/*!
    @method setMaintainsBackForwardList:
    @abstract Enable or disable the use of a backforward list for this webView.
    @param flag Turns use of the back forward list on or off
*/    
- (void)setMaintainsBackForwardList:(BOOL)flag;

/*!
    @method goBack
    @abstract Go back to the previous URL in the backforward list.
    @result YES if able to go back in the backforward list, NO otherwise.
*/    
- (BOOL)goBack;

/*!
    @method goForward
    @abstract Go forward to the next URL in the backforward list.
    @result YES if able to go forward in the backforward list, NO otherwise.
*/    
- (BOOL)goForward;

/*!
    @method goToBackForwardItem:
    @abstract Go back or forward to an item in the backforward list.
    @result YES if able to go to the item, NO otherwise.
*/    
- (BOOL)goToBackForwardItem:(WebHistoryItem *)item;

/*!
    @property textSizeMultiplier
    @abstract The text size multipler.
*/    
@property (nonatomic) float textSizeMultiplier;

/*!
    @property applicationNameForUserAgent
    @abstract The name of the application as used in the user-agent string.
*/
@property (nonatomic, copy) NSString *applicationNameForUserAgent;

/*!
    @method setCustomUserAgent:
    @abstract Set the user agent. 
    @discussion .
    @param userAgentString The user agent description
*/

/*!
    @property customUserAgent
    @abstract The custom user-agent string or nil if no custom user-agent string has been set.
    @discussion Setting this means that the webView should use this user-agent string
 instead of constructing a user-agent string for each URL. Setting it to nil
 causes the webView to construct the user-agent string for each URL
 for best results rendering web pages
*/
@property (nonatomic, copy) NSString *customUserAgent;

/*!
    @method userAgentForURL:
    @abstract Get the appropriate user-agent string for a particular URL.
    @param URL The URL.
    @result The user-agent string for the supplied URL.
*/
- (NSString *)userAgentForURL:(NSURL *)URL;


/*!
    @property supportsTextEncoding
    @abstract If the document view of the current web page can support different text encodings.
*/
@property (nonatomic, readonly) BOOL supportsTextEncoding;

/*!
    @property customTextEncodingName
    @abstract The custom text encoding name or nil if no custom text encoding name has been set.
    @discussion Make the page display with a different text encoding; stops any load in progress.
    The text encoding passed in overrides the normal text encoding smarts including
    what's specified in a web page's header or HTTP response.
    The text encoding automatically goes back to the default when the top level frame
    changes to a new location.
    Setting the text encoding name to nil makes the webView use default encoding rules.

*/
@property (nonatomic, copy) NSString *customTextEncodingName;

/*!
    @property mediaStyle
    @abstract The media style for the WebView.
    @discussion The mediaStyle will override the normal value
    of the CSS media property. Setting the value to nil will restore the normal value. The value will be nil unless explicitly set.
*/
@property (nonatomic, copy) NSString *mediaStyle;

/*!
    @method stringByEvaluatingJavaScriptFromString:
    @param script The text of the JavaScript.
    @result The result of the script, converted to a string, or nil for failure.
*/
- (NSString *)stringByEvaluatingJavaScriptFromString:(NSString *)script;

/*!
    @property windowScriptObject
    @abstract A WebScriptObject that represents the
    window object from the script environment.
*/
@property (nonatomic, readonly, strong) WebScriptObject *windowScriptObject;

/*!
    @property preferences
    @abstract The preferences used by this WebView.
    @discussion This method will return [WebPreferences standardPreferences] if no
    other instance of WebPreferences has been set.
*/
@property (nonatomic, strong) WebPreferences *preferences;

/*!
    @property preferencesIdentifier
    @abstract The WebPreferences key prefix.
    @discussion If the WebPreferences for this WebView are stored in the user defaults database, this string will be used as a key prefix.
*/
@property (nonatomic, copy) NSString *preferencesIdentifier;

/*!
    @property hostWindow
    @abstract The host window for the web view.
    @discussion Parts of WebKit (such as plug-ins and JavaScript) depend on a window to function
    properly. Set a host window so these parts continue to function even when the web view is
    not in an actual window.
*/
@property (nonatomic, strong) NSWindow *hostWindow;

/*!
    @method searchFor:direction:caseSensitive:
    @abstract Searches a document view for a string and highlights the string if it is found.
    Starts the search from the current selection.  Will search across all frames.
    @param string The string to search for.
    @param forward YES to search forward, NO to seach backwards.
    @param caseFlag YES to for case-sensitive search, NO for case-insensitive search.
    @result YES if found, NO if not found.
*/
- (BOOL)searchFor:(NSString *)string direction:(BOOL)forward caseSensitive:(BOOL)caseFlag wrap:(BOOL)wrapFlag;

/*!
    @method registerViewClass:representationClass:forMIMEType:
    @discussion Register classes that implement WebDocumentView and WebDocumentRepresentation respectively.
    A document class may register for a primary MIME type by excluding
    a subtype, i.e. "video/" will match the document class with
    all video types.  More specific matching takes precedence
    over general matching.
    @param viewClass The WebDocumentView class to use to render data for a given MIME type.
    @param representationClass The WebDocumentRepresentation class to use to represent data of the given MIME type.
    @param MIMEType The MIME type to represent with an object of the given class.
*/
+ (void)registerViewClass:(Class)viewClass representationClass:(Class)representationClass forMIMEType:(NSString *)MIMEType;

/*!
    @property groupName
    @abstract The group name for this WebView.
    @discussion JavaScript may access named frames within the same group.
*/
@property (nonatomic, copy) NSString *groupName;

/*!
    @property estimatedProgress
    @discussion An estimate of the percent complete for a document load.  This
    value will range from 0 to 1.0 and, once a load completes, will remain at 1.0 
    until a new load starts, at which point it will be reset to 0.  The value is an
    estimate based on the total number of bytes expected to be received
    for a document, including all it's possible subresources.  For more accurate progress
    indication it is recommended that you implement a WebFrameLoadDelegate and a
    WebResourceLoadDelegate.
*/
@property (nonatomic, readonly) double estimatedProgress;

/*!
    @property loading
    @abstract Whether there are any pending loads in this WebView.
*/
@property (nonatomic, getter=isLoading, readonly) BOOL loading;

/*!
    @method elementAtPoint:
    @param point A point in the coordinates of the WebView
    @result An element dictionary describing the point
*/
- (NSDictionary *)elementAtPoint:(NSPoint)point;

/*!
    @property pasteboardTypesForSelection
    @abstract The pasteboard types that the WebView can use for the current selection
*/
@property (nonatomic, readonly, copy) NSArray *pasteboardTypesForSelection;

/*!
    @method writeSelectionWithPasteboardTypes:toPasteboard:
    @abstract Writes the current selection to the pasteboard
    @param types The types that WebView will write to the pasteboard
    @param pasteboard The pasteboard to write to
*/
- (void)writeSelectionWithPasteboardTypes:(NSArray *)types toPasteboard:(NSPasteboard *)pasteboard;

/*!
    @method pasteboardTypesForElement:
    @abstract Returns the pasteboard types that WebView can use for an element
    @param element The element
*/
- (NSArray *)pasteboardTypesForElement:(NSDictionary *)element;

/*!
    @method writeElement:withPasteboardTypes:toPasteboard:
    @abstract Writes an element to the pasteboard
    @param element The element to write to the pasteboard
    @param types The types that WebView will write to the pasteboard
    @param pasteboard The pasteboard to write to
*/
- (void)writeElement:(NSDictionary *)element withPasteboardTypes:(NSArray *)types toPasteboard:(NSPasteboard *)pasteboard;

/*!
    @method moveDragCaretToPoint:
    @param point A point in the coordinates of the WebView
    @discussion This method moves the caret that shows where something being dragged will be dropped. It may cause the WebView to scroll
    to make the new position of the drag caret visible.
*/
- (void)moveDragCaretToPoint:(NSPoint)point;

/*!
    @method removeDragCaret
    @abstract Removes the drag caret from the WebView
*/
- (void)removeDragCaret;

/*!
    @property drawsBackground
    @abstract Whether the receiver draws a default white background when the loaded page has no background specified.
*/
@property (nonatomic) BOOL drawsBackground;

/*!
    @property shouldUpdateWhileOffscreen
    @abstract Whether the WebView is always updated even when it is not in a window that is currently visible.
    @discussion If set to NO, then whenever the web view is not in a visible window, updates to the web page will not necessarily be rendered in the view.
    However, when the window is made visible, the view will be updated automatically. Not updating while hidden can improve performance. If set to is YES,
    hidden web views are always updated. This is the default.
*/
@property (nonatomic) BOOL shouldUpdateWhileOffscreen;

/*!
    @property mainFrameURL
    @abstract The main frame's current URL.
*/
@property (nonatomic, copy) NSString *mainFrameURL;

/*!
    @property mainFrameDocument
    @abstract The main frame's DOMDocument.
*/
@property (nonatomic, readonly, strong) DOMDocument *mainFrameDocument;

/*!
    @property mainFrameTitle
    @abstract The main frame's title if any, otherwise an empty string.
*/
@property (nonatomic, readonly, copy) NSString *mainFrameTitle;

/*!
    @property mainFrameIcon
    @abstract The site icon for the current page loaded in the mainFrame, or nil.
*/
@property (nonatomic, readonly, strong) NSImage *mainFrameIcon;

@end

@interface WebView (WebIBActions) <NSUserInterfaceValidations>
- (IBAction)takeStringURLFrom:(id)sender;
- (IBAction)stopLoading:(id)sender;
- (IBAction)reload:(id)sender;
- (IBAction)reloadFromOrigin:(id)sender;
@property (nonatomic, readonly) BOOL canGoBack;
- (IBAction)goBack:(id)sender;
@property (nonatomic, readonly) BOOL canGoForward;
- (IBAction)goForward:(id)sender;
@property (nonatomic, readonly) BOOL canMakeTextLarger;
- (IBAction)makeTextLarger:(id)sender;
@property (nonatomic, readonly) BOOL canMakeTextSmaller;
- (IBAction)makeTextSmaller:(id)sender;
@property (nonatomic, readonly) BOOL canMakeTextStandardSize;
- (IBAction)makeTextStandardSize:(id)sender;
- (IBAction)toggleContinuousSpellChecking:(id)sender;
- (IBAction)toggleSmartInsertDelete:(id)sender;
@end


// WebView editing support

extern NSString * const WebViewDidBeginEditingNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);
extern NSString * const WebViewDidChangeNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);
extern NSString * const WebViewDidEndEditingNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);
extern NSString * const WebViewDidChangeTypingStyleNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);
extern NSString * const WebViewDidChangeSelectionNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);

@interface WebView (WebViewCSS)
- (DOMCSSStyleDeclaration *)computedStyleForElement:(DOMElement *)element pseudoElement:(NSString *)pseudoElement;
@end

@interface WebView (WebViewEditing)
- (DOMRange *)editableDOMRangeForPoint:(NSPoint)point;
- (void)setSelectedDOMRange:(DOMRange *)range affinity:(NSSelectionAffinity)selectionAffinity;
@property (nonatomic, readonly, strong) DOMRange *selectedDOMRange;
@property (nonatomic, readonly) NSSelectionAffinity selectionAffinity;
@property (nonatomic, readonly) BOOL maintainsInactiveSelection;
@property (nonatomic, getter=isEditable) BOOL editable;
@property (nonatomic, strong) DOMCSSStyleDeclaration *typingStyle;
@property (nonatomic) BOOL smartInsertDeleteEnabled;
@property (nonatomic, getter=isContinuousSpellCheckingEnabled) BOOL continuousSpellCheckingEnabled;
@property (nonatomic, readonly) NSInteger spellCheckerDocumentTag;
@property (nonatomic, readonly, strong) NSUndoManager *undoManager;
@property (nonatomic, assign) id <WebEditingDelegate> editingDelegate;
- (DOMCSSStyleDeclaration *)styleDeclarationWithText:(NSString *)text;
@end

@interface WebView (WebViewUndoableEditing)
- (void)replaceSelectionWithNode:(DOMNode *)node; 
- (void)replaceSelectionWithText:(NSString *)text;    
- (void)replaceSelectionWithMarkupString:(NSString *)markupString;
- (void)replaceSelectionWithArchive:(WebArchive *)archive;
- (void)deleteSelection;    
- (void)applyStyle:(DOMCSSStyleDeclaration *)style;
@end

@interface WebView (WebViewEditingActions)

- (void)copy:(id)sender;
- (void)cut:(id)sender;
- (void)paste:(id)sender;
- (void)copyFont:(id)sender;
- (void)pasteFont:(id)sender;
- (void)delete:(id)sender;
- (void)pasteAsPlainText:(id)sender;
- (void)pasteAsRichText:(id)sender;

- (void)changeFont:(id)sender;
- (void)changeAttributes:(id)sender;
- (void)changeDocumentBackgroundColor:(id)sender;
- (void)changeColor:(id)sender;

- (void)alignCenter:(id)sender;
- (void)alignJustified:(id)sender;
- (void)alignLeft:(id)sender;
- (void)alignRight:(id)sender;

- (void)checkSpelling:(id)sender;
- (void)showGuessPanel:(id)sender;
- (void)performFindPanelAction:(id)sender;

- (void)startSpeaking:(id)sender;
- (void)stopSpeaking:(id)sender;

- (void)moveToBeginningOfSentence:(id)sender;
- (void)moveToBeginningOfSentenceAndModifySelection:(id)sender;
- (void)moveToEndOfSentence:(id)sender;
- (void)moveToEndOfSentenceAndModifySelection:(id)sender;
- (void)selectSentence:(id)sender;

- (void)overWrite:(id)sender;

/* 
The following methods are declared in NSResponder.h.
WebView overrides each method in this list, providing
a custom implementation for each.
    
- (void)capitalizeWord:(id)sender;
- (void)centerSelectionInVisibleArea:(id)sender;
- (void)changeCaseOfLetter:(id)sender;
- (void)complete:(id)sender;
- (void)deleteBackward:(id)sender;
- (void)deleteBackwardByDecomposingPreviousCharacter:(id)sender;
- (void)deleteForward:(id)sender;
- (void)deleteToBeginningOfLine:(id)sender;
- (void)deleteToBeginningOfParagraph:(id)sender;
- (void)deleteToEndOfLine:(id)sender;
- (void)deleteToEndOfParagraph:(id)sender;
- (void)deleteWordBackward:(id)sender;
- (void)deleteWordForward:(id)sender;
- (void)indent:(id)sender;
- (void)insertBacktab:(id)sender;
- (void)insertNewline:(id)sender;
- (void)insertParagraphSeparator:(id)sender;
- (void)insertTab:(id)sender;
- (void)lowercaseWord:(id)sender;
- (void)moveBackward:(id)sender;
- (void)moveBackwardAndModifySelection:(id)sender;
- (void)moveDown:(id)sender;
- (void)moveDownAndModifySelection:(id)sender;
- (void)moveForward:(id)sender;
- (void)moveForwardAndModifySelection:(id)sender;
- (void)moveLeft:(id)sender;
- (void)moveLeftAndModifySelection:(id)sender;
- (void)moveRight:(id)sender;
- (void)moveRightAndModifySelection:(id)sender;
- (void)moveToBeginningOfDocument:(id)sender;
- (void)moveToBeginningOfDocumentAndModifySelection:(id)sender;
- (void)moveToBeginningOfLine:(id)sender;
- (void)moveToBeginningOfLineAndModifySelection:(id)sender;
- (void)moveToBeginningOfParagraph:(id)sender;
- (void)moveToBeginningOfParagraphAndModifySelection:(id)sender;
- (void)moveToEndOfDocument:(id)sender;
- (void)moveToEndOfDocumentAndModifySelection:(id)sender;
- (void)moveToEndOfLine:(id)sender;
- (void)moveToEndOfLineAndModifySelection:(id)sender;
- (void)moveToEndOfParagraph:(id)sender;
- (void)moveToEndOfParagraphAndModifySelection:(id)sender;
- (void)moveUp:(id)sender;
- (void)moveUpAndModifySelection:(id)sender;
- (void)moveWordBackward:(id)sender;
- (void)moveWordBackwardAndModifySelection:(id)sender;
- (void)moveWordForward:(id)sender;
- (void)moveWordForwardAndModifySelection:(id)sender;
- (void)moveWordLeft:(id)sender;
- (void)moveWordLeftAndModifySelection:(id)sender;
- (void)moveWordRight:(id)sender;
- (void)moveWordRightAndModifySelection:(id)sender;
- (void)pageDown:(id)sender;
- (void)pageUp:(id)sender;
- (void)scrollLineDown:(id)sender;
- (void)scrollLineUp:(id)sender;
- (void)scrollPageDown:(id)sender;
- (void)scrollPageUp:(id)sender;
- (void)selectAll:(id)sender;
- (void)selectLine:(id)sender;
- (void)selectParagraph:(id)sender;
- (void)selectWord:(id)sender;
- (void)uppercaseWord:(id)sender;
*/
 
@end

