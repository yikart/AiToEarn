/*
 * Copyright (C) 2022 Igalia S.L.
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

#if ENABLE(NOTIFICATIONS)

#include "Notification.h"
#include "SharedBuffer.h"
#include "ThreadableLoader.h"
#include <wtf/CompletionHandler.h>
#include <wtf/HashSet.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class BitmapImage;
class NetworkLoadMetrics;
class NotificationResources;
class ResourceError;
class ResourceResponse;

class NotificationResourcesLoader {
    WTF_MAKE_TZONE_ALLOCATED(NotificationResourcesLoader);
public:
    explicit NotificationResourcesLoader(Notification&);

    void start(CompletionHandler<void(RefPtr<NotificationResources>&&)>&&);
    void stop();

private:
    enum class Resource { Image, Icon, Badge, ActionIcon };
    static bool resourceIsSupportedInPlatform(Resource);

    class ResourceLoader final : public ThreadableLoaderClient {
        WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
        WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ResourceLoader);
    public:
        ResourceLoader(ScriptExecutionContext&, const URL&, CompletionHandler<void(ResourceLoader*, RefPtr<BitmapImage>&&)>&&);
        ~ResourceLoader();

        void cancel();

        bool finished() const { return m_finished; }

    private:
        // ThreadableLoaderClient API.
        void didReceiveResponse(ScriptExecutionContextIdentifier, std::optional<ResourceLoaderIdentifier>, const ResourceResponse&) final;
        void didReceiveData(const SharedBuffer&) final;
        void didFinishLoading(ScriptExecutionContextIdentifier, std::optional<ResourceLoaderIdentifier>, const NetworkLoadMetrics&) final;
        void didFail(std::optional<ScriptExecutionContextIdentifier>, const ResourceError&) final;

        bool m_finished { false };
        SharedBufferBuilder m_buffer;
        RefPtr<BitmapImage> m_image;
        RefPtr<ThreadableLoader> m_loader;
        CompletionHandler<void(ResourceLoader*, RefPtr<BitmapImage>&&)> m_completionHandler;
    };

    void didFinishLoadingResource(ResourceLoader*);

    Notification& m_notification;
    bool m_stopped { false };
    CompletionHandler<void(RefPtr<NotificationResources>&&)> m_completionHandler;
    HashSet<std::unique_ptr<ResourceLoader>> m_loaders;
    RefPtr<NotificationResources> m_resources;
};

} // namespace WebCore

#endif // ENABLE(NOTIFICATIONS)
