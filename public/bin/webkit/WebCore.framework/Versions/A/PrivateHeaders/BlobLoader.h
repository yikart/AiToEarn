/*
 * Copyright (C) 2019-2024 Apple Inc. All rights reserved.
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

#include "Blob.h"
#include "Document.h"
#include "ExceptionCode.h"
#include "FileReaderLoader.h"
#include "FileReaderLoaderClient.h"
#include "Logging.h"
#include "SharedBuffer.h"
#include <JavaScriptCore/ArrayBuffer.h>
#include <wtf/CompletionHandler.h>

namespace WebCore {

class BlobLoader final : public FileReaderLoaderClient {
    WTF_MAKE_TZONE_ALLOCATED(BlobLoader);
public:
    // CompleteCallback is always called except if BlobLoader is cancelled/deallocated.
    using CompleteCallback = Function<void(BlobLoader&)>;
    explicit BlobLoader(CompleteCallback&&);
    ~BlobLoader();

    void start(Blob&, ScriptExecutionContext*, FileReaderLoader::ReadType);
    void start(const URL&, ScriptExecutionContext*, FileReaderLoader::ReadType);

    void cancel();
    bool isLoading() const { return m_loader && m_completeCallback; }
    String stringResult() const { return m_loader ? m_loader->stringResult() : String(); }
    RefPtr<JSC::ArrayBuffer> arrayBufferResult() const { return m_loader ? m_loader->arrayBufferResult() : nullptr; }
    std::optional<ExceptionCode> errorCode() const { return m_loader ? m_loader->errorCode() : std::nullopt; }

private:
    void didStartLoading() final { }
    void didReceiveData() final { }

    void didFinishLoading() final;
    void didFail(ExceptionCode errorCode) final;
    void complete();

    std::unique_ptr<FileReaderLoader> m_loader;
    CompleteCallback m_completeCallback;
};

inline BlobLoader::BlobLoader(CompleteCallback&& completeCallback)
    : m_completeCallback(WTFMove(completeCallback))
{
}

inline BlobLoader::~BlobLoader()
{
    if (isLoading())
        cancel();
}

inline void BlobLoader::cancel()
{
    RELEASE_LOG_INFO_IF(m_completeCallback, Loading, "Cancelling ongoing blob loader");
    if (m_loader)
        m_loader->cancel();
}

inline void BlobLoader::start(Blob& blob, ScriptExecutionContext* context, FileReaderLoader::ReadType readType)
{
    ASSERT(!m_loader);
    m_loader = makeUnique<FileReaderLoader>(readType, this);
    m_loader->start(context, blob);
}

inline void BlobLoader::start(const URL& blobURL, ScriptExecutionContext* context, FileReaderLoader::ReadType readType)
{
    ASSERT(!m_loader);
    m_loader = makeUnique<FileReaderLoader>(readType, this);
    m_loader->start(context, blobURL);
}

inline void BlobLoader::didFinishLoading()
{
    std::exchange(m_completeCallback, { })(*this);
}

inline void BlobLoader::didFail(ExceptionCode)
{
    std::exchange(m_completeCallback, { })(*this);
}

} // namespace WebCore
