/*
 * Copyright (C) 2011-2020 Apple Inc. All rights reserved.
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

#include "ContextDestructionObserver.h"
#include "WebCoreOpaqueRoot.h"
#include <wtf/LoggerHelper.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/AtomString.h>

namespace WebCore {

class SourceBuffer;
class TrackListBase;
class TrackPrivateBase;
class TrackPrivateBaseClient;
using TrackID = uint64_t;

class TrackBase
    : public RefCounted<TrackBase>
    , public ContextDestructionObserver
#if !RELEASE_LOG_DISABLED
    , private LoggerHelper
#endif
{
    WTF_MAKE_TZONE_ALLOCATED(TrackBase);
public:
    virtual ~TrackBase();

    virtual void didMoveToNewDocument(Document&);

    enum Type { BaseTrack, TextTrack, AudioTrack, VideoTrack };
    Type type() const { return m_type; }

    virtual AtomString id() const { return m_id; }
    TrackID trackId() const { return m_trackId; }
    AtomString label() const { return m_label; }
    AtomString validBCP47Language() const { return m_validBCP47Language; }
    AtomString language() const { return m_language; }

    virtual int uniqueId() const { return m_uniqueId; }

#if ENABLE(MEDIA_SOURCE)
    SourceBuffer* sourceBuffer() const { return m_sourceBuffer; }
    void setSourceBuffer(SourceBuffer* buffer) { m_sourceBuffer = buffer; }
#endif

    void setTrackList(TrackListBase&);
    void clearTrackList();
    TrackListBase* trackList() const;
    WebCoreOpaqueRoot opaqueRoot();

    virtual bool enabled() const = 0;

#if !RELEASE_LOG_DISABLED
    virtual void setLogger(const Logger&, uint64_t);
    const Logger& logger() const final { ASSERT(m_logger); return *m_logger.get(); }
    uint64_t logIdentifier() const final { return m_logIdentifier; }
    WTFLogChannel& logChannel() const final;
#endif

protected:
    TrackBase(ScriptExecutionContext*, Type, const std::optional<AtomString>& id, TrackID, const AtomString& label, const AtomString& language);

    virtual void setId(TrackID id)
    {
        m_id = AtomString::number(id);
        m_trackId = id;
    }
    virtual void setLabel(const AtomString& label) { m_label = label; }
    virtual void setLanguage(const AtomString&);

#if ENABLE(MEDIA_SOURCE)
    SourceBuffer* m_sourceBuffer { nullptr };
#endif

    void addClientToTrackPrivateBase(TrackPrivateBaseClient&, TrackPrivateBase&);
    void removeClientFromTrackPrivateBase(TrackPrivateBase&);

private:
    Type m_type;
    int m_uniqueId;
    AtomString m_id;
    TrackID m_trackId { 0 };
    AtomString m_label;
    AtomString m_language;
    AtomString m_validBCP47Language;
#if !RELEASE_LOG_DISABLED
    RefPtr<const Logger> m_logger;
    uint64_t m_logIdentifier { 0 };
#endif
    WeakPtr<TrackListBase, WeakPtrImplWithEventTargetData> m_trackList;
    size_t m_clientRegistrationId;
};

class MediaTrackBase : public TrackBase {
    WTF_MAKE_TZONE_ALLOCATED(MediaTrackBase);
public:
    const AtomString& kind() const { return m_kind; }
    virtual void setKind(const AtomString&);

protected:
    MediaTrackBase(ScriptExecutionContext*, Type, const std::optional<AtomString>& id, TrackID, const AtomString& label, const AtomString& language);

    void setKindInternal(const AtomString&);

private:
    virtual bool isValidKind(const AtomString&) const = 0;

    AtomString m_kind;
};

inline WebCoreOpaqueRoot root(TrackBase* track)
{
    return track->opaqueRoot();
}

} // namespace WebCore

#endif
