/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

namespace WebCore {
    
enum AXTextStateChangeType {
    AXTextStateChangeTypeUnknown,
    AXTextStateChangeTypeEdit,
    AXTextStateChangeTypeSelectionMove,
    AXTextStateChangeTypeSelectionExtend,
    AXTextStateChangeTypeSelectionBoundary
};

enum AXTextEditType {
    AXTextEditTypeUnknown,
    AXTextEditTypeDelete, // Generic text delete
    AXTextEditTypeInsert, // Generic text insert
    AXTextEditTypeTyping, // Insert via typing
    AXTextEditTypeDictation, // Insert via dictation
    AXTextEditTypeCut, // Delete via Cut
    AXTextEditTypePaste, // Insert via Paste
    AXTextEditTypeAttributesChange // Change font, style, alignment, color, etc.
};

enum AXTextSelectionDirection {
    AXTextSelectionDirectionUnknown,
    AXTextSelectionDirectionBeginning,
    AXTextSelectionDirectionEnd,
    AXTextSelectionDirectionPrevious,
    AXTextSelectionDirectionNext,
    AXTextSelectionDirectionDiscontiguous
};

enum AXTextSelectionGranularity {
    AXTextSelectionGranularityUnknown,
    AXTextSelectionGranularityCharacter,
    AXTextSelectionGranularityWord,
    AXTextSelectionGranularityLine,
    AXTextSelectionGranularitySentence,
    AXTextSelectionGranularityParagraph,
    AXTextSelectionGranularityPage,
    AXTextSelectionGranularityDocument,
    AXTextSelectionGranularityAll // All granularity represents the action of selecting the whole document as a single action. Extending selection by some other granularity until it encompasses the whole document will not result in a all granularity notification.
};

struct AXTextSelection {
    AXTextSelectionDirection direction;
    AXTextSelectionGranularity granularity;
    bool focusChange;
};

struct AXTextStateChangeIntent {
    AXTextStateChangeType type;
    union {
        AXTextSelection selection;
        AXTextEditType change;
    };

    AXTextStateChangeIntent(AXTextStateChangeType type = AXTextStateChangeTypeUnknown, AXTextSelection selection = AXTextSelection())
        : type(type)
        , selection(selection)
    { }

    AXTextStateChangeIntent(AXTextEditType change)
        : type(AXTextStateChangeTypeEdit)
        , change(change)
    { }
};

} // namespace WebCore
