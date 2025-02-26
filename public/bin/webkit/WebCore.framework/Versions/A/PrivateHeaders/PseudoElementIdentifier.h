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

#include "RenderStyleConstants.h"
#include <wtf/text/AtomString.h>
#include <wtf/text/AtomStringHash.h>
#include <wtf/text/TextStream.h>

namespace WebCore::Style {

struct PseudoElementIdentifier {
    PseudoId pseudoId;

    // highlight name for ::highlight or view transition name for view transition pseudo elements.
    AtomString nameArgument { nullAtom() };

    friend bool operator==(const PseudoElementIdentifier& a, const PseudoElementIdentifier& b) = default;
};

inline void add(Hasher& hasher, const PseudoElementIdentifier& pseudoElementIdentifier)
{
    add(hasher, pseudoElementIdentifier.pseudoId, pseudoElementIdentifier.nameArgument);
}

inline WTF::TextStream& operator<<(WTF::TextStream& ts, const PseudoElementIdentifier& pseudoElementIdentifier)
{
    ts << "::" << pseudoElementIdentifier.pseudoId;
    if (!pseudoElementIdentifier.nameArgument.isNull())
        ts << "(" << pseudoElementIdentifier.nameArgument << ")";
    return ts;
}

inline bool isNamedViewTransitionPseudoElement(const std::optional<Style::PseudoElementIdentifier>& pseudoElementIdentifier)
{
    if (!pseudoElementIdentifier)
        return false;

    switch (pseudoElementIdentifier->pseudoId) {
    case PseudoId::ViewTransitionGroup:
    case PseudoId::ViewTransitionImagePair:
    case PseudoId::ViewTransitionOld:
    case PseudoId::ViewTransitionNew:
        return true;
    default:
        return false;
    }
};

} // namespace WebCore

namespace WTF {

template<>
struct HashTraits<WebCore::Style::PseudoElementIdentifier> : GenericHashTraits<WebCore::Style::PseudoElementIdentifier> {
    typedef WebCore::Style::PseudoElementIdentifier EmptyValueType;

    static constexpr bool emptyValueIsZero = false;
    static EmptyValueType emptyValue() { return WebCore::Style::PseudoElementIdentifier { WebCore::PseudoId::AfterLastInternalPseudoId, nullAtom() }; }

    static void constructDeletedValue(WebCore::Style::PseudoElementIdentifier& pseudoElementIdentifier) { pseudoElementIdentifier = WebCore::Style::PseudoElementIdentifier { WebCore::PseudoId::None, nullAtom() }; }
    static bool isDeletedValue(const WebCore::Style::PseudoElementIdentifier& pseudoElementIdentifier) { return pseudoElementIdentifier == WebCore::Style::PseudoElementIdentifier { WebCore::PseudoId::None, nullAtom() }; }
};

template<>
struct DefaultHash<WebCore::Style::PseudoElementIdentifier> {
    static unsigned hash(const WebCore::Style::PseudoElementIdentifier& data) { return computeHash(data); }
    static bool equal(const WebCore::Style::PseudoElementIdentifier& a, const WebCore::Style::PseudoElementIdentifier& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = false;
};

template<>
struct HashTraits<std::optional<WebCore::Style::PseudoElementIdentifier>> : GenericHashTraits<std::optional<WebCore::Style::PseudoElementIdentifier>> {
    typedef std::optional<WebCore::Style::PseudoElementIdentifier> EmptyValueType;

    static constexpr bool emptyValueIsZero = false;
    static EmptyValueType emptyValue() { return WebCore::Style::PseudoElementIdentifier { WebCore::PseudoId::AfterLastInternalPseudoId, nullAtom() }; }

    static void constructDeletedValue(std::optional<WebCore::Style::PseudoElementIdentifier>& pseudoElementIdentifier) { pseudoElementIdentifier = WebCore::Style::PseudoElementIdentifier { WebCore::PseudoId::None, nullAtom() }; }
    static bool isDeletedValue(const std::optional<WebCore::Style::PseudoElementIdentifier>& pseudoElementIdentifier) { return pseudoElementIdentifier == WebCore::Style::PseudoElementIdentifier { WebCore::PseudoId::None, nullAtom() }; }
};

template<>
struct DefaultHash<std::optional<WebCore::Style::PseudoElementIdentifier>> {
    static unsigned hash(const std::optional<WebCore::Style::PseudoElementIdentifier>& data) { return computeHash(data); }
    static bool equal(const std::optional<WebCore::Style::PseudoElementIdentifier>& a, const std::optional<WebCore::Style::PseudoElementIdentifier>& b) { return a == b; }

    static const bool safeToCompareToEmptyOrDeleted = false;
};

} // namespace WTF
