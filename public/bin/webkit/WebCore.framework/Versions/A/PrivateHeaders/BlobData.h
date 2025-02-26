/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
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

#ifndef BlobData_h
#define BlobData_h

#include "BlobDataFileReference.h"
#include "PolicyContainer.h"
#include "SharedBuffer.h"
#include <wtf/Forward.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class BlobDataItem {
public:
    WEBCORE_EXPORT static const long long toEndOfFile;

    enum class Type {
        Data,
        File
    };

    Type type() const { return m_type; }

    // For Data type.
    DataSegment* data() const { return m_data.get(); }

    // For File type.
    BlobDataFileReference* file() const { return m_file.get(); }

    long long offset() const { return m_offset; }
    WEBCORE_EXPORT long long length() const; // Computes file length if it's not known yet.

private:
    friend class BlobData;

    explicit BlobDataItem(Ref<BlobDataFileReference>&& file)
        : m_type(Type::File)
        , m_file(WTFMove(file))
        , m_offset(0)
        , m_length(toEndOfFile)
    {
    }

    BlobDataItem(Ref<DataSegment>&& data, long long offset, long long length)
        : m_type(Type::Data)
        , m_data(WTFMove(data))
        , m_offset(offset)
        , m_length(length)
    {
    }

    BlobDataItem(BlobDataFileReference* file, long long offset, long long length)
        : m_type(Type::File)
        , m_file(file)
        , m_offset(offset)
        , m_length(length)
    {
    }

    Type m_type;
    RefPtr<DataSegment> m_data;
    RefPtr<BlobDataFileReference> m_file;

    long long m_offset;
    long long m_length;
};

typedef Vector<BlobDataItem> BlobDataItemList;

class BlobData : public ThreadSafeRefCounted<BlobData> {
public:
    static Ref<BlobData> create(const String& contentType)
    {
        return adoptRef(*new BlobData(contentType));
    }

    const String& contentType() const { return m_contentType; }

    const PolicyContainer& policyContainer() const { return m_policyContainer; }
    void setPolicyContainer(const PolicyContainer& policyContainer) { m_policyContainer = policyContainer; }

    const BlobDataItemList& items() const { return m_items; }

    void replaceData(const DataSegment& oldData, Ref<DataSegment>&& newData);
    void appendData(Ref<DataSegment>&&);
    void appendFile(Ref<BlobDataFileReference>&&);

    Ref<BlobData> clone() const;

private:
    friend class BlobRegistryImpl;
    BlobData(const String& contentType);

    void appendData(Ref<DataSegment>&&, long long offset, long long length);
    void appendFile(BlobDataFileReference*, long long offset, long long length);

    String m_contentType;
    PolicyContainer m_policyContainer;
    BlobDataItemList m_items;
};

} // namespace WebCore

#endif // BlobData_h
