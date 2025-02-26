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

#pragma once

#include "FileStreamClient.h"
#include "ResourceHandle.h"
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class AsyncFileStream;
class BlobData;
class FileStream;
class ResourceHandleClient;
class ResourceRequest;
class BlobDataItem;

class BlobResourceHandle final : public FileStreamClient, public ResourceHandle  {
public:
    static Ref<BlobResourceHandle> createAsync(BlobData*, const ResourceRequest&, ResourceHandleClient*);

    static void loadResourceSynchronously(BlobData*, const ResourceRequest&, ResourceError&, ResourceResponse&, Vector<uint8_t>& data);

    void start();
    int readSync(std::span<uint8_t>);

    bool aborted() const { return m_aborted; }

    enum class Error {
        NoError = 0,
        NotFoundError = 1,
        SecurityError = 2,
        RangeError = 3,
        NotReadableError = 4,
        MethodNotAllowed = 5
    };

private:
    BlobResourceHandle(BlobData*, const ResourceRequest&, ResourceHandleClient*, bool async);
    virtual ~BlobResourceHandle();

    // FileStreamClient methods.
    void didGetSize(long long) override;
    void didOpen(bool) override;
    void didRead(int) override;

    // ResourceHandle methods.
    void cancel() override;

    void doStart();
    void getSizeForNext();
    std::optional<Error> seek();
    void consumeData(std::span<const uint8_t>);
    void failed(Error);

    void readAsync();
    void readDataAsync(const BlobDataItem&);
    void readFileAsync(const BlobDataItem&);

    int readDataSync(const BlobDataItem&, std::span<uint8_t>);
    int readFileSync(const BlobDataItem&, std::span<uint8_t>);

    void notifyResponse();
    void notifyResponseOnSuccess();
    void notifyResponseOnError();
    void notifyReceiveData(std::span<const uint8_t>);
    void notifyFail(Error);
    void notifyFinish();

    bool erroredOrAborted() const { return m_aborted || m_errorCode != Error::NoError; }

    enum { kPositionNotSpecified = -1 };

    RefPtr<BlobData> m_blobData;
    bool m_async;
    std::unique_ptr<AsyncFileStream> m_asyncStream; // For asynchronous loading.
    std::unique_ptr<FileStream> m_stream; // For synchronous loading.
    Vector<uint8_t> m_buffer;
    Vector<long long> m_itemLengthList;
    Error m_errorCode { Error::NoError };
    bool m_aborted { false };
    bool m_isRangeRequest { false };
    long long m_rangeStart { kPositionNotSpecified };
    long long m_rangeEnd { kPositionNotSpecified };
    long long m_totalSize { 0 };
    long long m_totalRemainingSize { 0 };
    long long m_currentItemReadSize { 0 };
    unsigned m_sizeItemCount { 0 };
    unsigned m_readItemCount { 0 };
    bool m_fileOpened { false };
};

} // namespace WebCore
