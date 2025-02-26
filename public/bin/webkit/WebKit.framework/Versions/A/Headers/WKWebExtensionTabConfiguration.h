/*
 * Copyright (C) 2023-2024 Apple Inc. All rights reserved.
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

@protocol WKWebExtensionTab;
@protocol WKWebExtensionWindow;

WK_HEADER_AUDIT_BEGIN(nullability, sendability)

/*!
 @abstract A ``WKWebExtensionTabConfiguration`` object encapsulates configuration options for a tab in an extension.
 @discussion This class holds various options that influence the behavior and initial state of a tab.
 The app retains the discretion to disregard any or all of these options, or even opt not to create a tab.
 */
WK_CLASS_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA))
WK_SWIFT_UI_ACTOR NS_SWIFT_NAME(WKWebExtension.TabConfiguration)
@interface WKWebExtensionTabConfiguration : NSObject

+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;

/*!
 @abstract Indicates the window where the tab should be opened.
 @discussion If this property is `nil`, no window was specified.
 */
@property (nonatomic, nullable, readonly, strong) id <WKWebExtensionWindow> window;

/*! @abstract Indicates the position where the tab should be opened within the window. */
@property (nonatomic, readonly) NSUInteger index;

/*!
 @abstract Indicates the parent tab with which the tab should be related.
 @discussion If this property is `nil`, no parent tab was specified.
 */
@property (nonatomic, nullable, readonly, strong) id <WKWebExtensionTab> parentTab;

/*!
 @abstract Indicates the initial URL for the tab.
 @discussion If this property is `nil`, the app's default "start page" should appear in the tab.
 */
@property (nonatomic, nullable, readonly, copy) NSURL *url;

/*!
 @abstract Indicates whether the tab should be the active tab.
 @discussion If this property is `YES`, the tab should be made active in the window, ensuring it is
 the frontmost tab. Being active implies the tab is also selected. If this property is `NO`, the tab shouldn't
 affect the currently active tab.
 */
@property (nonatomic, readonly) BOOL shouldBeActive;

/*!
 @abstract Indicates whether the tab should be added to the current tab selection.
 @discussion If this property is `YES`, the tab should be part of the current selection, but not necessarily
 become the active tab unless ``shouldBeActive`` is also `YES`. If this property is `NO`, the tab shouldn't
 be part of the current selection.
 */
@property (nonatomic, readonly) BOOL shouldAddToSelection;

/*! @abstract Indicates whether the tab should be pinned. */
@property (nonatomic, readonly) BOOL shouldBePinned;

/*! @abstract Indicates whether the tab should be muted. */
@property (nonatomic, readonly) BOOL shouldBeMuted;

/*! @abstract Indicates whether reader mode in the tab should be active. */
@property (nonatomic, readonly) BOOL shouldReaderModeBeActive;

@end

WK_HEADER_AUDIT_END(nullability, sendability)
