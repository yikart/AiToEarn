/*
 * Copyright (C) 2005-2014 Apple Inc. All rights reserved.
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

#import <WebKit/WebView.h>
#import <WebKit/WebFramePrivate.h>
#import <JavaScriptCore/JSBase.h>

#if !defined(ENABLE_REMOTE_INSPECTOR)
// FIXME: Should we just remove this ENABLE flag everywhere?
#define ENABLE_REMOTE_INSPECTOR 1
#endif

@class UIColor;
@class UIImage;
@class NSError;
@class WebFrame;
@class WebDeviceOrientation;
@class WebGeolocationPosition;
@class WebInspector;
@class WebNotification;
@class WebPreferences;
@class WebScriptWorld;
@class WebSecurityOrigin;
@class WebTextIterator;
@protocol WebDeviceOrientationProvider;
@protocol WebFormDelegate;

// pending public WebElementDictionary keys
extern NSString *WebElementTitleKey;             // NSString of the title of the element (used by Safari)
extern NSString *WebElementSpellingToolTipKey;   // NSString of a tooltip representing misspelling or bad grammar (used internally)
extern NSString *WebElementIsContentEditableKey; // NSNumber indicating whether the inner non-shared node is content editable (used internally)
extern NSString *WebElementMediaURLKey;          // NSURL of the media element

// other WebElementDictionary keys
extern NSString *WebElementLinkIsLiveKey;        // NSNumber of BOOL indicating whether the link is live or not
extern NSString *WebElementIsInScrollBarKey;

// One of the subviews of the WebView entered compositing mode.
extern NSString *_WebViewDidStartAcceleratedCompositingNotification;

#if TARGET_OS_IOS || (defined(TARGET_OS_VISION) && TARGET_OS_VISION)
@protocol UIDropSession;
#endif

extern NSString * const WebViewWillCloseNotification;

typedef enum {
    WebInjectAtDocumentStart,
    WebInjectAtDocumentEnd,
} WebUserScriptInjectionTime;

typedef enum {
    WebInjectInAllFrames,
    WebInjectInTopFrameOnly
} WebUserContentInjectedFrames;

enum {
    WebFindOptionsCaseInsensitive = 1 << 0,
    WebFindOptionsAtWordStarts = 1 << 1,
    WebFindOptionsTreatMedialCapitalAsWordStart = 1 << 2,
    WebFindOptionsBackwards = 1 << 3,
    WebFindOptionsWrapAround = 1 << 4,
    WebFindOptionsStartInSelection = 1 << 5
};
typedef NSUInteger WebFindOptions;

typedef enum {
    WebPaginationModeUnpaginated,
    WebPaginationModeLeftToRight,
    WebPaginationModeRightToLeft,
    WebPaginationModeTopToBottom,
    WebPaginationModeBottomToTop,
} WebPaginationMode;

enum {
    WebDidFirstLayout = 1 << 0,
    WebDidFirstVisuallyNonEmptyLayout = 1 << 1,
    WebDidHitRelevantRepaintedObjectsAreaThreshold = 1 << 2
};
typedef NSUInteger WebLayoutMilestones;

typedef enum {
    WebPageVisibilityStateVisible,
    WebPageVisibilityStateHidden,
    WebPageVisibilityStatePrerender
} WebPageVisibilityState;

typedef enum {
    WebNotificationPermissionAllowed,
    WebNotificationPermissionNotAllowed,
    WebNotificationPermissionDenied
} WebNotificationPermission;

@interface WebView (WebViewEditingActionsPendingPublic)

- (void)outdent:(id)sender;
- (NSDictionary *)typingAttributes;

@end

@interface WebView (WebPendingPublic)

- (void)scheduleInRunLoop:(NSRunLoop *)runLoop forMode:(NSString *)mode;
- (void)unscheduleFromRunLoop:(NSRunLoop *)runLoop forMode:(NSString *)mode;

- (BOOL)findString:(NSString *)string options:(WebFindOptions)options;
- (DOMRange *)DOMRangeOfString:(NSString *)string relativeTo:(DOMRange *)previousRange options:(WebFindOptions)options;

- (void)setMainFrameDocumentReady:(BOOL)mainFrameDocumentReady;

- (void)setTabKeyCyclesThroughElements:(BOOL)cyclesElements;
- (BOOL)tabKeyCyclesThroughElements;

- (void)scrollDOMRangeToVisible:(DOMRange *)range;

/*!
@method setScriptDebugDelegate:
@abstract Set the WebView's WebScriptDebugDelegate delegate.
@param delegate The WebScriptDebugDelegate to set as the delegate.
*/    
- (void)setScriptDebugDelegate:(id)delegate;

/*!
@method scriptDebugDelegate
@abstract Return the WebView's WebScriptDebugDelegate.
@result The WebView's WebScriptDebugDelegate.
*/    
- (id)scriptDebugDelegate;

/*!
    @method setHistoryDelegate:
    @abstract Set the WebView's WebHistoryDelegate delegate.
    @param delegate The WebHistoryDelegate to set as the delegate.
*/    
- (void)setHistoryDelegate:(id)delegate;

/*!
    @method historyDelegate
    @abstract Return the WebView's WebHistoryDelegate delegate.
    @result The WebView's WebHistoryDelegate delegate.
*/    
- (id)historyDelegate;

- (BOOL)shouldClose;

/*!
    @method aeDescByEvaluatingJavaScriptFromString:
    @param script The text of the JavaScript.
    @result The result of the script, converted to an NSAppleEventDescriptor, or nil for failure.
*/
- (NSAppleEventDescriptor *)aeDescByEvaluatingJavaScriptFromString:(NSString *)script;

// Support for displaying multiple text matches.
// These methods might end up moving into a protocol, so different document types can specify
// whether or not they implement the protocol. For now we'll just deal with HTML.
// These methods are still in flux; don't rely on them yet.
- (BOOL)canMarkAllTextMatches;
- (NSUInteger)countMatchesForText:(NSString *)string options:(WebFindOptions)options highlight:(BOOL)highlight limit:(NSUInteger)limit markMatches:(BOOL)markMatches;
- (NSUInteger)countMatchesForText:(NSString *)string inDOMRange:(DOMRange *)range options:(WebFindOptions)options highlight:(BOOL)highlight limit:(NSUInteger)limit markMatches:(BOOL)markMatches;
- (void)unmarkAllTextMatches;
- (NSArray *)rectsForTextMatches;

// Support for disabling registration with the undo manager. This is equivalent to the methods with the same names on NSTextView.
- (BOOL)allowsUndo;
- (void)setAllowsUndo:(BOOL)flag;

/*!
    @method setPageSizeMultiplier:
    @abstract Change the zoom factor of the page in views managed by this webView.
    @param multiplier A fractional percentage value, 1.0 is 100%.
*/    
- (void)setPageSizeMultiplier:(float)multiplier;

/*!
    @method pageSizeMultiplier
    @result The page size multipler.
*/    
- (float)pageSizeMultiplier;

// Commands for doing page zoom.  Will end up in WebView (WebIBActions) <NSUserInterfaceValidations>
- (BOOL)canZoomPageIn;
- (IBAction)zoomPageIn:(id)sender;
- (BOOL)canZoomPageOut;
- (IBAction)zoomPageOut:(id)sender;
- (BOOL)canResetPageZoom;
- (IBAction)resetPageZoom:(id)sender;

// Sets a master volume control for all media elements in the WebView. Valid values are 0..1.
- (void)setMediaVolume:(float)volume;
- (float)mediaVolume;

- (void)suspendAllMediaPlayback;
- (void)resumeAllMediaPlayback;

@property (nonatomic, setter=_setAllowsLinkPreview:) BOOL _allowsLinkPreview;

// Add visited links
- (void)addVisitedLinks:(NSArray *)visitedLinks;
@end

@interface WebView (WebPrivate)

+ (void)_setIconLoadingEnabled:(BOOL)enabled;
+ (BOOL)_isIconLoadingEnabled;

@property (nonatomic, assign, setter=_setUseDarkAppearance:) BOOL _useDarkAppearance;
@property (nonatomic, assign, setter=_setUseElevatedUserInterfaceLevel:) BOOL _useElevatedUserInterfaceLevel;

- (void)_setUseDarkAppearance:(BOOL)useDarkAppearance useInactiveAppearance:(BOOL)useInactiveAppearance;
- (void)_setUseDarkAppearance:(BOOL)useDarkAppearance useElevatedUserInterfaceLevel:(BOOL)useElevatedUserInterfaceLevel;

- (WebInspector *)inspector;

#if ENABLE_REMOTE_INSPECTOR
+ (void)_enableRemoteInspector;
+ (void)_disableRemoteInspector;
+ (void)_disableAutoStartRemoteInspector;
+ (BOOL)_isRemoteInspectorEnabled;
+ (BOOL)_hasRemoteInspectorSession;

/*!
    @method allowsRemoteInspection
    @result Returns whether or not this WebView will allow a Remote Web Inspector
    to attach to it.
*/
- (BOOL)allowsRemoteInspection;

/*!
    @method setAllowsRemoteInspection:
    @param allow The new permission for this WebView.
    @abstract Sets the permission of this WebView to either allow or disallow
    a Remote Web Inspector to attach to it.
*/
- (void)setAllowsRemoteInspection:(BOOL)allow;

/*!
    @method setShowingInspectorIndication
    @param enabled Show the indication when true, hide when false.
    @abstract indicate this WebView on screen for a remote inspector.
*/
- (void)setShowingInspectorIndication:(BOOL)enabled;

#endif // ENABLE_REMOTE_INSPECTOR

/*!
    @method setBackgroundColor:
    @param backgroundColor Color to use as the default background.
    @abstract Sets what color the receiver draws under transparent page background colors and images.
    This color is also used when no page is loaded. A color with alpha should only be used when the receiver is
    in a non-opaque window, since the color is drawn using NSCompositeCopy.
*/
- (void)setBackgroundColor:(NSColor *)backgroundColor;

/*!
    @method backgroundColor
    @result Returns the background color drawn under transparent page background colors and images.
    This color is also used when no page is loaded. A color with alpha should only be used when the receiver is
    in a non-opaque window, since the color is drawn using NSCompositeCopy.
*/
- (NSColor *)backgroundColor;

/*!
Could be worth adding to the API.
 @method _loadBackForwardListFromOtherView:
 @abstract Loads the view with the contents of the other view, including its backforward list.
 @param otherView   The WebView from which to copy contents.
 */
- (void)_loadBackForwardListFromOtherView:(WebView *)otherView;

/*
 @method _reportException:inContext:
 @abstract Logs the exception to the Web Inspector. This only needs called for exceptions that
 occur while using the JavaScriptCore APIs with a context owned by a WebKit.
 @param exception The exception value to log.
 @param context   The context the exception occured in.
*/
+ (void)_reportException:(JSValueRef)exception inContext:(JSContextRef)context;

/*!
 @method _dispatchPendingLoadRequests:
 @abstract Dispatches any pending load requests that have been scheduled because of recent DOM additions or style changes.
 @discussion You only need to call this method if you require synchronous notification of loads through the resource load delegate.
 Otherwise the resource load delegate will be notified about loads during a future run loop iteration.
 */
- (void)_dispatchPendingLoadRequests;

+ (NSArray *)_supportedFileExtensions;

/*!
    @method canShowFile:
    @abstract Checks if the WebKit can show the content of the file at the specified path.
    @param path The path of the file to check
    @result YES if the WebKit can show the content of the file at the specified path.
*/
+ (BOOL)canShowFile:(NSString *)path;

/*!
    @method suggestedFileExtensionForMIMEType:
    @param MIMEType The MIME type to check.
    @result The extension based on the MIME type
*/
+ (NSString *)suggestedFileExtensionForMIMEType: (NSString *)MIMEType;

+ (NSString *)_standardUserAgentWithApplicationName:(NSString *)applicationName;

/*!
    @method canCloseAllWebViews
    @abstract Checks if all the open WebViews can be closed (by dispatching the beforeUnload event to the pages).
    @result YES if all the WebViews can be closed.
*/
+ (BOOL)canCloseAllWebViews;

// May well become public
- (void)_setFormDelegate:(id<WebFormDelegate>)delegate;
- (id<WebFormDelegate>)_formDelegate;

- (BOOL)_isClosed;

// _close is now replaced by public method -close. It remains here only for backward compatibility
// until callers can be weaned off of it.
- (void)_close;

// Indicates if the WebView is in the midst of a user gesture.
- (BOOL)_isProcessingUserGesture;

// Determining and updating page visibility state.
- (BOOL)_isViewVisible;
- (void)_updateVisibilityState;

// SPI for DumpRenderTree
- (void)_updateActiveState;

- (void)_didScrollDocumentInFrameView:(WebFrameView *)frameView;

/*!
    @method _registerViewClass:representationClass:forURLScheme:
    @discussion Register classes that implement WebDocumentView and WebDocumentRepresentation respectively.
    @param viewClass The WebDocumentView class to use to render data for a given MIME type.
    @param representationClass The WebDocumentRepresentation class to use to represent data of the given MIME type.
    @param URLScheme The URL scheme to represent with an object of the given class.
*/
+ (void)_registerViewClass:(Class)viewClass representationClass:(Class)representationClass forURLScheme:(NSString *)URLScheme;

+ (void)_unregisterViewClassAndRepresentationClassForMIMEType:(NSString *)MIMEType;

/*!
     @method _canHandleRequest:
     @abstract Performs a "preflight" operation that performs some
     speculative checks to see if a request can be used to create
     a WebDocumentView and WebDocumentRepresentation.
     @discussion The result of this method is valid only as long as no
     protocols or schemes are registered or unregistered, and as long as
     the request is not mutated (if the request is mutable). Hence, clients
     should be prepared to handle failures even if they have performed request
     preflighting by caling this method.
     @param request The request to preflight.
     @result YES if it is likely that a WebDocumentView and WebDocumentRepresentation
     can be created for the request, NO otherwise.
*/
+ (BOOL)_canHandleRequest:(NSURLRequest *)request;

+ (NSString *)_decodeData:(NSData *)data;

+ (void)_setAlwaysUsesComplexTextCodePath:(BOOL)f;

- (NSCachedURLResponse *)_cachedResponseForURL:(NSURL *)URL;

// These two methods are useful for a test harness that needs a consistent appearance for the focus rings
// regardless of OS X version.
+ (void)_setUsesTestModeFocusRingColor:(BOOL)f;
+ (BOOL)_usesTestModeFocusRingColor;

/*!
    @method setAlwaysShowVerticalScroller:
    @abstract Forces the vertical scroller to be visible if flag is YES, otherwise
    if flag is NO the scroller with automatically show and hide as needed.
 */
- (void)setAlwaysShowVerticalScroller:(BOOL)flag;

/*!
    @method alwaysShowVerticalScroller
    @result YES if the vertical scroller is always shown
 */
- (BOOL)alwaysShowVerticalScroller;

/*!
    @method setAlwaysShowHorizontalScroller:
    @abstract Forces the horizontal scroller to be visible if flag is YES, otherwise
    if flag is NO the scroller with automatically show and hide as needed.
 */
- (void)setAlwaysShowHorizontalScroller:(BOOL)flag;

/*!
    @method alwaysShowHorizontalScroller
    @result YES if the horizontal scroller is always shown
 */
- (BOOL)alwaysShowHorizontalScroller;

/*!
    @method setProhibitsMainFrameScrolling:
    @abstract Prohibits scrolling in the WebView's main frame.  Used to "lock" a WebView
    to a specific scroll position.
  */
- (void)setProhibitsMainFrameScrolling:(BOOL)prohibits;

/*!
    @method _setAdditionalWebPlugInPaths:
    @abstract Sets additional plugin search paths for a specific WebView.
 */
- (void)_setAdditionalWebPlugInPaths:(NSArray *)newPaths;

/*!
    @method _attachScriptDebuggerToAllFrames
    @abstract Attaches a script debugger to all frames belonging to the receiver.
 */
- (void)_attachScriptDebuggerToAllFrames;

/*!
    @method _detachScriptDebuggerFromAllFrames
    @abstract Detaches any script debuggers from all frames belonging to the receiver.
 */
- (void)_detachScriptDebuggerFromAllFrames;

- (BOOL)defersCallbacks; // called by QuickTime plug-in
- (void)setDefersCallbacks:(BOOL)defer; // called by QuickTime plug-in

- (BOOL)usesPageCache;
- (void)setUsesPageCache:(BOOL)usesPageCache;

/*!
    @method textIteratorForRect:
    @param rect The rectangle of the document that we're interested in text from.
    @result WebTextIterator object, initialized with a range that corresponds to
    the passed-in rectangle.
    @abstract This method gives the text for the approximate range of the document
    corresponding to the rectangle. The range is determined by using hit testing at
    the top left and bottom right of the rectangle. Because of that, there can be
    text visible in the rectangle that is not included in the iterator. If you need
    a guarantee of iterating all text that is visible, then you need to instead make
    a WebTextIterator with a DOMRange that covers the entire document.
 */
- (WebTextIterator *)textIteratorForRect:(NSRect)rect;

- (void)_clearUndoRedoOperations;

/* Used to do fast (lower quality) scaling of images so that window resize can be quick. */
- (BOOL)_inFastImageScalingMode;
- (void)_setUseFastImageScalingMode:(BOOL)flag;

- (BOOL)_cookieEnabled;
- (void)_setCookieEnabled:(BOOL)enable;

// SPI for DumpRenderTree
- (void)_executeCoreCommandByName:(NSString *)name value:(NSString *)value;
- (void)_clearMainFrameName;

- (void)setSelectTrailingWhitespaceEnabled:(BOOL)flag;
- (BOOL)isSelectTrailingWhitespaceEnabled;

- (void)setMemoryCacheDelegateCallsEnabled:(BOOL)suspend;
- (BOOL)areMemoryCacheDelegateCallsEnabled;

// SPI for DumpRenderTree
- (BOOL)_postsAcceleratedCompositingNotifications;
- (void)_setPostsAcceleratedCompositingNotifications:(BOOL)flag;
- (BOOL)_isUsingAcceleratedCompositing;
- (void)_setBaseCTM:(CGAffineTransform)transform forContext:(CGContextRef)context;

// For DumpRenderTree
- (BOOL)interactiveFormValidationEnabled;
- (void)setInteractiveFormValidationEnabled:(BOOL)enabled;
- (int)validationMessageTimerMagnification;
- (void)setValidationMessageTimerMagnification:(int)newValue;
- (NSDictionary *)_contentsOfUserInterfaceItem:(NSString *)userInterfaceItem;
- (void)_setTopContentInsetForTesting:(float)contentInset;

// Returns YES if NSView -displayRectIgnoringOpacity:inContext: will produce a faithful representation of the content.
- (BOOL)_isSoftwareRenderable;

- (void)setTracksRepaints:(BOOL)flag;
- (BOOL)isTrackingRepaints;
- (void)resetTrackedRepaints;
- (NSArray*)trackedRepaintRects; // Returned array contains rectValue NSValues.

// Which pasteboard text is coming from in editing delegate methods such as shouldInsertNode.
- (NSPasteboard *)_insertionPasteboard;

// Allow lists access from an origin (sourceOrigin) to a set of one or more origins described by the parameters:
// - destinationProtocol: The protocol to grant access to.
// - destinationHost: The host to grant access to.
// - allowDestinationSubdomains: If host is a domain, setting this to YES will allow host and all its subdomains, recursively.
+ (void)_addOriginAccessAllowListEntryWithSourceOrigin:(NSString *)sourceOrigin destinationProtocol:(NSString *)destinationProtocol destinationHost:(NSString *)destinationHost allowDestinationSubdomains:(BOOL)allowDestinationSubdomains;
+ (void)_removeOriginAccessAllowListEntryWithSourceOrigin:(NSString *)sourceOrigin destinationProtocol:(NSString *)destinationProtocol destinationHost:(NSString *)destinationHost allowDestinationSubdomains:(BOOL)allowDestinationSubdomains;

// Removes all allow list entries created with _addOriginAccessAllowListEntryWithSourceOrigin.
+ (void)_resetOriginAccessAllowLists;

+ (void)_addUserScriptToGroup:(NSString *)groupName world:(WebScriptWorld *)world source:(NSString *)source url:(NSURL *)url includeMatchPatternStrings:(NSArray *)includeMatchPatternStrings excludeMatchPatternStrings:(NSArray *)excludeMatchPatternStrings injectionTime:(WebUserScriptInjectionTime)injectionTime injectedFrames:(WebUserContentInjectedFrames)injectedFrames;
+ (void)_addUserStyleSheetToGroup:(NSString *)groupName world:(WebScriptWorld *)world source:(NSString *)source url:(NSURL *)url includeMatchPatternStrings:(NSArray *)includeMatchPatternStrings excludeMatchPatternStrings:(NSArray *)excludeMatchPatternStrings injectedFrames:(WebUserContentInjectedFrames)injectedFrames;

+ (void)_removeUserScriptFromGroup:(NSString *)groupName world:(WebScriptWorld *)world url:(NSURL *)url;
+ (void)_removeUserStyleSheetFromGroup:(NSString *)groupName world:(WebScriptWorld *)world url:(NSURL *)url;
+ (void)_removeUserScriptsFromGroup:(NSString *)groupName world:(WebScriptWorld *)world;
+ (void)_removeUserStyleSheetsFromGroup:(NSString *)groupName world:(WebScriptWorld *)world;
+ (void)_removeAllUserContentFromGroup:(NSString *)groupName;

// SPI for DumpRenderTree
+ (void)_setLoadResourcesSerially:(BOOL)serialize;
- (void)_forceRepaintForTesting;

+ (void)_setDomainRelaxationForbidden:(BOOL)forbidden forURLScheme:(NSString *)scheme;
+ (void)_registerURLSchemeAsSecure:(NSString *)scheme;
+ (void)_registerURLSchemeAsAllowingLocalStorageAccessInPrivateBrowsing:(NSString *)scheme;
+ (void)_registerURLSchemeAsAllowingDatabaseAccessInPrivateBrowsing:(NSString *)scheme;

- (void)_scaleWebView:(float)scale atOrigin:(NSPoint)origin;
- (float)_viewScaleFactor; // This is actually pageScaleFactor.

- (void)_setUseFixedLayout:(BOOL)fixed;
- (void)_setFixedLayoutSize:(NSSize)size;

- (BOOL)_useFixedLayout;
- (NSSize)_fixedLayoutSize;

- (void)_setPaginationMode:(WebPaginationMode)paginationMode;
- (WebPaginationMode)_paginationMode;

- (void)_listenForLayoutMilestones:(WebLayoutMilestones)layoutMilestones;
- (WebLayoutMilestones)_layoutMilestones;

- (WebPageVisibilityState)_visibilityState;
- (void)_setVisibilityState:(WebPageVisibilityState)visibilityState isInitialState:(BOOL)isInitialState;

- (BOOL)windowOcclusionDetectionEnabled;
- (void)setWindowOcclusionDetectionEnabled:(BOOL)flag;

// Whether the column-break-{before,after} properties are respected instead of the
// page-break-{before,after} properties.
- (void)_setPaginationBehavesLikeColumns:(BOOL)behavesLikeColumns;
- (BOOL)_paginationBehavesLikeColumns;

// Set to 0 to have the page length equal the view length.
- (void)_setPageLength:(CGFloat)pageLength;
- (CGFloat)_pageLength;
- (void)_setGapBetweenPages:(CGFloat)pageGap;
- (CGFloat)_gapBetweenPages;
- (NSUInteger)_pageCount;

// Whether or not a line grid is enabled by default when paginated via the pagination API.
- (void)_setPaginationLineGridEnabled:(BOOL)lineGridEnabled;
- (BOOL)_paginationLineGridEnabled;

- (void)_setCustomBackingScaleFactor:(CGFloat)overrideScaleFactor;
- (CGFloat)_backingScaleFactor;

// Deprecated. Use the methods in pending public above instead.
- (NSUInteger)markAllMatchesForText:(NSString *)string caseSensitive:(BOOL)caseFlag highlight:(BOOL)highlight limit:(NSUInteger)limit;
- (NSUInteger)countMatchesForText:(NSString *)string caseSensitive:(BOOL)caseFlag highlight:(BOOL)highlight limit:(NSUInteger)limit markMatches:(BOOL)markMatches;

/*!
 @method searchFor:direction:caseSensitive:wrap:startInSelection:
 @abstract Searches a document view for a string and highlights the string if it is found.
 Starts the search from the current selection.  Will search across all frames.
 @param string The string to search for.
 @param forward YES to search forward, NO to seach backwards.
 @param caseFlag YES to for case-sensitive search, NO for case-insensitive search.
 @param wrapFlag YES to wrap around, NO to avoid wrapping.
 @param startInSelection YES to begin search in the selected text (useful for incremental searching), NO to begin search after the selected text.
 @result YES if found, NO if not found.
 */
// Deprecated. Use findString.
- (BOOL)searchFor:(NSString *)string direction:(BOOL)forward caseSensitive:(BOOL)caseFlag wrap:(BOOL)wrapFlag startInSelection:(BOOL)startInSelection;

/*!
    @method _HTTPPipeliningEnabled
    @abstract Checks the HTTP pipelining status.
    @discussion Defaults to NO.
    @result YES if HTTP pipelining is enabled, NO if not enabled.
 */
+ (BOOL)_HTTPPipeliningEnabled;

/*!
    @method _setHTTPPipeliningEnabled:
    @abstract Set the HTTP pipelining status.
    @discussion Defaults to NO.
    @param enabled The new HTTP pipelining status.
 */
+ (void)_setHTTPPipeliningEnabled:(BOOL)enabled;

- (void)_setPortsForUpgradingInsecureSchemeForTesting:(uint16_t)insecureUpgradePort withSecurePort:(uint16_t)secureUpgradePort;

@property (nonatomic, copy, getter=_sourceApplicationAuditData, setter=_setSourceApplicationAuditData:) NSData *sourceApplicationAuditData;

- (void)_setFontFallbackPrefersPictographs:(BOOL)flag;

- (void)showCandidates:(NSArray *)candidates forString:(NSString *)string inRect:(NSRect)rectOfTypedString forSelectedRange:(NSRange)range view:(NSView *)view completionHandler:(void (^)(NSTextCheckingResult *acceptedCandidate))completionBlock;
- (void)forceRequestCandidatesForTesting;
- (BOOL)shouldRequestCandidates;

typedef struct WebEdgeInsets {
    CGFloat top;
    CGFloat left;
    CGFloat bottom;
    CGFloat right;
} WebEdgeInsets;

@property (nonatomic, assign, setter=_setUnobscuredSafeAreaInsets:) WebEdgeInsets _unobscuredSafeAreaInsets;

@property (nonatomic, assign, setter=_setUseSystemAppearance:) BOOL _useSystemAppearance;

@end

@interface WebView (WebViewPrintingPrivate)
/*!
    @method _adjustPrintingMarginsForHeaderAndFooter:
    @abstract Increase the top and bottom margins for the current print operation to
    account for the header and footer height. 
    @discussion Called by <WebDocument> implementors once when a print job begins. If the
    <WebDocument> implementor implements knowsPageRange:, this should be called from there.
    Otherwise this should be called from beginDocument. The <WebDocument> implementors need
    to also call _drawHeaderAndFooter.
*/
- (void)_adjustPrintingMarginsForHeaderAndFooter;

/*!
    @method _drawHeaderAndFooter
    @abstract Gives the WebView's UIDelegate a chance to draw a header and footer on the
    printed page. 
    @discussion This should be called by <WebDocument> implementors from an override of
    drawPageBorderWithSize:.
*/
- (void)_drawHeaderAndFooter;
@end

@interface WebView (WebViewGrammarChecking)

- (BOOL)isGrammarCheckingEnabled;
- (void)setGrammarCheckingEnabled:(BOOL)flag;

- (void)toggleGrammarChecking:(id)sender;

@end

@interface WebView (WebViewTextChecking)

- (BOOL)isAutomaticQuoteSubstitutionEnabled;
- (BOOL)isAutomaticLinkDetectionEnabled;
- (BOOL)isAutomaticDashSubstitutionEnabled;
- (BOOL)isAutomaticTextReplacementEnabled;
- (BOOL)isAutomaticSpellingCorrectionEnabled;
- (void)setAutomaticQuoteSubstitutionEnabled:(BOOL)flag;
- (void)toggleAutomaticQuoteSubstitution:(id)sender;
- (void)setAutomaticLinkDetectionEnabled:(BOOL)flag;
- (void)toggleAutomaticLinkDetection:(id)sender;
- (void)setAutomaticDashSubstitutionEnabled:(BOOL)flag;
- (void)toggleAutomaticDashSubstitution:(id)sender;
- (void)setAutomaticTextReplacementEnabled:(BOOL)flag;
- (void)toggleAutomaticTextReplacement:(id)sender;
- (void)setAutomaticSpellingCorrectionEnabled:(BOOL)flag;
- (void)toggleAutomaticSpellingCorrection:(id)sender;
@end

@interface WebView (WebViewEditingInMail)
- (void)_insertNewlineInQuotedContent;
- (void)_replaceSelectionWithNode:(DOMNode *)node matchStyle:(BOOL)matchStyle;
- (BOOL)_selectionIsCaret;
- (BOOL)_selectionIsAll;
- (void)_simplifyMarkup:(DOMNode *)startNode endNode:(DOMNode *)endNode;

@end

@interface WebView (WebViewDeviceOrientation)
- (void)_setDeviceOrientationProvider:(id<WebDeviceOrientationProvider>)deviceOrientationProvider;
- (id<WebDeviceOrientationProvider>)_deviceOrientationProvider;
@end

@protocol WebGeolocationProvider <NSObject>
- (void)registerWebView:(WebView *)webView;
- (void)unregisterWebView:(WebView *)webView;
- (WebGeolocationPosition *)lastPosition;
@end

@protocol WebNotificationProvider
- (void)registerWebView:(WebView *)webView;
- (void)unregisterWebView:(WebView *)webView;

- (void)showNotification:(WebNotification *)notification fromWebView:(WebView *)webView;
- (void)cancelNotification:(WebNotification *)notification;
- (void)notificationDestroyed:(WebNotification *)notification;
- (void)clearNotifications:(NSArray *)notificationIDs;
- (WebNotificationPermission)policyForOrigin:(WebSecurityOrigin *)origin;

- (void)webView:(WebView *)webView didShowNotification:(NSString *)notificationID;
- (void)webView:(WebView *)webView didClickNotification:(NSString *)notificationID;
- (void)webView:(WebView *)webView didCloseNotifications:(NSArray *)notificationIDs;
@end

@interface WebView (WebViewGeolocation)
- (void)_setGeolocationProvider:(id<WebGeolocationProvider>)locationProvider;
- (id<WebGeolocationProvider>)_geolocationProvider;

- (void)_geolocationDidChangePosition:(WebGeolocationPosition *)position;
- (void)_geolocationDidFailWithMessage:(NSString *)errorMessage;
@end

@interface WebView (WebViewNotification)
- (void)_setNotificationProvider:(id<WebNotificationProvider>)notificationProvider;
- (id<WebNotificationProvider>)_notificationProvider;

- (void)_notificationDidShow:(NSString *)notificationID;
- (void)_notificationDidClick:(NSString *)notificationID;
- (void)_notificationsDidClose:(NSArray *)notificationIDs;

- (NSString *)_notificationIDForTesting:(JSValueRef)jsNotification;
- (void)_clearNotificationPermissionState;
@end

@interface WebView (WebViewFontSelection)
+ (void)_setFontAllowList:(NSArray *)allowList;
@end

@interface NSObject (WebViewFrameLoadDelegatePrivate)
- (void)webView:(WebView *)sender didFirstLayoutInFrame:(WebFrame *)frame;

// didFinishDocumentLoadForFrame is sent when the document has finished loading, though not necessarily all
// of its subresources.
// FIXME 5259339: Currently this callback is not sent for (some?) pages loaded entirely from the cache.
- (void)webView:(WebView *)sender didFinishDocumentLoadForFrame:(WebFrame *)frame;

// Addresses 4192534.  SPI for now.
- (void)webView:(WebView *)sender didHandleOnloadEventsForFrame:(WebFrame *)frame;

- (void)webView:(WebView *)sender didFirstVisuallyNonEmptyLayoutInFrame:(WebFrame *)frame;

- (void)webView:(WebView *)sender didLayout:(WebLayoutMilestones)milestones;

// For implementing the WebInspector's test harness
- (void)webView:(WebView *)webView didClearInspectorWindowObject:(WebScriptObject *)windowObject forFrame:(WebFrame *)frame;

@end

@interface NSObject (WebViewResourceLoadDelegatePrivate)
// Addresses <rdar://problem/5008925> - SPI for now
- (NSCachedURLResponse *)webView:(WebView *)sender resource:(id)identifier willCacheResponse:(NSCachedURLResponse *)response fromDataSource:(WebDataSource *)dataSource;
@end

@interface WebView (WKWindowSnapshot)
- (NSImage *)_windowSnapshotInRect:(CGRect)rect withOptions:(CGWindowImageOption)options NS_RETURNS_RETAINED;
@end

#ifdef __cplusplus
extern "C" {
#endif

// This is a C function to avoid calling +[WebView initialize].
void WebInstallMemoryPressureHandler(void);

#ifdef __cplusplus
}
#endif
