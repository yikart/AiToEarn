/*
 * Copyright (C) 2010 Google Inc.  All rights reserved.
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

#include "BlobResourceHandle.h"
#include "ExceptionCode.h"
#include "ThreadableLoaderClient.h"
#include "URLKeepingBlobAlive.h"
#include <pal/text/TextEncoding.h>
#include <wtf/Forward.h>
#include <wtf/URL.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace JSC {
class ArrayBuffer;
}

namespace WebCore {

class Blob;
class FileReaderLoaderClient;
class ScriptExecutionContext;
class TextResourceDecoder;
class ThreadableLoader;

class FileReaderLoader final : public ThreadableLoaderClient {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(FileReaderLoader);
public:
    enum ReadType {
        ReadAsArrayBuffer,
        ReadAsBinaryString,
        ReadAsBlob,
        ReadAsText,
        ReadAsDataURL,
        ReadAsBinaryChunks
    };

    // If client is given, do the loading asynchronously. Otherwise, load synchronously.
    WEBCORE_EXPORT FileReaderLoader(ReadType, FileReaderLoaderClient*);
    ~FileReaderLoader();

    WEBCORE_EXPORT void start(ScriptExecutionContext*, Blob&);
    void start(ScriptExecutionContext*, const URL&);
    WEBCORE_EXPORT void cancel();

    // ThreadableLoaderClient
    void didReceiveResponse(ScriptExecutionContextIdentifier, std::optional<ResourceLoaderIdentifier>, const ResourceResponse&) override;
    void didReceiveData(const SharedBuffer&) override;
    void didFinishLoading(ScriptExecutionContextIdentifier, std::optional<ResourceLoaderIdentifier>, const NetworkLoadMetrics&) override;
    void didFail(std::optional<ScriptExecutionContextIdentifier>, const ResourceError&) override;

    String stringResult();
    WEBCORE_EXPORT RefPtr<JSC::ArrayBuffer> arrayBufferResult() const;
    unsigned bytesLoaded() const { return m_bytesLoaded; }
    unsigned totalBytes() const { return m_totalBytes; }
    std::optional<ExceptionCode> errorCode() const { return m_errorCode; }

    void setEncoding(StringView);
    void setDataType(const String& dataType) { m_dataType = dataType; }

    const URL& url() { return m_urlForReading; }

    bool isCompleted() const;

private:
    void terminate();
    void cleanup();
    void failed(ExceptionCode);
    void convertToText();
    void convertToDataURL();
    bool processResponse(const ResourceResponse&);

    static ExceptionCode httpStatusCodeToErrorCode(int);
    static ExceptionCode toErrorCode(BlobResourceHandle::Error);

    ReadType m_readType;
    WeakPtr<FileReaderLoaderClient> m_client;
    PAL::TextEncoding m_encoding;
    String m_dataType;

    URLKeepingBlobAlive m_urlForReading;
    RefPtr<ThreadableLoader> m_loader;

    RefPtr<JSC::ArrayBuffer> m_rawData;
    bool m_isRawDataConverted;

    String m_stringResult;
    RefPtr<Blob> m_blobResult;

    // The decoder used to decode the text data.
    RefPtr<TextResourceDecoder> m_decoder;

    bool m_variableLength;
    unsigned m_bytesLoaded;
    unsigned m_totalBytes;

    std::optional<ExceptionCode> m_errorCode;
};

} // namespace WebCore
