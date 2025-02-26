/*
 * Copyright (C) 2007, 2008 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/Markable.h>
#include <wtf/Threading.h>
#include <wtf/WallTime.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class DatabaseDetails {
public:
    DatabaseDetails() = default;

    DatabaseDetails(const DatabaseDetails& details)
        : m_name(details.m_name)
        , m_displayName(details.m_displayName)
        , m_expectedUsage(details.m_expectedUsage)
        , m_currentUsage(details.m_currentUsage)
        , m_creationTime(details.m_creationTime)
        , m_modificationTime(details.m_modificationTime)
#if ASSERT_ENABLED
        , m_thread(details.m_thread.copyRef())
#endif
    {
    }

    DatabaseDetails& operator=(const DatabaseDetails& details)
    {
        m_name = details.m_name;
        m_displayName = details.m_displayName;
        m_expectedUsage = details.m_expectedUsage;
        m_currentUsage = details.m_currentUsage;
        m_creationTime = details.m_creationTime;
        m_modificationTime = details.m_modificationTime;
#if ASSERT_ENABLED
        m_thread = details.m_thread.copyRef();
#endif
        return *this;
    }

    DatabaseDetails(const String& databaseName, const String& displayName, uint64_t expectedUsage, uint64_t currentUsage, std::optional<WallTime> creationTime, std::optional<WallTime> modificationTime)
        : m_name(databaseName)
        , m_displayName(displayName)
        , m_expectedUsage(expectedUsage)
        , m_currentUsage(currentUsage)
        , m_creationTime(creationTime)
        , m_modificationTime(modificationTime)
    {
    }

    const String& name() const { return m_name; }
    const String& displayName() const { return m_displayName; }
    uint64_t expectedUsage() const { return m_expectedUsage; }
    uint64_t currentUsage() const { return m_currentUsage; }
    std::optional<WallTime> creationTime() const { return m_creationTime; }
    std::optional<WallTime> modificationTime() const { return m_modificationTime; }
#if ASSERT_ENABLED
    Thread& thread() const { return m_thread.get(); }
#endif

private:
    String m_name;
    String m_displayName;
    uint64_t m_expectedUsage { 0 };
    uint64_t m_currentUsage { 0 };
    Markable<WallTime> m_creationTime;
    Markable<WallTime> m_modificationTime;
#if ASSERT_ENABLED
    Ref<Thread> m_thread { Thread::current() };
#endif
};

} // namespace WebCore
