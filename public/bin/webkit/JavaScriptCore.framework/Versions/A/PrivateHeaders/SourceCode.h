/*
 * Copyright (C) 2008, 2013 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "UnlinkedSourceCode.h"

namespace JSC {

class SourceCode : public UnlinkedSourceCode {
    friend class CachedSourceCode;
    friend class CachedSourceCodeWithoutProvider;

public:
    SourceCode()
        : UnlinkedSourceCode()
        , m_firstLine(OrdinalNumber::beforeFirst())
        , m_startColumn(OrdinalNumber::beforeFirst())
    {
    }

    SourceCode(Ref<SourceProvider>&& provider)
        : UnlinkedSourceCode(WTFMove(provider))
    {
    }

    SourceCode(Ref<SourceProvider>&& provider, int firstLine, int startColumn)
        : UnlinkedSourceCode(WTFMove(provider))
        , m_firstLine(OrdinalNumber::fromOneBasedInt(std::max(firstLine, 1)))
        , m_startColumn(OrdinalNumber::fromOneBasedInt(std::max(startColumn, 1)))
    {
    }

    SourceCode(RefPtr<SourceProvider>&& provider, int startOffset, int endOffset, int firstLine, int startColumn)
        : UnlinkedSourceCode(WTFMove(provider), startOffset, endOffset)
        , m_firstLine(OrdinalNumber::fromOneBasedInt(std::max(firstLine, 1)))
        , m_startColumn(OrdinalNumber::fromOneBasedInt(std::max(startColumn, 1)))
    {
    }

    OrdinalNumber firstLine() const { return m_firstLine; }
    OrdinalNumber startColumn() const { return m_startColumn; }

    SourceID providerID() const
    {
        if (!m_provider)
            return SourceProvider::nullID;
        return m_provider->asID();
    }

    SourceProvider* provider() const { return m_provider.get(); }

    SourceCode subExpression(unsigned openBrace, unsigned closeBrace, int firstLine, int startColumn) const;

    friend bool operator==(const SourceCode&, const SourceCode&) = default;

private:
    OrdinalNumber m_firstLine;
    OrdinalNumber m_startColumn;
};

inline SourceCode makeSource(const String& source, const SourceOrigin& sourceOrigin, SourceTaintedOrigin sourceTaintedOrigin, String filename = String(), const TextPosition& startPosition = TextPosition(), SourceProviderSourceType sourceType = SourceProviderSourceType::Program)
{
    return SourceCode(StringSourceProvider::create(source, sourceOrigin, WTFMove(filename), sourceTaintedOrigin, startPosition, sourceType), startPosition.m_line.oneBasedInt(), startPosition.m_column.oneBasedInt());
}

inline SourceCode SourceCode::subExpression(unsigned openBrace, unsigned closeBrace, int firstLine, int startColumn) const
{
    startColumn += 1; // Convert to base 1.
    return SourceCode(RefPtr<SourceProvider> { provider() }, openBrace, closeBrace + 1, firstLine, startColumn);
}

} // namespace JSC
