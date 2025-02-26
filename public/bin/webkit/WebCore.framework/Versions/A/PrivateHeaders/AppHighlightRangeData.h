/*
 * Copyright (C) 2020-2021 Apple Inc. All rights reserved.
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

#include <wtf/Forward.h>
#include <wtf/OptionSet.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

#if ENABLE(APP_HIGHLIGHTS)

class FragmentedSharedBuffer;

class AppHighlightRangeData {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(AppHighlightRangeData, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT static std::optional<AppHighlightRangeData> create(const FragmentedSharedBuffer&);
    struct NodePathComponent {
        String identifier;
        String nodeName;
        String textData;
        uint32_t pathIndex { 0 };

        NodePathComponent(String&& elementIdentifier, String&& name, String&& data, uint32_t index)
            : identifier(WTFMove(elementIdentifier))
            , nodeName(WTFMove(name))
            , textData(WTFMove(data))
            , pathIndex(index)
        {
        }

        NodePathComponent(const String& elementIdentifier, const String& name, const String& data, uint32_t index)
            : identifier(elementIdentifier)
            , nodeName(name)
            , textData(data)
            , pathIndex(index)
        {
        }

        friend bool operator==(const NodePathComponent&, const NodePathComponent&) = default;
    };

    using NodePath = Vector<NodePathComponent>;

    AppHighlightRangeData(const AppHighlightRangeData&) = default;
    AppHighlightRangeData() = default;
    AppHighlightRangeData(String&& identifier, String&& text, NodePath&& startContainer, uint64_t startOffset, NodePath&& endContainer, uint64_t endOffset)
        : m_identifier(WTFMove(identifier))
        , m_text(WTFMove(text))
        , m_startContainer(WTFMove(startContainer))
        , m_startOffset(startOffset)
        , m_endContainer(WTFMove(endContainer))
        , m_endOffset(endOffset)
    {
    }

    AppHighlightRangeData(const String& identifier, const String& text, const NodePath& startContainer, uint64_t startOffset, const NodePath& endContainer, uint64_t endOffset)
        : m_identifier(identifier)
        , m_text(text)
        , m_startContainer(startContainer)
        , m_startOffset(startOffset)
        , m_endContainer(endContainer)
        , m_endOffset(endOffset)
    {
    }

    AppHighlightRangeData& operator=(const AppHighlightRangeData&) = default;

    const String& identifier() const { return m_identifier; }
    const String& text() const { return m_text; }
    const NodePath& startContainer() const { return m_startContainer; }
    uint32_t startOffset() const { return m_startOffset; }
    const NodePath& endContainer() const { return m_endContainer; }
    uint32_t endOffset() const { return m_endOffset; }

    Ref<FragmentedSharedBuffer> toSharedBuffer() const;

private:
    String m_identifier;
    String m_text;
    NodePath m_startContainer;
    uint32_t m_startOffset { 0 };
    NodePath m_endContainer;
    uint32_t m_endOffset { 0 };
};

#endif

} // namespace WebCore
