/*
 * Copyright (C) Research In Motion Limited 2010. All rights reserved.
 * Copyright (C) 2018-2019 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 */

#pragma once

#include "Path.h"
#include "SVGPathUtilities.h"
#include "SVGPropertyTraits.h"
#include <wtf/TZoneMallocInlines.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class SVGPathByteStream;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::SVGPathByteStream> : std::true_type { };
}

namespace WebCore {

class SVGPathByteStream final : public CanMakeSingleThreadWeakPtr<SVGPathByteStream> {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(SVGPathByteStream);
public:
    class Data final : public RefCounted<Data> {
    public:
        friend class NeverDestroyed<Data, MainThreadAccessTraits>;

        using Bytes = Vector<uint8_t>;

        static Ref<Data> create(Bytes&& bytes)
        {
            return adoptRef(*new Data(WTFMove(bytes)));
        }

        void updatePath(const Path& path) const
        {
            m_path = path;
        }

        static Ref<Data> empty()
        {
            static MainThreadNeverDestroyed<Data> singleton;
            return Ref { singleton.get() };
        }

        const Bytes& bytes() const { return m_bytes; }

        void append(uint8_t byte)
        {
            m_path = { };
            m_bytes.append(byte);
        }

        void append(std::span<const uint8_t> bytes)
        {
            m_path = { };
            m_bytes.append(bytes);
        }

        void append(const Bytes& other)
        {
            m_path = { };
            m_bytes.appendVector(other);
        }

        const Path& path() const { return m_path; }

        Ref<Data> copy() const
        {
            return adoptRef(*new Data(*this));
        }

        friend bool operator==(const Data& a, const Data& b)
        {
            return a.m_bytes == b.m_bytes;
        }

        unsigned size() const { return m_bytes.size(); }
        bool isEmpty() const { return m_bytes.isEmpty(); }

    private:
        Data(Bytes&& bytes)
            : m_bytes(WTFMove(bytes))
        {
        }

        Data() = default;
        Data(const Data& data)
            : m_bytes(data.m_bytes)
            , m_path(data.m_path)
        {
        }

        Bytes m_bytes;
        mutable Path m_path;
    };

    using DataIterator = Data::Bytes::const_iterator;

    SVGPathByteStream()
        : m_data(Data::empty())
    {
    }

    SVGPathByteStream(StringView string)
        : SVGPathByteStream()
    {
        buildSVGPathByteStreamFromString(string, *this, UnalteredParsing);
    }

    SVGPathByteStream(const SVGPathByteStream& other)
        : CanMakeSingleThreadWeakPtr<SVGPathByteStream>()
        , m_data(other.m_data)
    {
    }

    SVGPathByteStream(SVGPathByteStream&& other)
        : CanMakeSingleThreadWeakPtr<SVGPathByteStream>()
        , m_data(std::exchange(other.m_data, Data::empty()))
    {
    }

    SVGPathByteStream(Ref<Data>&& data)
        : m_data(WTFMove(data))
    {
    }

    SVGPathByteStream(Data::Bytes&& data)
        : m_data(Data::create(WTFMove(data)))
    {
    }

    static SVGPathByteStream& empty()
    {
        static MainThreadNeverDestroyed<SVGPathByteStream> singleton;
        return singleton;
    }

    SVGPathByteStream& operator=(const SVGPathByteStream& other)
    {
        if (this == &other)
            return *this;
        m_data = other.m_data;
        return *this;
    }

    SVGPathByteStream& operator=(SVGPathByteStream&& other)
    {
        if (this == &other)
            return *this;
        m_data = std::exchange(other.m_data, Data::empty());
        return *this;
    }

    friend bool operator==(const SVGPathByteStream& a, const SVGPathByteStream& b)
    {
        return a.m_data == b.m_data;
    }

    std::unique_ptr<SVGPathByteStream> copy() const
    {
        return makeUnique<SVGPathByteStream>(*this);
    }

    DataIterator begin() const { return m_data->bytes().begin(); }
    DataIterator end() const { return m_data->bytes().end(); }

    void append(uint8_t byte) { m_data.access().append(byte); }
    void append(std::span<const uint8_t> bytes) { m_data.access().append(bytes); }
    void append(const SVGPathByteStream& other) { m_data.access().append(other.m_data->bytes()); }
    void clear() { m_data = Data::empty(); }
    bool isEmpty() const { return m_data->isEmpty(); }
    unsigned size() const { return m_data->size(); }
    // Making empty for now instead of sharing Vectors.
    void shrinkToFit() { }

    std::optional<Path> cachedPath() const
    {
        if (m_data->path().isEmpty())
            return std::nullopt;
        return m_data->path();
    }

    void cachePath(const Path& path) const
    {
        m_data->updatePath(path);
    }

    const Data::Bytes& bytes() const { return m_data->bytes(); }

    DataRef<Data> data() const { return m_data; }
    void setData(DataRef<Data>&& data) { m_data = WTFMove(data); }

private:
    DataRef<Data> m_data;
};

} // namespace WebCore
