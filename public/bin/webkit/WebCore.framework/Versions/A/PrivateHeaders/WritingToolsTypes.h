/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#pragma once

#if ENABLE(WRITING_TOOLS)

#include "AttributedString.h"
#include "CharacterRange.h"
#include <wtf/Forward.h>

namespace WebCore {
namespace WritingTools {

enum class Behavior : uint8_t {
    None,
    Default,
    Limited,
    Complete,
};

enum class Action : uint8_t {
    ShowOriginal,
    ShowRewritten,
    Restart,
};

enum class RequestedTool : uint16_t {
    // Opaque type to transitively convert to/from WTRequestedTool.
};

#pragma mark - Session

enum class SessionType : uint8_t {
    Proofreading,
    Composition,
};

enum class SessionCompositionType : uint8_t {
    None,
    Compose,
    SmartReply,
    Other,
};

using SessionID = WTF::UUID;

struct Session {
    using ID = SessionID;

    using Type = SessionType;
    using CompositionType = SessionCompositionType;

    ID identifier;
    Type type { Type::Composition };
    CompositionType compositionType { CompositionType::None };
};

#pragma mark - Context

using ContextID = WTF::UUID;

struct Context {
    using ID = ContextID;

    ID identifier;
    AttributedString attributedText;
    CharacterRange range;
};

#pragma mark - TextSuggestion

enum class TextSuggestionState : uint8_t {
    Pending,
    Reviewing,
    Rejected,
    Invalid,
};

using TextSuggestionID = WTF::UUID;

struct TextSuggestion {
    using ID = TextSuggestionID;

    using State = TextSuggestionState;

    ID identifier;
    CharacterRange originalRange;
    String replacement;
    State state;
};

} // namespace WritingTools
} // namespace WebCore

#endif
