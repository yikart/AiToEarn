/*
 * Copyright (C) 2004, 2006, 2009, 2014 Apple Inc. All rights reserved.
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

#include <wtf/OptionSet.h>

namespace WebCore {

enum class TextIteratorBehavior : uint16_t {
    // Used by selection preservation code. There should be one character emitted between every VisiblePosition
    // in the Range used to create the TextIterator.
    // FIXME <rdar://problem/6028818>: This functionality should eventually be phased out when we rewrite
    // moveParagraphs to not clone/destroy moved content.
    EmitsCharactersBetweenAllVisiblePositions = 1 << 0,

    EntersTextControls = 1 << 1,

    // Used when we want text for copying, pasting, and transposing.
    EmitsTextsWithoutTranscoding = 1 << 2,

    // Used when the visibility of the style should not affect text gathering.
    IgnoresStyleVisibility = 1 << 3,

    // Used when emitting the special 0xFFFC character is required. Children for replaced objects will be ignored.
    EmitsObjectReplacementCharacters = 1 << 4,

    // Used when pasting inside password field.
    EmitsOriginalText = 1 << 5,

    EmitsImageAltText = 1 << 6,

    BehavesAsIfNodesFollowing = 1 << 7,

    // Makes visiblity test take into account the visibility of the frame.
    // FIXME: This should probably be always on unless TextIteratorBehavior::IgnoresStyleVisibility is set.
    ClipsToFrameAncestors = 1 << 8,

    TraversesFlatTree = 1 << 9,

    EntersImageOverlays = 1 << 10,

    IgnoresUserSelectNone = 1 << 11,

    EmitsObjectReplacementCharactersForImages = 1 << 12,

#if ENABLE(ATTACHMENT_ELEMENT)
    EmitsObjectReplacementCharactersForAttachments = 1 << 13,
#endif

    // Used by accessibility to expose untransformed kana text.
    IgnoresFullSizeKana = 1 << 14
};

using TextIteratorBehaviors = OptionSet<TextIteratorBehavior>;

} // namespace WebCore
