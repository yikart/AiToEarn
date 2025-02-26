/*
 * Copyright (C) 2022-2024 Apple Inc. All rights reserved.
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

#import <Foundation/Foundation.h>
#import <WebKit/WKFoundation.h>

@class WKSnapshotConfiguration;
@class WKWebView;
@class WKWebExtensionContext;
@class WKWebExtensionTabConfiguration;
@protocol WKWebExtensionWindow;

#if TARGET_OS_IPHONE
@class UIImage;
#else
@class NSImage;
#endif

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

/*!
 @abstract Constants used by ``WKWebExtensionController @/link and @link WKWebExtensionContext`` to indicate tab changes.
 @constant WKWebExtensionTabChangedPropertiesNone  Indicates nothing changed.
 @constant WKWebExtensionTabChangedPropertiesLoading  Indicates the loading state changed.
 @constant WKWebExtensionTabChangedPropertiesMuted  Indicates the muted state changed.
 @constant WKWebExtensionTabChangedPropertiesPinned  Indicates the pinned state changed.
 @constant WKWebExtensionTabChangedPropertiesPlayingAudio Indicates the audio playback state changed.
 @constant WKWebExtensionTabChangedPropertiesReaderMode  Indicates the reader mode state changed.
 @constant WKWebExtensionTabChangedPropertiesSize  Indicates the size changed.
 @constant WKWebExtensionTabChangedPropertiesTitle  Indicates the title changed.
 @constant WKWebExtensionTabChangedPropertiesURL  Indicates the URL changed.
 @constant WKWebExtensionTabChangedPropertiesZoomFactor  Indicates the zoom factor changed.
 */
typedef NS_OPTIONS(NSUInteger, WKWebExtensionTabChangedProperties) {
    WKWebExtensionTabChangedPropertiesNone         = 0,
    WKWebExtensionTabChangedPropertiesLoading      = 1 << 1,
    WKWebExtensionTabChangedPropertiesMuted        = 1 << 2,
    WKWebExtensionTabChangedPropertiesPinned       = 1 << 3,
    WKWebExtensionTabChangedPropertiesPlayingAudio = 1 << 4,
    WKWebExtensionTabChangedPropertiesReaderMode   = 1 << 5,
    WKWebExtensionTabChangedPropertiesSize         = 1 << 6,
    WKWebExtensionTabChangedPropertiesTitle        = 1 << 7,
    WKWebExtensionTabChangedPropertiesURL          = 1 << 8,
    WKWebExtensionTabChangedPropertiesZoomFactor   = 1 << 9,
} NS_SWIFT_NAME(WKWebExtension.TabChangedProperties) WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/*! @abstract A class conforming to the ``WKWebExtensionTab`` protocol represents a tab to web extensions. */
WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA)) WK_SWIFT_UI_ACTOR
@protocol WKWebExtensionTab <NSObject>
@optional

/*!
 @abstract Called when the window containing the tab is needed.
 @param context The context in which the web extension is running.
 @return The window containing the tab.
 @discussion Defaults to `nil` if not implemented.
 */
- (nullable id <WKWebExtensionWindow>)windowForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(window(for:));

/*!
 @abstract Called when the index of the tab in the window is needed.
 @param context The context in which the web extension is running.
 @return The index of the tab in the window, or ``NSNotFound`` if the tab is not currently in a window.
 @discussion This method should be implemented for better performance. Defaults to the window's
 ``tabsForWebExtensionContext:`` method to find the index if not implemented.
 */
- (NSUInteger)indexInWindowForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(indexInWindow(for:));

/*!
 @abstract Called when the parent tab for the tab is needed.
 @param context The context in which the web extension is running.
 @return The parent tab of the tab, if the tab was opened from another tab.
 @discussion Defaults to `nil` if not implemented.
 @seealso setParentTab:forWebExtensionContext:completionHandler:
 */
- (nullable id <WKWebExtensionTab>)parentTabForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(parentTab(for:));

/*!
 @abstract Called to set or clear the parent tab for the tab.
 @param parentTab The tab that should be set as the parent of the tab. If \c nil is provided, the current
 parent tab should be cleared.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion No action is performed if not implemented.
 @seealso parentTabForWebExtensionContext:
 */
- (void)setParentTab:(nullable id <WKWebExtensionTab>)parentTab forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(setParentTab(_:for:completionHandler:));

/*!
 @abstract Called when the web view for the tab is needed.
 @param context The context in which the web extension is running.
 @return The web view for the tab.
 @discussion The web view's ``WKWebViewConfiguration`` must have its ``webExtensionController`` property set to match
 the controller of the given context; otherwise `nil` will be used. Defaults to `nil` if not implemented. If `nil`, some critical features
 will not be available for this tab, such as content injection or modification.
 */
- (nullable WKWebView *)webViewForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(webView(for:));

/*!
 @abstract Called when the title of the tab is needed.
 @param context The context in which the web extension is running.
 @return The title of the tab.
 @discussion Defaults to ``title`` of the tab's web view if not implemented.
 */
- (nullable NSString *)titleForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(title(for:));

/*!
 @abstract Called when the pinned state of the tab is needed.
 @param context The context in which the web extension is running.
 @return `YES` if the tab is pinned, `NO` otherwise.
 @discussion Defaults to `NO` if not implemented.
 @seealso setPinned:forWebExtensionContext:completionHandler:
 */
- (BOOL)isPinnedForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(isPinned(for:));

/*!
 @abstract Called to set the pinned state of the tab.
 @param pinned A boolean value indicating whether to pin the tab.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion This is equivalent to the user selecting to pin or unpin the tab through a menu item. When a tab is pinned,
 it should be moved to the front of the tab bar and usually reduced in size. When a tab is unpinned, it should be restored
 to a normal size and position in the tab bar. No action is performed if not implemented.
 @seealso isPinnedForWebExtensionContext:
 */
- (void)setPinned:(BOOL)pinned forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(setPinned(_:for:completionHandler:));

/*!
 @abstract Called to check if reader mode is available for the tab.
 @param context The context in which the web extension is running.
 @return `YES` if reader mode is available for the tab, `NO` otherwise.
 @discussion Defaults to `NO` if not implemented.
 @seealso isReaderModeActiveForWebExtensionContext:
 */
- (BOOL)isReaderModeAvailableForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(isReaderModeAvailable(for:));

/*!
 @abstract Called to check if the tab is currently showing reader mode.
 @param context The context in which the web extension is running.
 @return `YES` if the tab is showing reader mode, `NO` otherwise.
 @discussion Defaults to `NO` if not implemented.
 @seealso isReaderModeAvailableForWebExtensionContext:
 */
- (BOOL)isReaderModeActiveForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(isReaderModeActive(for:));

/*!
 @abstract Called to set the reader mode for the tab.
 @param active A boolean value indicating whether to activate reader mode.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion No action is performed if not implemented.
 @seealso isReaderModeAvailableForWebExtensionContext:
 @seealso isReaderModeActiveForWebExtensionContext:
 */
- (void)setReaderModeActive:(BOOL)active forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(setReaderModeActive(_:for:completionHandler:));

/*!
 @abstract Called to check if the tab is currently playing audio.
 @param context The context in which the web extension is running.
 @return `YES` if the tab is playing audio, `NO` otherwise.
 @discussion Defaults to `NO` if not implemented.
 */
- (BOOL)isPlayingAudioForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(isPlayingAudio(for:));

/*!
 @abstract Called to check if the tab is currently muted.
 @param context The context in which the web extension is running.
 @return `YES` if the tab is muted, `NO` otherwise.
 @discussion Defaults to `NO` if not implemented.
 @seealso setMuted:forWebExtensionContext:completionHandler:
 */
- (BOOL)isMutedForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(isMuted(for:));

/*!
 @abstract Called to set the mute state of the tab.
 @param muted A boolean indicating whether the tab should be muted.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion No action is performed if not implemented.
 @seealso isMutedForWebExtensionContext:
 */
- (void)setMuted:(BOOL)muted forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(setMuted(_:for:completionHandler:));

/*!
 @abstract Called when the size of the tab is needed.
 @param context The context in which the web extension is running.
 @return The size of the tab.
 @discussion Defaults to size of the tab's web view if not implemented.
 */
- (CGSize)sizeForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(size(for:));

/*!
 @abstract Called when the zoom factor of the tab is needed.
 @param context The context in which the web extension is running.
 @return The zoom factor of the tab.
 @discussion Defaults to ``pageZoom`` of the tab's web view if not implemented.
 @seealso setZoomFactor:forWebExtensionContext:completionHandler:
 */
- (double)zoomFactorForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(zoomFactor(for:));

/*!
 @abstract Called to set the zoom factor of the tab.
 @param zoomFactor The desired zoom factor for the tab.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion Sets ``pageZoom`` of the tab's web view if not implemented.
 @seealso zoomFactorForWebExtensionContext:
 */
- (void)setZoomFactor:(double)zoomFactor forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(setZoomFactor(_:for:completionHandler:));

/*!
 @abstract Called when the URL of the tab is needed.
 @param context The context in which the web extension is running.
 @return The URL of the tab.
 @discussion Defaults to `URL` of the tab's web view if not implemented.
 */
- (nullable NSURL *)urlForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(url(for:));

/*!
 @abstract Called when the pending URL of the tab is needed.
 @param context The context in which the web extension is running.
 @return The pending URL of the tab.
 @discussion The pending URL is the URL of a page that is in the process of loading. If there is no pending URL, return `nil`.
 Defaults to `nil` if not implemented.
 */
- (nullable NSURL *)pendingURLForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(pendingURL(for:));

/*!
 @abstract Called to check if the tab has finished loading.
 @param context The context in which the web extension is running.
 @return `YES` if the tab has finished loading, `NO` otherwise.
 @discussion Defaults to ``isLoading`` of the tab's web view if not implemented.
 */
- (BOOL)isLoadingCompleteForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(isLoadingComplete(for:));

/*!
 @abstract Called to detect the locale of the webpage currently loaded in the tab.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. The block takes two arguments:
 the detected locale (or \c nil if the locale is unknown) and an error, which should be provided if any errors occurred.
 @discussion No action is performed if not implemented.
 */
- (void)detectWebpageLocaleForWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSLocale * WK_NULLABLE_RESULT locale, NSError * _Nullable error))completionHandler NS_SWIFT_NAME(detectWebpageLocale(for:completionHandler:));

/*!
 @abstract Called to capture a snapshot of the current webpage as an image.
 @param configuration An object that specifies how the snapshot is configured.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. The block takes two arguments:
 the captured image of the webpage (or \c nil if capturing failed) and an error, which should be provided if any errors occurred.
 @discussion Defaults to capturing the visible area of the tab's web view if not implemented.
 */
#if TARGET_OS_IPHONE
- (void)takeSnapshotUsingConfiguration:(WKSnapshotConfiguration *)configuration forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(UIImage * WK_NULLABLE_RESULT webpageImage, NSError * _Nullable error))completionHandler NS_SWIFT_NAME(takeSnapshot(using:for:completionHandler:)) WK_SWIFT_ASYNC_NAME(snapshot(using:for:));
#else
- (void)takeSnapshotUsingConfiguration:(WKSnapshotConfiguration *)configuration forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSImage * WK_NULLABLE_RESULT webpageImage, NSError * _Nullable error))completionHandler NS_SWIFT_NAME(takeSnapshot(using:for:completionHandler:)) WK_SWIFT_ASYNC_NAME(snapshot(using:for:));
#endif

/*!
 @abstract Called to load a URL in the tab.
 @param url The URL to be loaded in the tab.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion If the tab is already loading a page, calling this method should stop the current page from loading and start
 loading the new URL. Loads the URL in the tab's web view via ``loadRequest:`` if not implemented.
 */
- (void)loadURL:(NSURL *)url forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(loadURL(_:for:completionHandler:));

/*!
 @abstract Called to reload the current page in the tab.
 @param fromOrigin A boolean value indicating whether to reload the tab from the origin, bypassing the cache.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion Reloads the tab's web view via ``reload`` or ``reloadFromOrigin`` if not implemented.
 */
- (void)reloadFromOrigin:(BOOL)fromOrigin forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(reload(fromOrigin:for:completionHandler:));

/*!
 @abstract Called to navigate the tab to the previous page in its history.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion Navigates to the previous page in the tab's web view via ``goBack`` if not implemented.
 */
- (void)goBackForWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(goBack(for:completionHandler:));

/*!
 @abstract Called to navigate the tab to the next page in its history.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion Navigates to the next page in the tab's web view via ``goForward`` if not implemented.
 */
- (void)goForwardForWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(goForward(for:completionHandler:));

/*!
 @abstract Called to activate the tab, making it frontmost.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion Upon activation, the tab should become the frontmost and either be the sole selected tab or
 be included among the selected tabs. No action is performed if not implemented.
 @seealso setSelected:forWebExtensionContext:completionHandler:
 */
- (void)activateForWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(activate(for:completionHandler:));

/*!
 @abstract Called when the selected state of the tab is needed.
 @param context The context in which the web extension is running.
 @return `YES` if the tab is selected, `NO` otherwise.
 @discussion Defaults to `YES` for the active tab and `NO` for other tabs if not implemented.
 */
- (BOOL)isSelectedForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(isSelected(for:));

/*!
 @abstract Called to set the selected state of the tab.
 @param selected A boolean value indicating whether to select the tab.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion This is equivalent to the user command-clicking on the tab to add it to or remove it from a selection.
 The method should update the tab's selection state without changing the active tab. No action is performed if not implemented.
 @seealso isSelectedForWebExtensionContext:
 */
- (void)setSelected:(BOOL)selected forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(setSelected(_:for:completionHandler:));

/*!
 @abstract Called to duplicate the tab.
 @param configuration The tab configuration influencing the duplicated tab's properties.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes two arguments:
 the duplicated tab (or \c nil if no tab was created) and an error, which should be provided if any errors occurred.
 @discussion This is equivalent to the user selecting to duplicate the tab through a menu item, with the specified configuration.
 No action is performed if not implemented.
 */
- (void)duplicateUsingConfiguration:(WKWebExtensionTabConfiguration *)configuration forWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(id <WKWebExtensionTab> WK_NULLABLE_RESULT duplicatedTab, NSError * _Nullable error))completionHandler NS_SWIFT_NAME(duplicate(using:for:completionHandler:));

/*!
 @abstract Called to close the tab.
 @param context The context in which the web extension is running.
 @param completionHandler A block that must be called upon completion. It takes a single error argument,
 which should be provided if any errors occurred.
 @discussion No action is performed if not implemented.
 */
- (void)closeForWebExtensionContext:(WKWebExtensionContext *)context completionHandler:(void (^)(NSError * _Nullable error))completionHandler NS_SWIFT_NAME(close(for:completionHandler:));

/*!
 @abstract Called to determine if permissions should be granted for the tab on user gesture.
 @param context The context in which the web extension is running.
 @return `YES` if permissions should be granted to the tab, `NO` otherwise.
 @discussion This method allows the app to control granting of permissions on a per-tab basis when triggered by a user
 gesture. Implementing this method enables the app to dynamically manage `activeTab` permissions based on the tab's
 current state, the content being accessed, or other custom criteria.
 */
- (BOOL)shouldGrantPermissionsOnUserGestureForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(shouldGrantPermissionsOnUserGesture(for:));

/*!
 @abstract Called to determine if the tab should bypass host permission checks.
 @param context The context in which the web extension is running.
 @return `YES` to bypass host permission checks, `NO` to enforce them.
 @discussion This method allows the app to dynamically control whether a tab can bypass standard host permission checks.
 */
- (BOOL)shouldBypassPermissionsForWebExtensionContext:(WKWebExtensionContext *)context NS_SWIFT_NAME(shouldBypassPermissions(for:));

@end

WK_HEADER_AUDIT_END(nullability, sendability)
