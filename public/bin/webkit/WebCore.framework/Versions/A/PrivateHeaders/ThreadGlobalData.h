/*
 * Copyright (C) 2008, 2014 Apple Inc. All Rights Reserved.
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
 *
 */

#pragma once

#include <pal/ThreadGlobalData.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/text/StringHash.h>

namespace JSC {
class CallFrame;
class JSGlobalObject;
}

namespace WebCore {

class FontCache;
class QualifiedNameCache;
class ThreadTimers;

struct CachedResourceRequestInitiatorTypes;
struct EventNames;
struct MIMETypeRegistryThreadGlobalData;

class ThreadGlobalData : public PAL::ThreadGlobalData {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ThreadGlobalData, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(ThreadGlobalData);
public:
    WEBCORE_EXPORT ThreadGlobalData();
    WEBCORE_EXPORT ~ThreadGlobalData();
    void destroy(); // called on workers to clean up the ThreadGlobalData before the thread exits.

    const CachedResourceRequestInitiatorTypes& cachedResourceRequestInitiatorTypes()
    {
        ASSERT(!m_destroyed);
        if (UNLIKELY(!m_cachedResourceRequestInitiatorTypes))
            initializeCachedResourceRequestInitiatorTypes();
        return *m_cachedResourceRequestInitiatorTypes;
    }
    EventNames& eventNames()
    {
        ASSERT(!m_destroyed);
        if (UNLIKELY(!m_eventNames))
            initializeEventNames();
        return *m_eventNames;
    }
    QualifiedNameCache& qualifiedNameCache()
    {
        ASSERT(!m_destroyed);
        if (UNLIKELY(!m_qualifiedNameCache))
            initializeQualifiedNameCache();
        return *m_qualifiedNameCache;
    }
    const MIMETypeRegistryThreadGlobalData& mimeTypeRegistryThreadGlobalData()
    {
        ASSERT(!m_destroyed);
        if (UNLIKELY(!m_MIMETypeRegistryThreadGlobalData))
            initializeMimeTypeRegistryThreadGlobalData();
        return *m_MIMETypeRegistryThreadGlobalData;
    }

    ThreadTimers& threadTimers() { return *m_threadTimers; }

    JSC::JSGlobalObject* currentState() const { return m_currentState; }
    void setCurrentState(JSC::JSGlobalObject* state) { m_currentState = state; }

#if USE(WEB_THREAD)
    void setWebCoreThreadData();
#endif

    bool isInRemoveAllEventListeners() const { return m_isInRemoveAllEventListeners; }
    void setIsInRemoveAllEventListeners(bool value) { m_isInRemoveAllEventListeners = value; }

    FontCache& fontCache()
    {
        ASSERT(!m_destroyed);
        if (UNLIKELY(!m_fontCache))
            initializeFontCache();
        return *m_fontCache;
    }

    FontCache* fontCacheIfExists() { return m_fontCache.get(); }
    FontCache* fontCacheIfNotDestroyed() { return m_destroyed ? nullptr : &fontCache(); }

private:
    bool m_destroyed { false };

    WEBCORE_EXPORT void initializeCachedResourceRequestInitiatorTypes();
    WEBCORE_EXPORT void initializeEventNames();
    WEBCORE_EXPORT void initializeQualifiedNameCache();
    WEBCORE_EXPORT void initializeMimeTypeRegistryThreadGlobalData();
    WEBCORE_EXPORT void initializeFontCache();

    std::unique_ptr<CachedResourceRequestInitiatorTypes> m_cachedResourceRequestInitiatorTypes;
    std::unique_ptr<EventNames> m_eventNames;
    std::unique_ptr<ThreadTimers> m_threadTimers;
    std::unique_ptr<QualifiedNameCache> m_qualifiedNameCache;
    JSC::JSGlobalObject* m_currentState { nullptr };
    std::unique_ptr<MIMETypeRegistryThreadGlobalData> m_MIMETypeRegistryThreadGlobalData;
    std::unique_ptr<FontCache> m_fontCache;

#ifndef NDEBUG
    bool m_isMainThread;
#endif

    bool m_isInRemoveAllEventListeners { false };

    friend ThreadGlobalData& threadGlobalData();
};


#if USE(WEB_THREAD)
WEBCORE_EXPORT ThreadGlobalData& threadGlobalDataSlow();
#else
WEBCORE_EXPORT ThreadGlobalData& threadGlobalDataSlow() PURE_FUNCTION;
#endif

#if USE(WEB_THREAD)
inline ThreadGlobalData& threadGlobalData()
#else
inline PURE_FUNCTION ThreadGlobalData& threadGlobalData()
#endif
{
#if HAVE(FAST_TLS)
    if (auto* thread = Thread::currentMayBeNull(); LIKELY(thread)) {
        if (auto* clientData = thread->m_clientData.get(); LIKELY(clientData))
            return *static_cast<ThreadGlobalData*>(clientData);
    }
#else
    auto& thread = Thread::current();
    auto* clientData = thread.m_clientData.get();
    if (LIKELY(clientData))
        return *static_cast<ThreadGlobalData*>(clientData);
#endif
    return threadGlobalDataSlow();
}

} // namespace WebCore
