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

#import <WebKit/WKWebExtensionControllerDelegate.h>
#import <WebKit/WKWebExtensionDataType.h>
#import <WebKit/WKWebExtensionTab.h>
#import <WebKit/WKWebExtensionWindow.h>

@class WKWebExtension;
@class WKWebExtensionContext;
@class WKWebExtensionControllerConfiguration;
@class WKWebExtensionDataRecord;

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

/*!
 @abstract A ``WKWebExtensionController`` object manages a set of loaded extension contexts.
 @discussion You can have one or more extension controller instances, allowing different parts of the app to use different sets of extensions.
 A controller is associated with ``WKWebView`` via the ``webExtensionController`` property on ``WKWebViewConfiguration``.
 */
WK_CLASS_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA)) WK_SWIFT_UI_ACTOR
@interface WKWebExtensionController : NSObject

/*!
 @abstract Returns a web extension controller initialized with the default configuration.
 @result An initialized web extension controller, or nil if the object could not be initialized.
 @discussion This is a designated initializer. You can use ``initWithConfiguration:`` to
 initialize an instance with a configuration.
 @seealso initWithConfiguration:
*/
- (instancetype)init NS_DESIGNATED_INITIALIZER;

/*!
 @abstract Returns a web extension controller initialized with the specified configuration.
 @param configuration The configuration for the new web extension controller.
 @result An initialized web extension controller, or nil if the object could not be initialized.
 @discussion This is a designated initializer. You can use ``init:`` to initialize an
 instance with the default configuration. The initializer copies the specified configuration, so mutating
 the configuration after invoking the initializer has no effect on the web extension controller.
 @seealso init
*/
- (instancetype)initWithConfiguration:(WKWebExtensionControllerConfiguration *)configuration NS_DESIGNATED_INITIALIZER;

/*! @abstract The extension controller delegate. */
@property (nonatomic, weak) id <WKWebExtensionControllerDelegate> delegate;

/*!
 @abstract A copy of the configuration with which the web extension controller was initialized.
 @discussion Mutating the configuration has no effect on the web extension controller.
*/
@property (nonatomic, readonly, copy) WKWebExtensionControllerConfiguration *configuration;

/*!
 @abstract Loads the specified extension context.
 @discussion Causes the context to start, loading any background content, and injecting any content into relevant tabs.
 @param error Set to \c nil or an \c NSError instance if an error occurred.
 @result A Boolean value indicating if the context was successfully loaded.
 @seealso loadExtensionContext:
*/
- (BOOL)loadExtensionContext:(WKWebExtensionContext *)extensionContext error:(NSError **)error NS_SWIFT_NAME(load(_:));

/*!
 @abstract Unloads the specified extension context.
 @discussion Causes the context to stop running.
 @param error Set to \c nil or an \c NSError instance if an error occurred.
 @result A Boolean value indicating if the context was successfully unloaded.
 @seealso unloadExtensionContext:
*/
- (BOOL)unloadExtensionContext:(WKWebExtensionContext *)extensionContext error:(NSError **)error NS_SWIFT_NAME(unload(_:));

/*!
 @abstract Returns a loaded extension context for the specified extension.
 @param extension An extension to lookup.
 @result An extension context or `nil` if no match was found.
 @seealso extensions
*/
- (nullable WKWebExtensionContext *)extensionContextForExtension:(WKWebExtension *)extension NS_SWIFT_NAME(extensionContext(for:));

/*!
 @abstract Returns a loaded extension context matching the specified URL.
 @param URL The URL to lookup.
 @result An extension context or `nil` if no match was found.
 @discussion This method is useful for determining the extension context to use when about to navigate to an extension URL. For example,
 you could use this method to retrieve the appropriate extension context and then use its ``webViewConfiguration`` property to configure a
 web view for loading that URL.
 */
- (nullable WKWebExtensionContext *)extensionContextForURL:(NSURL *)URL NS_SWIFT_NAME(extensionContext(for:));

/*!
 @abstract A set of all the currently loaded extensions.
 @seealso extensionContexts
*/
@property (nonatomic, readonly, copy) NSSet<WKWebExtension *> *extensions;

/*!
 @abstract A set of all the currently loaded extension contexts.
 @seealso extensions
*/
@property (nonatomic, readonly, copy) NSSet<WKWebExtensionContext *> *extensionContexts;

/*! @abstract Returns a set of all available extension data types. */
@property (class, nonatomic, readonly, copy) NSSet<WKWebExtensionDataType> *allExtensionDataTypes;

/*!
 @abstract Fetches data records containing the given extension data types for all known extensions.
 @param dataTypes The extension data types to fetch records for.
 @param completionHandler A block to invoke when the data records have been fetched.
 @note The extension does not need to be loaded to be included in the result.
*/
- (void)fetchDataRecordsOfTypes:(NSSet<WKWebExtensionDataType> *)dataTypes completionHandler:(void (^)(NSArray<WKWebExtensionDataRecord *> *))completionHandler NS_SWIFT_NAME(fetchDataRecords(ofTypes:completionHandler:)) WK_SWIFT_ASYNC_NAME(dataRecords(ofTypes:));

/*!
 @abstract Fetches a data record containing the given extension data types for a specific known web extension context.
 @param dataTypes The extension data types to fetch records for.
 @param extensionContext The specific web extension context to fetch records for.
 @param completionHandler A block to invoke when the data record has been fetched.
 @note The extension does not need to be loaded to be included in the result.
*/
- (void)fetchDataRecordOfTypes:(NSSet<WKWebExtensionDataType> *)dataTypes forExtensionContext:(WKWebExtensionContext *)extensionContext completionHandler:(void (^)(WKWebExtensionDataRecord * _Nullable))completionHandler NS_SWIFT_NAME(fetchDataRecord(ofTypes:for:completionHandler:)) WK_SWIFT_ASYNC_NAME(dataRecord(ofTypes:for:));

/*!
 @abstract Removes extension data of the given types for the given data records.
 @param dataTypes The extension data types that should be removed.
 @param dataRecords The extension data records to delete data from.
 @param completionHandler A block to invoke when the data has been removed.
*/
- (void)removeDataOfTypes:(NSSet<WKWebExtensionDataType> *)dataTypes fromDataRecords:(NSArray<WKWebExtensionDataRecord *> *)dataRecords completionHandler:(void (^)(void))completionHandler NS_SWIFT_NAME(removeData(ofTypes:from:completionHandler:));

/*!
 @abstract Should be called by the app when a new window is opened to fire appropriate events with all loaded web extensions.
 @param newWindow The newly opened window.
 @discussion This method informs all loaded extensions of the opening of a new window, ensuring consistent understanding across extensions.
 If the intention is to inform only a specific extension, you should use the respective method on that extension's context instead.
 @seealso didCloseWindow:
 */
- (void)didOpenWindow:(id <WKWebExtensionWindow>)newWindow NS_SWIFT_NAME(didOpenWindow(_:));

/*!
 @abstract Should be called by the app when a window is closed to fire appropriate events with all loaded web extensions.
 @param newWindow The window that was closed.
 @discussion This method informs all loaded extensions of the closure of a window, ensuring consistent understanding across extensions.
 If the intention is to inform only a specific extension, you should use the respective method on that extension's context instead.
 @seealso didOpenWindow:
 */
- (void)didCloseWindow:(id <WKWebExtensionWindow>)closedWindow NS_SWIFT_NAME(didCloseWindow(_:));

/*!
 @abstract Should be called by the app when a window gains focus to fire appropriate events with all loaded web extensions.
 @param focusedWindow The window that gained focus, or \c nil if no window has focus or a window has focus that is not visible to extensions.
 @discussion This method informs all loaded extensions of the focused window, ensuring consistent understanding across extensions.
 If the intention is to inform only a specific extension, you should use the respective method on that extension's context instead.
 */
- (void)didFocusWindow:(nullable id <WKWebExtensionWindow>)focusedWindow NS_SWIFT_NAME(didFocusWindow(_:));

/*!
 @abstract Should be called by the app when a new tab is opened to fire appropriate events with all loaded web extensions.
 @param newTab The newly opened tab.
 @discussion This method informs all loaded extensions of the opening of a new tab, ensuring consistent understanding across extensions.
 If the intention is to inform only a specific extension, you should use the respective method on that extension's context instead.
 @seealso didCloseTab:
 */
- (void)didOpenTab:(id <WKWebExtensionTab>)newTab NS_SWIFT_NAME(didOpenTab(_:));

/*!
 @abstract Should be called by the app when a tab is closed to fire appropriate events with all loaded web extensions.
 @param closedTab The tab that was closed.
 @param windowIsClosing A boolean value indicating whether the window containing the tab is also closing.
 @discussion This method informs all loaded extensions of the closing of a tab, ensuring consistent understanding across extensions.
 If the intention is to inform only a specific extension, you should use the respective method on that extension's context instead.
 @seealso didOpenTab:
 */
- (void)didCloseTab:(id <WKWebExtensionTab>)closedTab windowIsClosing:(BOOL)windowIsClosing NS_REFINED_FOR_SWIFT;

/*!
 @abstract Should be called by the app when a tab is activated to notify all loaded web extensions.
 @param activatedTab The tab that has become active.
 @param previousTab The tab that was active before. This parameter can be \c nil if there was no previously active tab.
 @discussion This method informs all loaded extensions of the tab activation, ensuring consistent state awareness across extensions.
 If the intention is to inform only a specific extension, use the respective method on that extension's context instead.
 */
- (void)didActivateTab:(id<WKWebExtensionTab>)activatedTab previousActiveTab:(nullable id<WKWebExtensionTab>)previousTab NS_REFINED_FOR_SWIFT;

/*!
 @abstract Should be called by the app when tabs are selected to fire appropriate events with all loaded web extensions.
 @param selectedTabs The set of tabs that were selected.
 @discussion This method informs all loaded extensions that tabs have been selected, ensuring consistent understanding across extensions.
 If the intention is to inform only a specific extension, you should use the respective method on that extension's context instead.
 */
- (void)didSelectTabs:(NSArray<id <WKWebExtensionTab>> *)selectedTabs NS_SWIFT_NAME(didSelectTabs(_:));

/*!
 @abstract Should be called by the app when tabs are deselected to fire appropriate events with all loaded web extensions.
 @param deselectedTabs The set of tabs that were deselected.
 @discussion This method informs all loaded extensions that tabs have been deselected, ensuring consistent understanding across extensions.
 If the intention is to inform only a specific extension, you should use the respective method on that extension's context instead.
 */
- (void)didDeselectTabs:(NSArray<id <WKWebExtensionTab>> *)deselectedTabs NS_SWIFT_NAME(didDeselectTabs(_:));

/*!
 @abstract Should be called by the app when a tab is moved to fire appropriate events with all loaded web extensions.
 @param movedTab The tab that was moved.
 @param index The old index of the tab within the window.
 @param oldWindow The window that the tab was moved from, or \c nil if the tab is moving from no open window.
 @discussion This method informs all loaded extensions of the movement of a tab, ensuring consistent understanding across extensions.
 If the window is staying the same, the current window should be specified. If the intention is to inform only a specific extension,
 use the respective method on that extension's context instead.
 */
- (void)didMoveTab:(id <WKWebExtensionTab>)movedTab fromIndex:(NSUInteger)index inWindow:(nullable id <WKWebExtensionWindow>)oldWindow NS_REFINED_FOR_SWIFT;

/*!
 @abstract Should be called by the app when a tab is replaced by another tab to fire appropriate events with all loaded web extensions.
 @param oldTab The tab that was replaced.
 @param newTab The tab that replaced the old tab.
 @discussion This method informs all loaded extensions of the replacement of a tab, ensuring consistent understanding across extensions.
 If the intention is to inform only a specific extension, you should use the respective method on that extension's context instead.
 */
- (void)didReplaceTab:(id <WKWebExtensionTab>)oldTab withTab:(id <WKWebExtensionTab>)newTab NS_SWIFT_NAME(didReplaceTab(_:with:));

/*!
 @abstract Should be called by the app when the properties of a tab are changed to fire appropriate events with all loaded web extensions.
 @param properties The properties of the tab that were changed.
 @param changedTab The tab whose properties were changed.
 @discussion This method informs all loaded extensions of changes to tab properties, ensuring a unified understanding across extensions.
 If the intention is to inform only a specific extension, you should use the respective method on that extension's context instead.
 */
- (void)didChangeTabProperties:(WKWebExtensionTabChangedProperties)properties forTab:(id <WKWebExtensionTab>)changedTab NS_SWIFT_NAME(didChangeTabProperties(_:for:));

@end

WK_HEADER_AUDIT_END(nullability, sendability)
