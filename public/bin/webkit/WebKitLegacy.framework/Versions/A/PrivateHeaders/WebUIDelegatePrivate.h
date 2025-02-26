/*
 * Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010, 2012 Apple Inc. All rights reserved.
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

#import <WebKitLegacy/WebAllowDenyPolicyListener.h>
#import <WebKitLegacy/WebUIDelegate.h>

#if !defined(ENABLE_FULLSCREEN_API)
#define ENABLE_FULLSCREEN_API 1
#endif

#if TARGET_OS_IOS || (defined(TARGET_OS_VISION) && TARGET_OS_VISION)
@protocol UIDropSession;
#endif

#define WEBMENUITEMTAG_WEBKIT_3_0_SPI_START 2000
enum { 
    // FIXME: These should move to WebUIDelegate.h as part of the WebMenuItemTag enum there, when we're not in API freeze
    // Note that these values must be kept aligned with values in WebCore/ContextMenuItem.h
    WebMenuItemTagOpenLink = WEBMENUITEMTAG_WEBKIT_3_0_SPI_START,
    WebMenuItemTagIgnoreGrammar,
    WebMenuItemTagSpellingMenu,
    WebMenuItemTagShowSpellingPanel,
    WebMenuItemTagCheckSpelling,
    WebMenuItemTagCheckSpellingWhileTyping,
    WebMenuItemTagCheckGrammarWithSpelling,
    WebMenuItemTagFontMenu,
    WebMenuItemTagShowFonts,
    WebMenuItemTagBold,
    WebMenuItemTagItalic,
    WebMenuItemTagUnderline,
    WebMenuItemTagOutline,
    WebMenuItemTagStyles,
    WebMenuItemTagShowColors,
    WebMenuItemTagSpeechMenu,
    WebMenuItemTagStartSpeaking,
    WebMenuItemTagStopSpeaking,
    WebMenuItemTagWritingDirectionMenu,
    WebMenuItemTagDefaultDirection,
    WebMenuItemTagLeftToRight,
    WebMenuItemTagRightToLeft,
    WebMenuItemPDFSinglePageScrolling,
    WebMenuItemPDFFacingPagesScrolling,
    WebMenuItemTagInspectElement,
    WebMenuItemTagTextDirectionMenu,
    WebMenuItemTagTextDirectionDefault,
    WebMenuItemTagTextDirectionLeftToRight,
    WebMenuItemTagTextDirectionRightToLeft,
    WebMenuItemTagCorrectSpellingAutomatically,
    WebMenuItemTagSubstitutionsMenu,
    WebMenuItemTagShowSubstitutions,
    WebMenuItemTagSmartCopyPaste,
    WebMenuItemTagSmartQuotes,
    WebMenuItemTagSmartDashes,
    WebMenuItemTagSmartLinks,
    WebMenuItemTagTextReplacement,
    WebMenuItemTagTransformationsMenu,
    WebMenuItemTagMakeUpperCase,
    WebMenuItemTagMakeLowerCase,
    WebMenuItemTagCapitalize,
    WebMenuItemTagChangeBack,
    WebMenuItemTagOpenMediaInNewWindow,
    WebMenuItemTagDownloadMediaToDisk,
    WebMenuItemTagCopyMediaLinkToClipboard,
    WebMenuItemTagToggleMediaControls,
    WebMenuItemTagToggleMediaLoop,
    WebMenuItemTagEnterVideoFullscreen,
    WebMenuItemTagMediaPlayPause,
    WebMenuItemTagMediaMute,
    WebMenuItemTagDictationAlternative,
    WebMenuItemTagToggleVideoFullscreen,
    WebMenuItemTagShareMenu,
    WebMenuItemTagToggleVideoEnhancedFullscreen,
    WebMenuItemTagToggleVideoViewer,
    WebMenuItemTagAddHighlightToCurrentQuickNote,
    WebMenuItemTagAddHighlightToNewQuickNote,
    WebMenuItemTagRevealImage,
    WebMenuItemTagTranslate,
    WebMenuItemTagPlayAllAnimations,
    WebMenuItemTagPauseAllAnimations,
    WebMenuItemTagPlayAnimation,
    WebMenuItemTagPauseAnimation,
    WebMenuItemTagWritingTools,
};

// Deprecated; remove when there are no more clients.
typedef enum {
    WebActionMenuNone = 0,
    WebActionMenuLink,
    WebActionMenuReadOnlyText,
    WebActionMenuEditableText,
    WebActionMenuWhitespaceInEditableArea,
    WebActionMenuEditableTextWithSuggestions,
    WebActionMenuImage,
    WebActionMenuVideo,
    WebActionMenuDataDetectedItem,
    WebActionMenuMailtoLink,
    WebActionMenuTelLink
} WebActionMenuType;

typedef enum {
    WebImmediateActionNone = 0,
    WebImmediateActionLinkPreview,
    WebImmediateActionDataDetectedItem,
    WebImmediateActionText,
    WebImmediateActionMailtoLink,
    WebImmediateActionTelLink
} WebImmediateActionType;

// Message Sources.
extern NSString *WebConsoleMessageXMLMessageSource;
extern NSString *WebConsoleMessageJSMessageSource;
extern NSString *WebConsoleMessageNetworkMessageSource;
extern NSString *WebConsoleMessageConsoleAPIMessageSource;
extern NSString *WebConsoleMessageStorageMessageSource;
extern NSString *WebConsoleMessageAppCacheMessageSource;
extern NSString *WebConsoleMessageRenderingMessageSource;
extern NSString *WebConsoleMessageCSSMessageSource;
extern NSString *WebConsoleMessageSecurityMessageSource;
extern NSString *WebConsoleMessageContentBlockerMessageSource;
extern NSString *WebConsoleMessageOtherMessageSource;

// Message Levels.
extern NSString *WebConsoleMessageDebugMessageLevel;
extern NSString *WebConsoleMessageLogMessageLevel;
extern NSString *WebConsoleMessageInfoMessageLevel;
extern NSString *WebConsoleMessageWarningMessageLevel;
extern NSString *WebConsoleMessageErrorMessageLevel;

@class DDActionContext;
@class DOMElement;
@class DOMNode;
@class DOMRange;
@class WebSecurityOrigin;

#if ENABLE_FULLSCREEN_API
@protocol WebKitFullScreenListener<NSObject>
- (void)webkitWillEnterFullScreen;
- (void)webkitDidEnterFullScreen;
- (void)webkitWillExitFullScreen;
- (void)webkitDidExitFullScreen;
@end
#endif

@interface NSObject (WebUIDelegatePrivate)

- (void)webView:(WebView *)webView addMessageToConsole:(NSDictionary *)message;

/*!
    @method webView:addMessageToConsole:withSource:
    @param webView The WebView sending the delegate method.
    @param message A dictionary representation of the console message.
    @param source Where the message came from. See WebConsoleMessageXMLMessageSource and other source types.
    @discussion The dictionary contains the following keys:

    <dl>
        <dt>message</dt>
        <dd>The message itself.</dd>
        <dt>lineNumber</dt>
        <dd>If this came from a file, this is the line number in the file this message originates from.</dd>
        <dt>sourceURL</dt>
        <dd>If this came from a file, this is the URL to the file this message originates from.</dd>
        <dt>MessageSource</dt>
        <dd>
            Where the message came from. XML, JavaScript, CSS, etc.
            See WebConsoleMessageXMLMessageSource and similar constants.
        </dd>
        <dt>MessageLevel</dt>
        <dd>
            Severity level of the message. Debug, Log, Warning, etc.
            See WebConsoleMessageDebugMessageLevel and similar constants.
        </dd>
    </dl>
*/
- (void)webView:(WebView *)webView addMessageToConsole:(NSDictionary *)message withSource:(NSString *)source;

- (NSView *)webView:(WebView *)webView plugInViewWithArguments:(NSDictionary *)arguments;

- (void)webView:(WebView *)sender dragImage:(NSImage *)anImage at:(NSPoint)viewLocation offset:(NSSize)initialOffset event:(NSEvent *)event pasteboard:(NSPasteboard *)pboard source:(id)sourceObj slideBack:(BOOL)slideFlag forView:(NSView *)view;
- (void)webView:(WebView *)sender didDrawRect:(NSRect)rect;
- (void)webView:(WebView *)sender didScrollDocumentInFrameView:(WebFrameView *)frameView;
- (void)webView:(WebView *)sender willPopupMenu:(NSMenu *)menu;
- (void)webView:(WebView *)sender saveFrameView:(WebFrameView *)frameView showingPanel:(BOOL)showingPanel;

// FIXME: Rename this because it's only used by immediate action code.
- (DDActionContext *)_webView:(WebView *)sender actionContextForHitTestResult:(NSDictionary *)hitTestResult range:(DOMRange **)range;

// Clients that want to maintain default behavior can return nil. To disable the immediate action entirely, return NSNull. And to
// do something custom, return an object that conforms to the NSImmediateActionAnimationController protocol.
- (id)_webView:(WebView *)sender immediateActionAnimationControllerForHitTestResult:(NSDictionary *)hitTestResult withType:(WebImmediateActionType)type;
- (BOOL)webView:(WebView *)sender didPressMissingPluginButton:(DOMElement *)element;
/*!
    @method webView:frame:exceededDatabaseQuotaForSecurityOrigin:database:
    @param sender The WebView sending the delegate method.
    @param frame The WebFrame whose JavaScript initiated this call.
    @param origin The security origin that needs a larger quota.
    @param databaseIdentifier The identifier of the database involved.
*/
- (void)webView:(WebView *)sender frame:(WebFrame *)frame exceededDatabaseQuotaForSecurityOrigin:(WebSecurityOrigin *)origin database:(NSString *)databaseIdentifier;

/*!
    @method webView:exceededApplicationCacheOriginQuotaForSecurityOrigin:totalSpaceNeeded:
    @param sender The WebView sending the delegate method.
    @param origin The security origin that needs a larger quota.
    @param totalSpaceNeeded The amount of space needed to store the new manifest and keep all other
    previously stored caches for this origin.
    @discussion This method is called when a page attempts to store more in the Application Cache
    for an origin than was allowed by the quota (or default) set for the origin. This allows the
    quota to be increased for the security origin.
*/
- (void)webView:(WebView *)sender exceededApplicationCacheOriginQuotaForSecurityOrigin:(WebSecurityOrigin *)origin totalSpaceNeeded:(NSUInteger)totalSpaceNeeded;

- (WebView *)webView:(WebView *)sender createWebViewWithRequest:(NSURLRequest *)request windowFeatures:(NSDictionary *)features;

/*!
    @method webView:decidePolicyForGeolocationRequestFromOrigin:frame:listener:
    @param webView The WebView sending the delegate method.
    @param origin The security origin that would like to use Geolocation.
    @param frame The WebFrame whose JavaScript initiated this call.
    @param listener The object to call when the decision is made
*/
- (void)webView:(WebView *)webView decidePolicyForGeolocationRequestFromOrigin:(WebSecurityOrigin *)origin
                                                                         frame:(WebFrame *)frame
                                                                      listener:(id<WebAllowDenyPolicyListener>)listener;
- (void)webView:(WebView *)webView decidePolicyForNotificationRequestFromOrigin:(WebSecurityOrigin *)origin listener:(id<WebAllowDenyPolicyListener>)listener;

- (void)webView:(WebView *)webView decidePolicyForUserMediaRequestFromOrigin:(WebSecurityOrigin *)origin listener:(id<WebAllowDenyPolicyListener>)listener;
- (void)webView:(WebView *)webView checkPolicyForUserMediaRequestFromOrigin:(WebSecurityOrigin *)origin listener:(id<WebAllowDenyPolicyListener>)listener;

- (void)webView:(WebView *)sender formDidFocusNode:(DOMNode *)node;
- (void)webView:(WebView *)sender formDidBlurNode:(DOMNode *)node;

/*!
    @method webView:printFrame:
    @abstract Informs that a WebFrame needs to be printed
    @param sender The WebView sending the delegate method
    @param frame The WebFrame needing to be printed
    @discussion This method is called when a script or user requests the page to be printed.
*/
- (void)webView:(WebView *)sender printFrame:(WebFrame *)frame;

#if ENABLE_FULLSCREEN_API
- (BOOL)webView:(WebView *)sender supportsFullScreenForElement:(DOMElement *)element withKeyboard:(BOOL)withKeyboard;
- (void)webView:(WebView *)sender enterFullScreenForElement:(DOMElement *)element listener:(id <WebKitFullScreenListener>)listener;
- (void)webView:(WebView *)sender exitFullScreenForElement:(DOMElement *)element listener:(id <WebKitFullScreenListener>)listener;
- (void)webView:(WebView *)sender closeFullScreenWithListener:(id <WebKitFullScreenListener>)listener;
#endif

- (void)webView:(WebView *)sender didDrawFrame:(WebFrame *)frame;

#if TARGET_OS_IOS || (defined(TARGET_OS_VISION) && TARGET_OS_VISION)
/*!
 @method webView:dragDestinationActionMaskForSession:
 @param sender The WebView sending the delegate method
 @param session The drop session which this destination action mask will affect
 @abstract May be implemented to adjust which destination actions are allowed upon dropping the given session.
 */
- (WebDragDestinationAction)webView:(WebView *)sender dragDestinationActionMaskForSession:(id <UIDropSession>)session;
#endif

- (NSData *)webCryptoMasterKeyForWebView:(WebView *)sender;

@end
