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

#include "PlatformAudioData.h"
#include <CoreAudio/CoreAudioTypes.h>
#include <wtf/IteratorRange.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

struct AudioBuffer;
struct AudioBufferList;
typedef struct OpaqueCMBlockBuffer* CMBlockBufferRef;
typedef struct opaqueCMSampleBuffer* CMSampleBufferRef;

namespace WebCore {

class CAAudioStreamDescription;

class WebAudioBufferList final : public PlatformAudioData {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(WebAudioBufferList, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT WebAudioBufferList(const CAAudioStreamDescription&);
    WEBCORE_EXPORT WebAudioBufferList(const CAAudioStreamDescription&, size_t sampleCount);
    WebAudioBufferList(const CAAudioStreamDescription&, CMSampleBufferRef);
    WEBCORE_EXPORT virtual ~WebAudioBufferList();

    static std::optional<std::pair<UniqueRef<WebAudioBufferList>, RetainPtr<CMBlockBufferRef>>> createWebAudioBufferListWithBlockBuffer(const CAAudioStreamDescription&, size_t sampleCount);

    void reset();
    WEBCORE_EXPORT void setSampleCount(size_t);

    AudioBufferList* list() const { return m_list.get(); }
    operator AudioBufferList&() const { return *m_list; }

    uint32_t bufferCount() const;
    uint32_t channelCount() const { return m_channelCount; }
    AudioBuffer* buffer(uint32_t index) const;

    template <typename T = uint8_t>
    std::span<T> bufferAsSpan(uint32_t index) const
    {
        ASSERT(index < m_list->mNumberBuffers);
        WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN
        if (index < m_list->mNumberBuffers)
            return unsafeMakeSpan(static_cast<T*>(m_list->mBuffers[index].mData), m_list->mBuffers[index].mDataByteSize / sizeof(T));
        WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
        return { };
    }

    IteratorRange<AudioBuffer*> buffers() const;

    WEBCORE_EXPORT static bool isSupportedDescription(const CAAudioStreamDescription&, size_t sampleCount);

    WEBCORE_EXPORT void zeroFlatBuffer();

private:
    Kind kind() const { return Kind::WebAudioBufferList; }
    void initializeList(std::span<uint8_t>, size_t);
    RetainPtr<CMBlockBufferRef> setSampleCountWithBlockBuffer(size_t);

    size_t m_listBufferSize { 0 };
    uint32_t m_bytesPerFrame { 0 };
    uint32_t m_channelCount { 0 };
    size_t m_sampleCount { 0 };
    std::unique_ptr<AudioBufferList> m_canonicalList;
    std::unique_ptr<AudioBufferList> m_list;
    RetainPtr<CMBlockBufferRef> m_blockBuffer;
    Vector<uint8_t> m_flatBuffer;
};

}

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::WebAudioBufferList)
static bool isType(const WebCore::PlatformAudioData& data) { return data.kind() == WebCore::PlatformAudioData::Kind::WebAudioBufferList; }
SPECIALIZE_TYPE_TRAITS_END()
