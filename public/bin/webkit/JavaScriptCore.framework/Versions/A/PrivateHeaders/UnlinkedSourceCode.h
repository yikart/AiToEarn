/*
 * Copyright (C) 2008-2019 Apple Inc. All rights reserved.
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

#include "SourceProvider.h"
#include <wtf/RefPtr.h>

namespace JSC {

    class UnlinkedSourceCode {
        template<typename SourceType>
        friend class CachedUnlinkedSourceCodeShape;
        friend class CachedSourceCodeWithoutProvider;

    public:
        UnlinkedSourceCode()
            : m_provider(nullptr)
            , m_startOffset(0)
            , m_endOffset(0)
        {
        }

        UnlinkedSourceCode(WTF::HashTableDeletedValueType)
            : m_provider(WTF::HashTableDeletedValue)
        {
        }

        UnlinkedSourceCode(Ref<SourceProvider>&& provider)
            : m_provider(WTFMove(provider))
            , m_startOffset(0)
            , m_endOffset(m_provider->source().length())
        {
        }

        UnlinkedSourceCode(Ref<SourceProvider>&& provider, int startOffset, int endOffset)
            : m_provider(WTFMove(provider))
            , m_startOffset(startOffset)
            , m_endOffset(endOffset)
        {
        }

        UnlinkedSourceCode(RefPtr<SourceProvider>&& provider, int startOffset, int endOffset)
            : m_provider(WTFMove(provider))
            , m_startOffset(startOffset)
            , m_endOffset(endOffset)
        {
        }

        bool isHashTableDeletedValue() const { return m_provider.isHashTableDeletedValue(); }

        SourceProvider& provider() const
        {
            return *m_provider;
        }

        unsigned hash() const
        {
            ASSERT(m_provider);
            return m_provider->hash();
        }

        StringView view() const
        {
            if (!m_provider)
                return StringView();
            return m_provider->getRange(m_startOffset, m_endOffset);
        }
        
        CString toUTF8() const;
        
        bool isNull() const { return !m_provider; }
        int startOffset() const { return m_startOffset; }
        int endOffset() const { return m_endOffset; }
        int length() const { return m_endOffset - m_startOffset; }

        friend bool operator==(const UnlinkedSourceCode&, const UnlinkedSourceCode&) = default;

    protected:
        // FIXME: Make it Ref<SourceProvidier>.
        // https://bugs.webkit.org/show_bug.cgi?id=168325
        RefPtr<SourceProvider> m_provider;
        int m_startOffset;
        int m_endOffset;
    };

} // namespace JSC
