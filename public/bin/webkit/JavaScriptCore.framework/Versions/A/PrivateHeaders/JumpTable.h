/*
 * Copyright (C) 2008-2021 Apple Inc. All rights reserved.
 * Copyright (C) 2008 Cameron Zwarich <cwzwarich@uwaterloo.ca>
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

#include "CodeLocation.h"
#include "UnlinkedCodeBlock.h"
#include <wtf/FixedVector.h>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/Vector.h>
#include <wtf/text/StringHash.h>
#include <wtf/text/StringImpl.h>

namespace JSC {

#if ENABLE(JIT)
    struct StringJumpTable {
        FixedVector<CodeLocationLabel<JSSwitchPtrTag>> m_ctiOffsets;

        void ensureCTITable(const UnlinkedStringJumpTable& unlinkedTable)
        {
            if (!isEmpty())
                return;
            m_ctiOffsets = FixedVector<CodeLocationLabel<JSSwitchPtrTag>>(unlinkedTable.m_offsetTable.size() + 1);
        }

        inline CodeLocationLabel<JSSwitchPtrTag> ctiForValue(const UnlinkedStringJumpTable& unlinkedTable, StringImpl* value) const
        {
            auto loc = unlinkedTable.m_offsetTable.find(value);
            if (loc == unlinkedTable.m_offsetTable.end())
                return m_ctiOffsets[unlinkedTable.m_offsetTable.size()];
            return m_ctiOffsets[loc->value.m_indexInTable];
        }

        CodeLocationLabel<JSSwitchPtrTag> ctiDefault() const { return m_ctiOffsets.last(); }

        bool isEmpty() const { return m_ctiOffsets.isEmpty(); }
    };

    struct SimpleJumpTable {
        FixedVector<CodeLocationLabel<JSSwitchPtrTag>> m_ctiOffsets;
        CodeLocationLabel<JSSwitchPtrTag> m_ctiDefault;

        void ensureCTITable(const UnlinkedSimpleJumpTable& unlinkedTable)
        {
            if (!isEmpty())
                return;
            m_ctiOffsets = FixedVector<CodeLocationLabel<JSSwitchPtrTag>>(unlinkedTable.m_branchOffsets.size());
        }

        inline CodeLocationLabel<JSSwitchPtrTag> ctiForValue(int32_t min, int32_t value) const
        {
            if (value >= min && static_cast<uint32_t>(value - min) < m_ctiOffsets.size())
                return m_ctiOffsets[value - min];
            return m_ctiDefault;
        }

        bool isEmpty() const { return m_ctiOffsets.isEmpty(); }
    };
#endif

} // namespace JSC
