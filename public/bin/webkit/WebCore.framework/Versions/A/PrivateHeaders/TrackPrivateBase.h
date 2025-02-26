/*
 * Copyright (C) 2012-2017 Apple Inc. All rights reserved.
 * Copyright (C) 2013 Cable Television Labs, Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(VIDEO)

#include "ScriptExecutionContextIdentifier.h"
#include "TrackPrivateBaseClient.h"
#include <wtf/Lock.h>
#include <wtf/LoggerHelper.h>
#include <wtf/MediaTime.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/Vector.h>
#include <wtf/text/AtomString.h>

namespace WebCore {

using TrackID = uint64_t;

class WEBCORE_EXPORT TrackPrivateBase
    : public ThreadSafeRefCounted<TrackPrivateBase>
#if !RELEASE_LOG_DISABLED
    , public LoggerHelper
#endif
{
    WTF_MAKE_TZONE_ALLOCATED(TrackPrivateBase);
    WTF_MAKE_NONCOPYABLE(TrackPrivateBase);
public:
    virtual ~TrackPrivateBase() = default;

    size_t addClient(TrackPrivateBaseClient::Dispatcher&&, TrackPrivateBaseClient&);
    void removeClient(uint32_t); // Can be called multiple times with the same id.

    virtual TrackID id() const { return 0; }
    virtual AtomString label() const { return emptyAtom(); }
    virtual AtomString language() const { return emptyAtom(); }

    virtual int trackIndex() const { return 0; }
    virtual std::optional<AtomString> trackUID() const;
    virtual std::optional<bool> defaultEnabled() const;

    virtual MediaTime startTimeVariance() const { return MediaTime::zeroTime(); }

    void willBeRemoved()
    {
        notifyClients([](auto& client) {
            client.willRemove();
        });
    }

    bool operator==(const TrackPrivateBase&) const;

    enum class Type { Video, Audio, Text };
    virtual Type type() const = 0;

#if !RELEASE_LOG_DISABLED
    virtual void setLogger(const Logger&, uint64_t);
    const Logger& logger() const final { ASSERT(m_logger); return *m_logger.get(); }
    uint64_t logIdentifier() const final { return m_logIdentifier; }
    WTFLogChannel& logChannel() const final;
#endif

    using Task = Function<void(TrackPrivateBaseClient&)>;
    void notifyClients(Task&&);
    void notifyMainThreadClient(Task&&);

protected:
    TrackPrivateBase() = default;

    template <typename T>
    class Shared final : public ThreadSafeRefCounted<Shared<T>> {
    public:
        static Ref<Shared> create(T&& obj) { return adoptRef(*new Shared(WTFMove(obj))); }

        T& get() { return m_obj; };
    private:
        Shared(T&& obj)
            : m_obj(WTFMove(obj))
        {
        }
        T m_obj;
    };
    using SharedDispatcher = Shared<TrackPrivateBaseClient::Dispatcher>;

    bool hasClients() const;
    bool hasOneClient() const;
    mutable Lock m_lock;
    using ClientRecord = std::tuple<RefPtr<SharedDispatcher>, WeakPtr<TrackPrivateBaseClient>, bool /* is main thread */>;
    Vector<ClientRecord> m_clients WTF_GUARDED_BY_LOCK(m_lock);

#if !RELEASE_LOG_DISABLED
    RefPtr<const Logger> m_logger;
    uint64_t m_logIdentifier { 0 };
#endif
};

} // namespace WebCore

#endif
