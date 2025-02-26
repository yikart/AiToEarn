/*
 * Copyright (C) 2009 Apple Inc. All rights reserved.
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

#include <wtf/URL.h>
#include "UserContentTypes.h"
#include "UserScriptTypes.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace WebCore {

class UserScript {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(UserScript, WEBCORE_EXPORT);
public:
    ~UserScript() = default;
    UserScript(const UserScript&) = default;
    UserScript(UserScript&&) = default;
    UserScript& operator=(const UserScript&) = default;
    UserScript& operator=(UserScript&&) = default;

    WEBCORE_EXPORT UserScript(String&&, URL&&, Vector<String>&&, Vector<String>&&, UserScriptInjectionTime, UserContentInjectedFrames, WaitForNotificationBeforeInjecting);

    const String& source() const { return m_source; }
    const URL& url() const { return m_url; }
    const Vector<String>& allowlist() const { return m_allowlist; }
    const Vector<String>& blocklist() const { return m_blocklist; }
    UserScriptInjectionTime injectionTime() const { return m_injectionTime; }
    UserContentInjectedFrames injectedFrames() const { return m_injectedFrames; }
    WaitForNotificationBeforeInjecting waitForNotificationBeforeInjecting() const { return m_waitForNotificationBeforeInjecting; }

private:
    String m_source;
    URL m_url;
    Vector<String> m_allowlist;
    Vector<String> m_blocklist;
    UserScriptInjectionTime m_injectionTime { UserScriptInjectionTime::DocumentStart };
    UserContentInjectedFrames m_injectedFrames { UserContentInjectedFrames::InjectInAllFrames };
    WaitForNotificationBeforeInjecting m_waitForNotificationBeforeInjecting { WaitForNotificationBeforeInjecting::No };
};

} // namespace WebCore
