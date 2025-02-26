/*
 * Copyright (C) 2009 Google Inc. All rights reserved.
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

#include "ResourceLoaderOptions.h"
#include <wtf/Noncopyable.h>
#include <wtf/RefPtr.h>
#include <wtf/text/AtomString.h>

namespace WebCore {

    class ResourceError;
    class ResourceRequest;
    class ResourceResponse;
    class ScriptExecutionContext;
    class ThreadableLoaderClient;

    enum class ContentSecurityPolicyEnforcement {
        DoNotEnforce,
        EnforceWorkerSrcDirective,
        EnforceConnectSrcDirective,
        EnforceScriptSrcDirective,
    };

    enum class ResponseFilteringPolicy {
        Enable,
        Disable,
    };

    struct ThreadableLoaderOptions : ResourceLoaderOptions {
        ThreadableLoaderOptions();
        explicit ThreadableLoaderOptions(FetchOptions&&);
        ThreadableLoaderOptions(const ResourceLoaderOptions&, ContentSecurityPolicyEnforcement, String&& initiatorType, ResponseFilteringPolicy);
        ~ThreadableLoaderOptions();

        ThreadableLoaderOptions isolatedCopy() const;

        ContentSecurityPolicyEnforcement contentSecurityPolicyEnforcement { ContentSecurityPolicyEnforcement::EnforceConnectSrcDirective };
        String initiatorType; // This cannot be an AtomString, as isolatedCopy() wouldn't create an object that's safe for passing to another thread.
        ResponseFilteringPolicy filteringPolicy { ResponseFilteringPolicy::Disable };
    };

    // Useful for doing loader operations from any thread (not threadsafe,
    // just able to run on threads other than the main thread).
    class ThreadableLoader {
        WTF_MAKE_NONCOPYABLE(ThreadableLoader);
    public:
        static void loadResourceSynchronously(ScriptExecutionContext&, ResourceRequest&&, ThreadableLoaderClient&, const ThreadableLoaderOptions&);
        static RefPtr<ThreadableLoader> create(ScriptExecutionContext&, ThreadableLoaderClient&, ResourceRequest&&, const ThreadableLoaderOptions&, String&& referrer = String(), String&& taskMode = { });

        virtual void computeIsDone() = 0;
        virtual void cancel() = 0;
        void ref() { refThreadableLoader(); }
        void deref() { derefThreadableLoader(); }

        static void logError(ScriptExecutionContext&, const ResourceError&, const String&);

    protected:
        ThreadableLoader() = default;
        virtual ~ThreadableLoader() = default;
        virtual void refThreadableLoader() = 0;
        virtual void derefThreadableLoader() = 0;
    };

} // namespace WebCore
