/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include <wtf/MediaTime.h>
#include <wtf/Ref.h>
#include <wtf/StdMap.h>

namespace WebCore {

class MediaSample;
class SampleMap;

class PresentationOrderSampleMap {
    friend class SampleMap;
public:
    using MapType = StdMap<MediaTime, Ref<MediaSample>>;
    typedef MapType::iterator iterator;
    typedef MapType::const_iterator const_iterator;
    typedef MapType::reverse_iterator reverse_iterator;
    typedef MapType::const_reverse_iterator const_reverse_iterator;
    typedef std::pair<iterator, iterator> iterator_range;
    typedef MapType::value_type value_type;

    iterator begin() { return m_samples.begin(); }
    const_iterator begin() const { return m_samples.begin(); }
    iterator end() { return m_samples.end(); }
    const_iterator end() const { return m_samples.end(); }
    reverse_iterator rbegin() { return m_samples.rbegin(); }
    const_reverse_iterator rbegin() const { return m_samples.rbegin(); }
    reverse_iterator rend() { return m_samples.rend(); }
    const_reverse_iterator rend() const { return m_samples.rend(); }

    size_t size() const { return m_samples.size(); }

    WEBCORE_EXPORT iterator findSampleWithPresentationTime(const MediaTime&);
    WEBCORE_EXPORT iterator findSampleContainingPresentationTime(const MediaTime&);
    WEBCORE_EXPORT iterator findSampleContainingOrAfterPresentationTime(const MediaTime&);
    WEBCORE_EXPORT iterator findSampleStartingOnOrAfterPresentationTime(const MediaTime&);
    WEBCORE_EXPORT iterator findSampleStartingAfterPresentationTime(const MediaTime&);
    WEBCORE_EXPORT reverse_iterator reverseFindSampleContainingPresentationTime(const MediaTime&);
    WEBCORE_EXPORT reverse_iterator reverseFindSampleBeforePresentationTime(const MediaTime&);
    WEBCORE_EXPORT iterator_range findSamplesBetweenPresentationTimes(const MediaTime&, const MediaTime&);
    WEBCORE_EXPORT iterator_range findSamplesBetweenPresentationTimesFromEnd(const MediaTime&, const MediaTime&);

private:
    MapType m_samples;
};

class DecodeOrderSampleMap {
    friend class SampleMap;
public:
    typedef std::pair<MediaTime, MediaTime> KeyType;
    using MapType = StdMap<KeyType, Ref<MediaSample>>;
    typedef MapType::iterator iterator;
    typedef MapType::const_iterator const_iterator;
    typedef MapType::reverse_iterator reverse_iterator;
    typedef MapType::const_reverse_iterator const_reverse_iterator;
    typedef std::pair<iterator, iterator> iterator_range;
    typedef std::pair<reverse_iterator, reverse_iterator> reverse_iterator_range;
    typedef MapType::value_type value_type;

    iterator begin() { return m_samples.begin(); }
    const_iterator begin() const { return m_samples.begin(); }
    iterator end() { return m_samples.end(); }
    const_iterator end() const { return m_samples.end(); }
    reverse_iterator rbegin() { return m_samples.rbegin(); }
    const_reverse_iterator rbegin() const { return m_samples.rbegin(); }
    reverse_iterator rend() { return m_samples.rend(); }
    const_reverse_iterator rend() const { return m_samples.rend(); }
    size_t size() const { return m_samples.size(); }

    WEBCORE_EXPORT iterator findSampleWithDecodeKey(const KeyType&);
    WEBCORE_EXPORT iterator findSampleAfterDecodeKey(const KeyType&);
    WEBCORE_EXPORT reverse_iterator reverseFindSampleWithDecodeKey(const KeyType&);
    WEBCORE_EXPORT reverse_iterator findSyncSamplePriorToPresentationTime(const MediaTime&, const MediaTime& threshold = MediaTime::positiveInfiniteTime());
    WEBCORE_EXPORT reverse_iterator findSyncSamplePriorToDecodeIterator(reverse_iterator);
    WEBCORE_EXPORT iterator findSyncSampleAfterPresentationTime(const MediaTime&, const MediaTime& threshold = MediaTime::positiveInfiniteTime());
    WEBCORE_EXPORT iterator findSyncSampleAfterDecodeIterator(iterator);
    WEBCORE_EXPORT reverse_iterator_range findDependentSamples(const MediaSample&);
    WEBCORE_EXPORT iterator_range findSamplesBetweenDecodeKeys(const KeyType&, const KeyType&);

private:
    MapType m_samples;
    PresentationOrderSampleMap m_presentationOrder;
};

class SampleMap {
public:
    SampleMap() = default;

    WEBCORE_EXPORT bool empty() const;
    size_t size() const { return m_decodeOrder.m_samples.size(); }
    WEBCORE_EXPORT void clear();
    WEBCORE_EXPORT void addSample(Ref<MediaSample>&&);
    WEBCORE_EXPORT void removeSample(const MediaSample&);
    size_t sizeInBytes() const { return m_totalSize; }

    template<typename I>
    void addRange(I begin, I end);

    DecodeOrderSampleMap& decodeOrder() { return m_decodeOrder; }
    const DecodeOrderSampleMap& decodeOrder() const { return m_decodeOrder; }
    PresentationOrderSampleMap& presentationOrder() { return m_decodeOrder.m_presentationOrder; }
    const PresentationOrderSampleMap& presentationOrder() const { return m_decodeOrder.m_presentationOrder; }

private:
    DecodeOrderSampleMap m_decodeOrder;
    size_t m_totalSize { 0 };
};

template<typename I>
inline void SampleMap::addRange(I begin, I end)
{
    for (I iter = begin; iter != end; ++iter)
        addSample(iter->second.copyRef());
}

} // namespace WebCore
