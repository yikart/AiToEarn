/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#ifndef WKBundlePageEditorClient_h
#define WKBundlePageEditorClient_h

#include <WebKit/WKBase.h>

enum {
    kWKInsertActionTyped = 0,
    kWKInsertActionPasted = 1,
    kWKInsertActionDropped = 2
};
typedef uint32_t WKInsertActionType;

enum {
    kWKAffinityUpstream,
    kWKAffinityDownstream
};
typedef uint32_t WKAffinityType;

enum {
    WKInputFieldActionTypeMoveUp,
    WKInputFieldActionTypeMoveDown,
    WKInputFieldActionTypeCancel,
    WKInputFieldActionTypeInsertTab,
    WKInputFieldActionTypeInsertBacktab,
    WKInputFieldActionTypeInsertNewline,
    WKInputFieldActionTypeInsertDelete
};
typedef uint32_t WKInputFieldActionType;

typedef bool (*WKBundlePageShouldBeginEditingCallback)(WKBundlePageRef page, WKBundleRangeHandleRef range, const void* clientInfo);
typedef bool (*WKBundlePageShouldEndEditingCallback)(WKBundlePageRef page, WKBundleRangeHandleRef range, const void* clientInfo);
typedef bool (*WKBundlePageShouldInsertNodeCallback)(WKBundlePageRef page, WKBundleNodeHandleRef node, WKBundleRangeHandleRef rangeToReplace, WKInsertActionType action, const void* clientInfo);
typedef bool (*WKBundlePageShouldInsertTextCallback)(WKBundlePageRef page, WKStringRef string, WKBundleRangeHandleRef rangeToReplace, WKInsertActionType action, const void* clientInfo);
typedef bool (*WKBundlePageShouldDeleteRangeCallback)(WKBundlePageRef page, WKBundleRangeHandleRef range, const void* clientInfo);
typedef bool (*WKBundlePageShouldChangeSelectedRange)(WKBundlePageRef page, WKBundleRangeHandleRef fromRange, WKBundleRangeHandleRef toRange, WKAffinityType affinity, bool stillSelecting, const void* clientInfo);
typedef bool (*WKBundlePageShouldApplyStyle)(WKBundlePageRef page, WKBundleCSSStyleDeclarationRef style, WKBundleRangeHandleRef range, const void* clientInfo);
typedef void (*WKBundlePageEditingNotification)(WKBundlePageRef page, WKStringRef notificationName, const void* clientInfo);
typedef void (*WKBundlePageWillWriteToPasteboard)(WKBundlePageRef page, WKBundleRangeHandleRef range,  const void* clientInfo);
typedef void (*WKBundlePageGetPasteboardDataForRange)(WKBundlePageRef page, WKBundleRangeHandleRef range, WKArrayRef* pasteboardTypes, WKArrayRef* pasteboardData, const void* clientInfo);
typedef WKStringRef (*WKBundlePageReplacementURLForResource)(WKBundlePageRef, WKDataRef resourceData, WKStringRef mimeType, const void* clientInfo);
typedef void (*WKBundlePageDidWriteToPasteboard)(WKBundlePageRef page, const void* clientInfo);
typedef bool (*WKBundlePagePerformTwoStepDrop)(WKBundlePageRef page, WKBundleNodeHandleRef fragment, WKBundleRangeHandleRef destination, bool isMove, const void* clientInfo);

typedef struct WKBundlePageEditorClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKBundlePageEditorClientBase;

typedef struct WKBundlePageEditorClientV0 {
    WKBundlePageEditorClientBase                                        base;

    // Version 0.
    WKBundlePageShouldBeginEditingCallback                              shouldBeginEditing;
    WKBundlePageShouldEndEditingCallback                                shouldEndEditing;
    WKBundlePageShouldInsertNodeCallback                                shouldInsertNode;
    WKBundlePageShouldInsertTextCallback                                shouldInsertText;
    WKBundlePageShouldDeleteRangeCallback                               shouldDeleteRange;
    WKBundlePageShouldChangeSelectedRange                               shouldChangeSelectedRange;
    WKBundlePageShouldApplyStyle                                        shouldApplyStyle;
    WKBundlePageEditingNotification                                     didBeginEditing;
    WKBundlePageEditingNotification                                     didEndEditing;
    WKBundlePageEditingNotification                                     didChange;
    WKBundlePageEditingNotification                                     didChangeSelection;
} WKBundlePageEditorClientV0;

typedef struct WKBundlePageEditorClientV1 {
    WKBundlePageEditorClientBase                                        base;

    // Version 0.
    WKBundlePageShouldBeginEditingCallback                              shouldBeginEditing;
    WKBundlePageShouldEndEditingCallback                                shouldEndEditing;
    WKBundlePageShouldInsertNodeCallback                                shouldInsertNode;
    WKBundlePageShouldInsertTextCallback                                shouldInsertText;
    WKBundlePageShouldDeleteRangeCallback                               shouldDeleteRange;
    WKBundlePageShouldChangeSelectedRange                               shouldChangeSelectedRange;
    WKBundlePageShouldApplyStyle                                        shouldApplyStyle;
    WKBundlePageEditingNotification                                     didBeginEditing;
    WKBundlePageEditingNotification                                     didEndEditing;
    WKBundlePageEditingNotification                                     didChange;
    WKBundlePageEditingNotification                                     didChangeSelection;

    // Version 1.
    WKBundlePageWillWriteToPasteboard                                   willWriteToPasteboard;
    WKBundlePageGetPasteboardDataForRange                               getPasteboardDataForRange;
    WKBundlePageDidWriteToPasteboard                                    didWriteToPasteboard;
    WKBundlePagePerformTwoStepDrop                                      performTwoStepDrop;
} WKBundlePageEditorClientV1;

typedef struct WKBundlePageEditorClientV2 {
    WKBundlePageEditorClientBase                                        base;

    // Version 0.
    WKBundlePageShouldBeginEditingCallback                              shouldBeginEditing;
    WKBundlePageShouldEndEditingCallback                                shouldEndEditing;
    WKBundlePageShouldInsertNodeCallback                                shouldInsertNode;
    WKBundlePageShouldInsertTextCallback                                shouldInsertText;
    WKBundlePageShouldDeleteRangeCallback                               shouldDeleteRange;
    WKBundlePageShouldChangeSelectedRange                               shouldChangeSelectedRange;
    WKBundlePageShouldApplyStyle                                        shouldApplyStyle;
    WKBundlePageEditingNotification                                     didBeginEditing;
    WKBundlePageEditingNotification                                     didEndEditing;
    WKBundlePageEditingNotification                                     didChange;
    WKBundlePageEditingNotification                                     didChangeSelection;

    // Version 1.
    WKBundlePageWillWriteToPasteboard                                   willWriteToPasteboard;
    WKBundlePageGetPasteboardDataForRange                               getPasteboardDataForRange;
    WKBundlePageDidWriteToPasteboard                                    didWriteToPasteboard;
    WKBundlePagePerformTwoStepDrop                                      performTwoStepDrop;

    // Version 2.
    WKBundlePageReplacementURLForResource                               replacementURLForResource;
} WKBundlePageEditorClientV2;

#endif // WKBundlePageEditorClient_h
