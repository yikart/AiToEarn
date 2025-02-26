/*
 * Copyright (C) 2014-2020 Apple Inc. All rights reserved.
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

#include <wtf/URL.h>

namespace IPC {
template<typename T, typename> struct ArgumentCoder;
}

namespace WebCore {

class BlobPart {
private:
    friend struct IPC::ArgumentCoder<BlobPart, void>;
public:
    enum class Type : bool {
        Data,
        Blob
    };

    BlobPart()
        : m_dataOrURL(Vector<uint8_t> { })
    {
    }

    BlobPart(Vector<uint8_t>&& data)
        : m_dataOrURL(WTFMove(data))
    {
    }

    BlobPart(const URL& url)
        : m_dataOrURL(url)
    {
    }

    Type type() const
    {
        return std::holds_alternative<URL>(m_dataOrURL) ? Type::Blob : Type::Data;
    }

    Vector<uint8_t>&& moveData()
    {
        ASSERT(std::holds_alternative<Vector<uint8_t>>(m_dataOrURL));
        return WTFMove(std::get<Vector<uint8_t>>(m_dataOrURL));
    }

    const URL& url() const
    {
        ASSERT(std::holds_alternative<URL>(m_dataOrURL));
        return std::get<URL>(m_dataOrURL);
    }

    void detachFromCurrentThread()
    {
        if (std::holds_alternative<URL>(m_dataOrURL))
            m_dataOrURL = std::get<URL>(m_dataOrURL).isolatedCopy();
    }

private:
    BlobPart(std::variant<Vector<uint8_t>, URL>&& dataOrURL)
        : m_dataOrURL(WTFMove(dataOrURL))
    {
    }

    std::variant<Vector<uint8_t>, URL> m_dataOrURL;
};

} // namespace WebCore
