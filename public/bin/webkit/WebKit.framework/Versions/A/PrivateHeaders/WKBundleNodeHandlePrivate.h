/*
 * Copyright (C) 2010 Apple Inc. All rights reserved.
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

#ifndef WKBundleNodeHandlePrivate_h
#define WKBundleNodeHandlePrivate_h

#include <JavaScriptCore/JavaScript.h>
#include <WebKit/WKBase.h>
#include <WebKit/WKGeometry.h>
#include <WebKit/WKImage.h>

#ifdef __cplusplus
extern "C" {
#endif

enum {
    kWKAutoFillButtonTypeNone,
    kWKAutoFillButtonTypeCredentials,
    kWKAutoFillButtonTypeContacts,
    kWKAutoFillButtonTypeStrongPassword,
    kWKAutoFillButtonTypeCreditCard,
    kWKAutoFillButtonTypeLoading,
};
typedef uint8_t WKAutoFillButtonType;

WK_EXPORT WKBundleNodeHandleRef WKBundleNodeHandleCreate(JSContextRef context, JSObjectRef object);

/* Convenience Operations */
WK_EXPORT WKBundleNodeHandleRef WKBundleNodeHandleCopyDocument(WKBundleNodeHandleRef nodeHandle);


/* Additional DOM Operations */

WK_EXPORT WKRect WKBundleNodeHandleGetRenderRect(WKBundleNodeHandleRef nodeHandle, bool* isReplaced);
WK_EXPORT WKImageRef WKBundleNodeHandleCopySnapshotWithOptions(WKBundleNodeHandleRef nodeHandle, WKSnapshotOptions options);
WK_EXPORT WKBundleRangeHandleRef WKBundleNodeHandleCopyVisibleRange(WKBundleNodeHandleRef nodeHandle);

/* Element Specific Operations */
WK_EXPORT WKRect WKBundleNodeHandleGetElementBounds(WKBundleNodeHandleRef elementHandle);

/* HTMLInputElement Specific Operations */
WK_EXPORT void WKBundleNodeHandleSetHTMLInputElementValueForUser(WKBundleNodeHandleRef htmlInputElementHandle, WKStringRef value);
WK_EXPORT void WKBundleNodeHandleSetHTMLInputElementSpellcheckEnabled(WKBundleNodeHandleRef htmlInputElementHandle, bool enabled);
WK_EXPORT bool WKBundleNodeHandleGetHTMLInputElementAutoFilled(WKBundleNodeHandleRef htmlInputElementHandle);
WK_EXPORT void WKBundleNodeHandleSetHTMLInputElementAutoFilled(WKBundleNodeHandleRef htmlInputElementHandle, bool filled);
WK_EXPORT void WKBundleNodeHandleSetHTMLInputElementAutoFilledAndViewable(WKBundleNodeHandleRef htmlInputElementHandle, bool autoFilledAndViewable);
WK_EXPORT void WKBundleNodeHandleSetHTMLInputElementAutoFilledAndObscured(WKBundleNodeHandleRef htmlInputElementHandle, bool autoFilledAndObscured);
WK_EXPORT bool WKBundleNodeHandleGetHTMLInputElementAutoFillButtonEnabled(WKBundleNodeHandleRef htmlInputElementHandle);
WK_EXPORT void WKBundleNodeHandleSetHTMLInputElementAutoFillButtonEnabledWithButtonType(WKBundleNodeHandleRef htmlInputElementHandle, WKAutoFillButtonType autoFillButtonType);
WK_EXPORT WKAutoFillButtonType WKBundleNodeHandleGetHTMLInputElementAutoFillButtonType(WKBundleNodeHandleRef htmlInputElementHandle);
WK_EXPORT WKAutoFillButtonType WKBundleNodeHandleGetHTMLInputElementLastAutoFillButtonType(WKBundleNodeHandleRef htmlInputElementHandle);
WK_EXPORT bool WKBundleNodeHandleGetHTMLInputElementAutoFillAvailable(WKBundleNodeHandleRef htmlInputElementHandle);
WK_EXPORT void WKBundleNodeHandleSetHTMLInputElementAutoFillAvailable(WKBundleNodeHandleRef htmlInputElementHandle, bool autoFillAvailable);
WK_EXPORT WKRect WKBundleNodeHandleGetHTMLInputElementAutoFillButtonBounds(WKBundleNodeHandleRef htmlInputElementHandle);
WK_EXPORT bool WKBundleNodeHandleGetHTMLInputElementLastChangeWasUserEdit(WKBundleNodeHandleRef htmlInputElementHandle);

/* HTMLTextAreaElement Specific Operations */
WK_EXPORT bool WKBundleNodeHandleGetHTMLTextAreaElementLastChangeWasUserEdit(WKBundleNodeHandleRef htmlTextAreaElementHandle);
    
/* HTMLTableCellElement Specific Operations */
WK_EXPORT WKBundleNodeHandleRef WKBundleNodeHandleCopyHTMLTableCellElementCellAbove(WKBundleNodeHandleRef htmlTableCellElementHandle);

/* Document Specific Operations */
WK_EXPORT WKBundleFrameRef WKBundleNodeHandleCopyDocumentFrame(WKBundleNodeHandleRef documentHandle);

/* HTMLFrameElement Specific Operations */
WK_EXPORT WKBundleFrameRef WKBundleNodeHandleCopyHTMLFrameElementContentFrame(WKBundleNodeHandleRef htmlFrameElementHandle);

/* HTMLIFrameElement Specific Operations */
WK_EXPORT WKBundleFrameRef WKBundleNodeHandleCopyHTMLIFrameElementContentFrame(WKBundleNodeHandleRef htmlIFrameElementHandle);


/* Deprecated - use WKBundleNodeHandleGetHTMLInputElementAutoFilled(WKBundleNodeHandleRef) */
WK_EXPORT bool WKBundleNodeHandleGetHTMLInputElementAutofilled(WKBundleNodeHandleRef htmlInputElementHandle);
/* Deprecated - use WKBundleNodeHandleSetHTMLInputElementAutoFilled(WKBundleNodeHandleRef, bool) */
WK_EXPORT void WKBundleNodeHandleSetHTMLInputElementAutofilled(WKBundleNodeHandleRef htmlInputElementHandle, bool filled);
/* Deprecated - use WKBundleNodeHandleSetHTMLInputElementAutoFillButtonEnabled(WKBundleNodeHandleRef, WKAutoFillButtonType)*/
WK_EXPORT void WKBundleNodeHandleSetHTMLInputElementAutoFillButtonEnabled(WKBundleNodeHandleRef htmlInputElementHandle, bool enabled);

WK_EXPORT WKBundleFrameRef WKBundleNodeHandleCopyOwningDocumentFrame(WKBundleNodeHandleRef);

#ifdef __cplusplus
}
#endif

#endif /* WKBundleNodeHandlePrivate_h */
