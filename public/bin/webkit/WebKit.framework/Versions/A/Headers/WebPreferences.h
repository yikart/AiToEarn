/*
 * Copyright (C) 2003-2022 Apple Inc.  All rights reserved.
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

/*!
@enum WebCacheModel

@abstract Specifies a usage model for a WebView, which WebKit will use to 
determine its caching behavior.

@constant WebCacheModelDocumentViewer Appropriate for a WebView displaying 
a fixed document -- like a splash screen, a chat document, or a word processing 
document -- with no UI for navigation. The WebView will behave like any other 
view, releasing resources when they are no longer referenced. Remote resources, 
if any, will be cached to disk. This is the most memory-efficient setting.

Examples: iChat, Mail, TextMate, Growl.

@constant WebCacheModelDocumentBrowser Appropriate for a WebView displaying 
a browsable series of documents with a UI for navigating between them -- for 
example, a reference materials browser or a website designer. The WebView will 
cache a reasonable number of resources and previously viewed documents in 
memory and/or on disk.

Examples: Dictionary, Help Viewer, Coda.

@constant WebCacheModelPrimaryWebBrowser Appropriate for a WebView in the 
application that acts as the user's primary web browser. The WebView will cache
a very large number of resources and previously viewed documents in memory 
and/or on disk.

Examples: Safari, OmniWeb, Shiira.
*/
typedef NS_ENUM(NSUInteger, WebCacheModel) {
    WebCacheModelDocumentViewer = 0,
    WebCacheModelDocumentBrowser = 1,
    WebCacheModelPrimaryWebBrowser = 2
} WEBKIT_ENUM_DEPRECATED_MAC(10_5, 10_14);

typedef struct WebPreferencesPrivate WebPreferencesPrivate;

extern NSString *WebPreferencesChangedNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);

/*!
    @class WebPreferences
*/
WEBKIT_CLASS_DEPRECATED_MAC(10_3, 10_14)
@interface WebPreferences: NSObject <NSCoding>
{
@package
    WebPreferencesPrivate *_private;
}

/*!
    @method standardPreferences
*/
+ (WebPreferences *)standardPreferences;

/*!
    @method initWithIdentifier:
    @param anIdentifier A string used to identify the WebPreferences.
    @discussion WebViews can share instances of WebPreferences by using an instance of WebPreferences with
    the same identifier.  Typically, instance are not created directly.  Instead you set the preferences
    identifier on a WebView.  The identifier is used as a prefix that is added to the user defaults keys
    for the WebPreferences.
    @result Returns a new instance of WebPreferences or a previously allocated instance with the same identifier.
*/
- (instancetype)initWithIdentifier:(NSString *)anIdentifier;

/*!
    @property identifier
    @result Returns the identifier for this WebPreferences.
*/
@property (nonatomic, readonly, copy) NSString *identifier;

/*!
    @property standardFontFamily
*/
@property (nonatomic, copy) NSString *standardFontFamily;

/*!
    @property fixedFontFamily
*/
@property (nonatomic, copy) NSString *fixedFontFamily;

/*!
    @property serifFontFamily
*/
@property (nonatomic, copy) NSString *serifFontFamily;

/*!
    @property sansSerifFontFamily
*/
@property (nonatomic, copy) NSString *sansSerifFontFamily;

/*!
    @property cursiveFontFamily
*/
@property (nonatomic, copy) NSString *cursiveFontFamily;

/*!
    @property fantasyFontFamily
*/
@property (nonatomic, copy) NSString *fantasyFontFamily;

/*!
    @property defaultFontSize
*/
@property (nonatomic) int defaultFontSize;

/*!
    @property defaultFixedFontSize
*/
@property (nonatomic) int defaultFixedFontSize;

/*!
    @property minimumFontSize
*/
@property (nonatomic) int minimumFontSize;

/*!
    @property minimumLogicalFontSize
*/
@property (nonatomic) int minimumLogicalFontSize;

/*!
    @property defaultTextEncodingName
*/
@property (nonatomic, copy) NSString *defaultTextEncodingName;

/*!
    @property userStyleSheetEnabled
*/
@property (nonatomic) BOOL userStyleSheetEnabled;

/*!
    @property userStyleSheetLocation
    @abstract The location of the user style sheet.
*/
@property (nonatomic, strong) NSURL *userStyleSheetLocation;

/*!
    @property javaEnabled
    @discussion Deprecated function that does nothing and always returns false.
*/
@property (nonatomic, getter=isJavaEnabled) BOOL javaEnabled WEBKIT_DEPRECATED_MAC(10_3, 10_15);

/*!
    @property javaScriptEnabled
*/
@property (nonatomic, getter=isJavaScriptEnabled) BOOL javaScriptEnabled;

/*!
    @property javaScriptCanOpenWindowsAutomatically
*/
@property (nonatomic) BOOL javaScriptCanOpenWindowsAutomatically;

/*!
    @property plugInsEnabled
*/
@property (nonatomic, getter=arePlugInsEnabled) BOOL plugInsEnabled;

/*!
    @property allowsAnimatedImages
*/
@property (nonatomic) BOOL allowsAnimatedImages;

/*!
    @property allowsAnimatedImageLooping
*/
@property (nonatomic) BOOL allowsAnimatedImageLooping;

/*!
    @property willLoadImagesAutomatically
*/
@property (nonatomic) BOOL loadsImagesAutomatically;

/*!
    @property autosaves
    @discussion If autosaves is YES the settings represented by
    WebPreferences will be stored in the user defaults database.
*/
@property (nonatomic) BOOL autosaves;

/*!
    @property shouldPrintBackgrounds
*/
@property (nonatomic) BOOL shouldPrintBackgrounds;

/*!
    @property privateBrowsingEnabled:
    @abstract If private browsing is enabled, WebKit will not store information
    about sites the user visits.
 */
@property (nonatomic) BOOL privateBrowsingEnabled;

/*!
    @property tabsToLinks
    @abstract If tabsToLinks is YES, the tab key will focus links and form controls.
    The option key temporarily reverses this preference.
*/
@property (nonatomic) BOOL tabsToLinks;

/*!
    @property usesPageCache
    @abstract Whether the receiver's associated WebViews use the shared
    page cache.
    @discussion Pages are cached as they are added to a WebBackForwardList, and
    removed from the cache as they are removed from a WebBackForwardList. Because 
    the page cache is global, caching a page in one WebBackForwardList may cause
    a page in another WebBackForwardList to be evicted from the cache.
*/
@property (nonatomic) BOOL usesPageCache;

/*!
    @property cacheModel
    @abstract Specifies a usage model for a WebView, which WebKit will use to
    determine its caching behavior. If necessary, WebKit
    will prune its caches to match cacheModel when set.

    @discussion Research indicates that users tend to browse within clusters of
    documents that hold resources in common, and to revisit previously visited
    documents. WebKit and the frameworks below it include built-in caches that take
    advantage of these patterns, substantially improving document load speed in
    browsing situations. The WebKit cache model controls the behaviors of all of
    these caches, including NSURLCache and the various WebCore caches.

    Applications with a browsing interface can improve document load speed
    substantially by specifying WebCacheModelDocumentBrowser. Applications without
    a browsing interface can reduce memory usage substantially by specifying
    WebCacheModelDocumentViewer.

    If cacheModel is not set, WebKit will select a cache model automatically.
*/
@property (nonatomic) WebCacheModel cacheModel;

/*!
    @property suppressesIncrementalRendering
*/
@property (nonatomic) BOOL suppressesIncrementalRendering;

/*!
    @property allowsAirPlayForMediaPlayback
 */
@property (nonatomic) BOOL allowsAirPlayForMediaPlayback;

@end
