/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ShareableResource.h"
#include "SharedBuffer.h"

namespace WebCore {

class ScriptBuffer {
public:
    ScriptBuffer() = default;

    ScriptBuffer(RefPtr<FragmentedSharedBuffer>&& buffer)
        : m_buffer(WTFMove(buffer))
    {
    }

    static ScriptBuffer empty();

    WEBCORE_EXPORT explicit ScriptBuffer(const String&);

    String toString() const;
    const FragmentedSharedBuffer* buffer() const { return m_buffer.get().get(); }

    ScriptBuffer isolatedCopy() const { return ScriptBuffer(m_buffer ? RefPtr<FragmentedSharedBuffer>(m_buffer.copy()) : nullptr); }
    explicit operator bool() const { return !!m_buffer; }
    bool isEmpty() const { return m_buffer.isEmpty(); }

    WEBCORE_EXPORT bool containsSingleFileMappedSegment() const;
    void append(const String&);
    void append(const FragmentedSharedBuffer&);

#if ENABLE(SHAREABLE_RESOURCE) && PLATFORM(COCOA)
    using IPCData = std::variant<ShareableResourceHandle, RefPtr<FragmentedSharedBuffer>>;
#else
    using IPCData = RefPtr<FragmentedSharedBuffer>;
#endif

    WEBCORE_EXPORT static std::optional<ScriptBuffer> fromIPCData(IPCData&&);
    WEBCORE_EXPORT IPCData ipcData() const;

private:
    SharedBufferBuilder m_buffer; // Contains the UTF-8 encoded script.
};

bool operator==(const ScriptBuffer&, const ScriptBuffer&);

} // namespace WebCore
