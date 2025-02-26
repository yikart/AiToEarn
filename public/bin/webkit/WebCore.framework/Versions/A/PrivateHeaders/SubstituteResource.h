/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
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

#include "ResourceLoader.h"
#include "ResourceResponse.h"
#include "SharedBuffer.h"

namespace WebCore {

class SubstituteResource : public RefCounted<SubstituteResource> {
public:
    virtual ~SubstituteResource() = default;

    const URL& url() const { return m_url; }
    const ResourceResponse& response() const { return m_response; }
    FragmentedSharedBuffer& data() const { return *m_data.get(); }
    void append(const SharedBuffer& buffer) { m_data.append(buffer); }
    void clear() { m_data.empty(); }

    virtual void deliver(ResourceLoader& loader) { loader.deliverResponseAndData(m_response, m_data.copy()); }

protected:
    SubstituteResource(URL&& url, ResourceResponse&& response, Ref<FragmentedSharedBuffer>&& data)
        : m_url(WTFMove(url))
        , m_response(WTFMove(response))
        , m_data(WTFMove(data))
    {
    }

private:
    URL m_url;
    ResourceResponse m_response;
    SharedBufferBuilder m_data;
};

} // namespace WebCore
