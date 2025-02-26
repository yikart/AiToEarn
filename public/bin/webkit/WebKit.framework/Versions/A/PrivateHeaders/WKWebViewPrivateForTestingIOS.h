/*
 * Copyright (C) 2014-2019 Apple Inc. All rights reserved.
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

#import <WebKit/WKWebView.h>
#import <WebKit/_WKElementAction.h>
#import <WebKit/_WKFrameHandle.h>
#import <WebKit/_WKTapHandlingResult.h>

#if TARGET_OS_IPHONE

@class _WKTextInputContext;
@class UIEventAttribution;
@class UIGestureRecognizer;
@class BEDocumentContext;
@class UIWKDocumentRequest;
@class UITapGestureRecognizer;

@interface WKWebView (WKTestingIOS)

@property (nonatomic, readonly) NSString *textContentTypeForTesting;
@property (nonatomic, readonly) NSString *selectFormPopoverTitle;
@property (nonatomic, readonly) NSString *formInputLabel;
@property (nonatomic, readonly) CGRect _inputViewBoundsInWindow;
@property (nonatomic, readonly) NSString *_uiViewTreeAsText;
@property (nonatomic, readonly) NSNumber *_stableStateOverride;
@property (nonatomic, readonly) CGRect _dragCaretRect;
@property (nonatomic, readonly, getter=_isAnimatingDragCancel) BOOL _animatingDragCancel;
@property (nonatomic, readonly) CGRect _tapHighlightViewRect;
@property (nonatomic, readonly) UIGestureRecognizer *_imageAnalysisGestureRecognizer;
@property (nonatomic, readonly) UITapGestureRecognizer *_singleTapGestureRecognizer;
@property (nonatomic, readonly, getter=_isKeyboardScrollingAnimationRunning) BOOL _keyboardScrollingAnimationRunning;

- (void)keyboardAccessoryBarNext;
- (void)keyboardAccessoryBarPrevious;
- (void)dismissFormAccessoryView;
- (NSArray<NSString *> *)_filePickerAcceptedTypeIdentifiers;
- (void)_dismissFilePicker;
- (void)selectFormAccessoryPickerRow:(int)rowIndex;
- (BOOL)selectFormAccessoryHasCheckedItemAtRow:(long)rowIndex;
- (void)setSelectedColorForColorPicker:(UIColor *)color;
- (void)_selectDataListOption:(int)optionIndex;
- (BOOL)_isShowingDataListSuggestions;
- (void)selectWordBackwardForTesting;

- (BOOL)_mayContainEditableElementsInRect:(CGRect)rect;
- (void)_requestTextInputContextsInRect:(CGRect)rect completionHandler:(void (^)(NSArray<_WKTextInputContext *> *))completionHandler;
- (void)_focusTextInputContext:(_WKTextInputContext *)context placeCaretAt:(CGPoint)point completionHandler:(void (^)(UIResponder<UITextInput> *))completionHandler;
- (void)_willBeginTextInteractionInTextInputContext:(_WKTextInputContext *)context;
- (void)_didFinishTextInteractionInTextInputContext:(_WKTextInputContext *)context;
- (void)setTimePickerValueToHour:(NSInteger)hour minute:(NSInteger)minute;
- (double)timePickerValueHour;
- (double)timePickerValueMinute;

- (NSDictionary *)_propertiesOfLayerWithID:(unsigned long long)layerID;
- (void)_simulateElementAction:(_WKElementActionType)actionType atLocation:(CGPoint)location;
- (void)_simulateLongPressActionAtLocation:(CGPoint)location;
- (void)_simulateTextEntered:(NSString *)text;

- (void)_doAfterReceivingEditDragSnapshotForTesting:(dispatch_block_t)action;

- (void)_triggerSystemPreviewActionOnElement:(uint64_t)elementID document:(NSString*)documentID page:(uint64_t)pageID;

- (void)_setDeviceOrientationUserPermissionHandlerForTesting:(BOOL (^)(void))handler;

- (void)_setDeviceHasAGXCompilerServiceForTesting;

- (void)_resetObscuredInsetsForTesting;
- (BOOL)_hasResizeAssertion;
- (void)_simulateSelectionStart;

+ (void)_resetPresentLockdownModeMessage;

- (void)_doAfterNextVisibleContentRectAndStablePresentationUpdate:(void (^)(void))updateBlock;

- (NSString *)_scrollbarState:(unsigned long long)scrollingNodeID processID: (unsigned long long)processID isVertical:(bool)isVertical;

@end

#endif // TARGET_OS_IPHONE
