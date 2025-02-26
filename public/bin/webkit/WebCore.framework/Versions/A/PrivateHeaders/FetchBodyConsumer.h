/*
 * Copyright (C) 2016-2024 Apple Inc.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted, provided that the following conditions
 * are required to be met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. AND ITS CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "FetchBodySource.h"
#include "FormDataConsumer.h"
#include "JSDOMPromiseDeferredForward.h"
#include "ReadableStreamSink.h"
#include "ScriptExecutionContextIdentifier.h"
#include "SharedBuffer.h"
#include "UserGestureIndicator.h"

namespace WebCore {

class Blob;
class DOMFormData;
class FetchBodyOwner;
class FetchBodySource;
class FormData;
class ReadableStream;

class FetchBodyConsumer final : public CanMakeCheckedPtr<FetchBodyConsumer> {
    WTF_MAKE_FAST_ALLOCATED;
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(FetchBodyConsumer);
public:
    enum class Type { None, ArrayBuffer, Blob, Bytes, JSON, Text, FormData };

    explicit FetchBodyConsumer(Type);
    FetchBodyConsumer(FetchBodyConsumer&&);
    ~FetchBodyConsumer();
    FetchBodyConsumer& operator=(FetchBodyConsumer&&);

    FetchBodyConsumer clone();

    void append(const SharedBuffer&);

    bool hasData() const { return !!m_buffer; }
    const FragmentedSharedBuffer* data() const { return m_buffer.get().get(); }
    void setData(Ref<FragmentedSharedBuffer>&&);

    RefPtr<FragmentedSharedBuffer> takeData();
    RefPtr<JSC::ArrayBuffer> takeAsArrayBuffer();
    String takeAsText();

    bool hasPendingActivity() const { return m_formDataConsumer ? m_formDataConsumer->hasPendingActivity() : false; }

    void setType(Type type) { m_type = type; }

    void clean();

    void extract(ReadableStream&, ReadableStreamToSharedBufferSink::Callback&&);
    void resolve(Ref<DeferredPromise>&&, const String& contentType, FetchBodyOwner*, ReadableStream*);
    void resolveWithData(Ref<DeferredPromise>&&, const String& contentType, std::span<const uint8_t>);
    void resolveWithFormData(Ref<DeferredPromise>&&, const String& contentType, const FormData&, ScriptExecutionContext*);
    void consumeFormDataAsStream(const FormData&, FetchBodySource&, ScriptExecutionContext*);

    void loadingFailed(const Exception&);
    void loadingSucceeded(const String& contentType);

    void setConsumePromise(Ref<DeferredPromise>&&);
    void setSource(Ref<FetchBodySource>&&);

    void setAsLoading() { m_isLoading = true; }

    static RefPtr<DOMFormData> packageFormData(ScriptExecutionContext*, const String& contentType, std::span<const uint8_t> data);

private:
    Ref<Blob> takeAsBlob(ScriptExecutionContext*, const String& contentType);
    void resetConsumePromise();

    Type m_type;
    SharedBufferBuilder m_buffer;
    RefPtr<DeferredPromise> m_consumePromise;
    RefPtr<ReadableStreamToSharedBufferSink> m_sink;
    RefPtr<FetchBodySource> m_source;
    bool m_isLoading { false };
    RefPtr<UserGestureToken> m_userGestureToken;
    RefPtr<FormDataConsumer> m_formDataConsumer;
};

} // namespace WebCore
