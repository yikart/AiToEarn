/*
 * Copyright (C) 2021-2023 Apple Inc. All rights reserved.
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

#include <wtf/Forward.h>
#include <wtf/ThreadSafeWeakPtr.h>
#include <wtf/URLHash.h>

OBJC_CLASS NSURLRequest;
OBJC_CLASS WebCoreNSURLSessionDataTask;

namespace WebCore {

struct ParsedRequestRange;
class PlatformMediaResource;
class ResourceResponse;

class RangeResponseGenerator final
    : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<RangeResponseGenerator, WTF::DestructionThread::Main> {
public:
    static Ref<RangeResponseGenerator> create(GuaranteedSerialFunctionDispatcher& dispatcher) { return adoptRef(*new RangeResponseGenerator(dispatcher)); }
    ~RangeResponseGenerator();

    bool willSynthesizeRangeResponses(WebCoreNSURLSessionDataTask *, PlatformMediaResource&, const ResourceResponse&);
    bool willHandleRequest(WebCoreNSURLSessionDataTask *, NSURLRequest *);
    void removeTask(WebCoreNSURLSessionDataTask *);

private:
    struct Data;

    RangeResponseGenerator(WTF::GuaranteedSerialFunctionDispatcher&);
    HashMap<String, std::unique_ptr<Data>>& map();

    class MediaResourceClient;
    void giveResponseToTasksWithFinishedRanges(Data&);
    void giveResponseToTaskIfBytesInRangeReceived(WebCoreNSURLSessionDataTask *, const ParsedRequestRange&, std::optional<size_t> expectedContentLength, const Data&);
    static std::optional<size_t> expectedContentLengthFromData(const Data&);

    HashMap<String, std::unique_ptr<Data>> m_map WTF_GUARDED_BY_CAPABILITY(m_targetDispatcher.get());
    Ref<GuaranteedSerialFunctionDispatcher> m_targetDispatcher;
};

} // namespace WebCore
