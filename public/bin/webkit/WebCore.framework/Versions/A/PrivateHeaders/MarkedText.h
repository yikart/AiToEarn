/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include <wtf/CheckedPtr.h>
#include <wtf/Hasher.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class RenderBoxModelObject;
class RenderText;
class RenderedDocumentMarker;
struct TextBoxSelectableRange;
enum class DocumentMarkerType : uint32_t;

struct MarkedText : public CanMakeCheckedPtr<MarkedText, WTF::DefaultedOperatorEqual::Yes> {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    WTF_STRUCT_OVERRIDE_DELETE_FOR_CHECKED_PTR(MarkedText);

    // Sorted by paint order
    enum class Type : uint8_t {
        Unmarked,
        GrammarError,
        Correction,
#if ENABLE(WRITING_TOOLS)
        WritingToolsTextSuggestion,
#endif
        SpellingError,
        TextMatch,
        DictationAlternatives,
        Highlight,
        FragmentHighlight,
#if ENABLE(APP_HIGHLIGHTS)
        AppHighlight,
#endif
#if PLATFORM(IOS_FAMILY)
        // FIXME: See <rdar://problem/8933352>. Also, remove the PLATFORM(IOS_FAMILY)-guard.
        DictationPhraseWithAlternatives,
#endif
        Selection,
        DraggedContent,
        TransparentContent,
    };

    enum class PaintPhase {
        Background,
        Foreground,
        Decoration
    };

    enum class OverlapStrategy {
        None,
        Frontmost
    };

    MarkedText(unsigned startOffset, unsigned endOffset, Type type, const RenderedDocumentMarker* marker = nullptr, const AtomString& highlightName = { }, int priority = 0) : startOffset(startOffset), endOffset(endOffset), type(type), marker(marker), highlightName(highlightName), priority(priority) { };
    MarkedText(WTF::HashTableDeletedValueType) : startOffset(std::numeric_limits<unsigned>::max()) { };
    MarkedText() = default;

    bool isEmpty() const { return endOffset <= startOffset; }
    bool isHashTableDeletedValue() const { return startOffset == std::numeric_limits<unsigned>::max(); }
    bool operator==(const MarkedText& other) const = default;

    WEBCORE_EXPORT static Vector<MarkedText> subdivide(const Vector<MarkedText>&, OverlapStrategy = OverlapStrategy::None);

    static Vector<MarkedText> collectForDocumentMarkers(const RenderText&, const TextBoxSelectableRange&, PaintPhase);
    static Vector<MarkedText> collectForHighlights(const RenderText&, const TextBoxSelectableRange&, PaintPhase);
    static Vector<MarkedText> collectForDraggedAndTransparentContent(const DocumentMarkerType, const RenderText& renderer, const TextBoxSelectableRange&);

    unsigned startOffset { 0 };
    unsigned endOffset { 0 };
    Type type { Type::Unmarked };
    const RenderedDocumentMarker* marker { nullptr };
    AtomString highlightName;
    int priority { 0 };
};

}
namespace WTF {

inline void add(Hasher& hasher, const WebCore::MarkedText& text)
{
    add(hasher, text.startOffset, text.endOffset, text.type);
}

template<> struct HashTraits<WebCore::MarkedText> : public GenericHashTraits<WebCore::MarkedText> {
    static void constructDeletedValue(WebCore::MarkedText& slot) { slot = WebCore::MarkedText(HashTableDeletedValue); }
    static bool isDeletedValue(const WebCore::MarkedText& slot) { return slot.isHashTableDeletedValue(); }
};

template<> struct DefaultHash<WebCore::MarkedText> {
    static unsigned hash(const WebCore::MarkedText& key)
    {
        return computeHash(key);
    }

    static bool equal(const WebCore::MarkedText& a, const WebCore::MarkedText& b)
    {
        return a == b;
    }

    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};
} // namespace WTF

